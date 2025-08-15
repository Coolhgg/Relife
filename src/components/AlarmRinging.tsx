import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Mic, MicOff, RotateCcw, Square } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, getVoiceMoodConfig } from '../utils';
import { vibrate } from '../services/capacitor';
import { AudioManager } from '../services/audio-manager';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface AlarmRingingProps {
  alarm: Alarm;
  onDismiss: (alarmId: string, method: 'voice' | 'button' | 'shake') => void;
  onSnooze: (alarmId: string) => void;
}

const AlarmRinging: React.FC<AlarmRingingProps> = ({ alarm, onDismiss, onSnooze }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCommand, setLastCommand] = useState('');
  const [alarmAnnounced, setAlarmAnnounced] = useState(false);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

  // Effect for focus management
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (stopButtonRef.current) {
        stopButtonRef.current.focus({ preventScroll: true });
      }
    }, 500);

    return () => {
      clearTimeout(focusTimeout);
    };
  }, []);

  useEffect(() => {
    const startVibrationPattern = () => {
      // Vibrate every 2 seconds
      vibrateIntervalRef.current = setInterval(() => {
        vibrate(1000);
      }, 2000);
    };

    const playAlarmSound = async () => {
      try {
        // Use optimized audio manager for instant playback
        const audioManager = AudioManager.getInstance();
        await audioManager.playAlarmAudio(alarm);
        // AudioManager handles its own fallbacks internally
      } catch (error) {
        console.error('Error playing alarm audio:', error);
        // Additional fallback if AudioManager fails completely
        playFallbackSound();
      }
    };

    const startVoiceRecognition = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript);
          processVoiceCommand(finalTranscript.toLowerCase().trim());
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Restart recognition if alarm is still ringing
        if (isPlaying && recognitionRef.current) {
          recognitionRestartTimeoutRef.current = setTimeout(() => {
            try {
              if (isPlaying && recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (error) {
              console.error('Error restarting recognition:', error);
            }
          }, 1000);
        }
      };

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
      }
    };
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Focus is handled by separate effect above

    // Announce alarm to screen readers after a brief delay
    setTimeout(() => {
      setAlarmAnnounced(true);
    }, 1000);

    // Start vibration pattern
    startVibrationPattern();

    // Play alarm sound/voice
    playAlarmSound();

    // Start voice recognition
    startVoiceRecognition();

    return () => {
      clearInterval(timeInterval);
      stopVibrationPattern();
      stopVoiceRecognition();
      stopBeepSound();
      const currentAudio = audioRef.current;
      if (currentAudio) {
        currentAudio.pause();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current);
        recognitionRestartTimeoutRef.current = null;
      }
    };
  }, [alarm.id]); // Only depend on alarm.id to avoid recreating effects

  const stopVibrationPattern = () => {
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
  };

  const playFallbackSound = () => {
    try {
      // Create AudioContext only once
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      if (!context || context.state === 'closed') return;
      
      // Stop any existing beep
      stopBeepSound();
      
      // Create a repeating beep pattern
      const createBeep = () => {
        if (!isPlaying || !context || context.state === 'closed') return;
        
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
      };
      
      // Create initial beep
      createBeep();
      
      // Set up repeating pattern with cleanup
      beepIntervalRef.current = setInterval(() => {
        if (isPlaying) {
          createBeep();
        } else {
          stopBeepSound();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error playing fallback sound:', error);
    }
  };
  
  const stopBeepSound = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  };

  // startVoiceRecognition moved inside useEffect

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }
  };

  const processVoiceCommand = (command: string) => {
    const dismissCommands = ['stop', 'dismiss', 'turn off', 'shut up', 'quiet'];
    const snoozeCommands = ['snooze', 'five more minutes', 'later', 'wait'];
    
    if (dismissCommands.some(cmd => command.includes(cmd))) {
      setLastCommand('dismiss');
      handleDismiss('voice');
    } else if (snoozeCommands.some(cmd => command.includes(cmd))) {
      setLastCommand('snooze');
      handleSnooze();
    } else {
      setLastCommand('unrecognized');
    }
  };

  const handleDismiss = (method: 'voice' | 'button' | 'shake') => {
    setIsPlaying(false);
    stopVibrationPattern();
    stopVoiceRecognition();
    stopBeepSound();
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    onDismiss(alarm.id, method);
  };

  const handleSnooze = () => {
    setIsPlaying(false);
    stopVibrationPattern();
    stopVoiceRecognition();
    stopBeepSound();
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    onSnooze(alarm.id);
  };

  return (
    <main 
      className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex flex-col items-center justify-center p-4 text-white safe-top safe-bottom"
      role="alertdialog"
      aria-labelledby="alarm-title"
      aria-describedby="alarm-description"
      aria-live="assertive"
    >
      {/* Screen reader announcements */}
      {alarmAnnounced && (
        <div className="sr-only" role="alert" aria-live="assertive">
          Alarm ringing! {alarm.label} at {formatTime(currentTime.toTimeString().slice(0, 5))}. 
          Use voice commands like "stop" to dismiss or "snooze" for 5 more minutes, 
          or use the buttons below.
        </div>
      )}
      
      {lastCommand && (
        <div className="sr-only" role="status" aria-live="polite">
          {lastCommand === 'dismiss' && 'Voice command recognized: Dismissing alarm'}
          {lastCommand === 'snooze' && 'Voice command recognized: Snoozing alarm for 5 minutes'}
          {lastCommand === 'unrecognized' && 'Voice command not recognized. Say "stop" to dismiss or "snooze" for 5 minutes.'}
        </div>
      )}
      {/* Pulsing alarm indicator */}
      <div className="relative mb-8" role="img" aria-label="Alarm is ringing - urgent attention required">
        <div className="pulsing-alarm w-32 h-32 absolute -inset-4" aria-hidden="true" />
        <div className="pulsing-alarm w-24 h-24 absolute -inset-2" aria-hidden="true" />
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shaking-alarm">
          <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
        </div>
      </div>

      {/* Current time */}
      <div 
        className="text-6xl font-bold mb-4 text-center"
        role="timer"
        aria-live="polite"
        aria-label={`Current time: ${formatTime(currentTime.toTimeString().slice(0, 5))}`}
      >
        <span aria-hidden="true">{formatTime(currentTime.toTimeString().slice(0, 5))}</span>
      </div>

      {/* Alarm details */}
      <div className="text-center mb-8">
        <h1 
          id="alarm-title"
          className="text-2xl font-semibold mb-2"
        >
          {alarm.label}
        </h1>
        <div 
          id="alarm-description"
          className="flex items-center justify-center gap-2 text-lg opacity-90"
          role="img"
          aria-label={`Voice mood: ${voiceMoodConfig.name} mode`}
        >
          <span aria-hidden="true">{voiceMoodConfig.icon}</span>
          <span>{voiceMoodConfig.name} mode</span>
        </div>
      </div>

      {/* Voice recognition status */}
      <section 
        className="bg-black bg-opacity-30 rounded-lg p-4 mb-8 min-h-[80px] w-full max-w-sm"
        role="region"
        aria-labelledby="voice-status-heading"
      >
        <h2 id="voice-status-heading" className="sr-only">Voice Recognition Status</h2>
        <div className="flex items-center gap-2 mb-2">
          {isListening ? (
            <Mic className="w-5 h-5 text-green-400 animate-pulse" aria-hidden="true" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" aria-hidden="true" />
          )}
          <span 
            className="text-sm font-medium"
            role="status"
            aria-live="polite"
            aria-label={isListening ? 'Voice recognition is active and listening' : 'Voice recognition is paused'}
          >
            {isListening ? 'Listening...' : 'Voice recognition paused'}
          </span>
        </div>
        
        {transcript && (
          <div 
            className="text-sm text-gray-200"
            role="status"
            aria-live="polite"
            aria-label={`You said: ${transcript}`}
          >
            You said: "{transcript}"
          </div>
        )}
        
        <div className="text-xs text-gray-300 mt-2" role="note">
          Say "stop" to dismiss or "snooze" for 5 more minutes
        </div>
      </section>

      {/* Action buttons */}
      <section 
        className="flex flex-col gap-4 w-full max-w-sm"
        role="group"
        aria-labelledby="alarm-actions-heading"
      >
        <h2 id="alarm-actions-heading" className="sr-only">Alarm Actions</h2>
        <button
          ref={stopButtonRef}
          onClick={() => handleDismiss('button')}
          className="bg-white text-red-600 py-4 px-6 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          aria-label={`Stop alarm: ${alarm.label}`}
          aria-describedby="stop-button-desc"
        >
          <Square className="w-5 h-5" aria-hidden="true" />
          Stop Alarm
          <span id="stop-button-desc" className="sr-only">
            Immediately dismiss the alarm and stop all sounds and vibrations
          </span>
        </button>
        
        <button
          onClick={handleSnooze}
          className="bg-black bg-opacity-30 border-2 border-white text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-opacity-40 transition-colors flex items-center justify-center gap-2"
          aria-label={`Snooze alarm: ${alarm.label} for 5 minutes`}
          aria-describedby="snooze-button-desc"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          Snooze 5 min
          <span id="snooze-button-desc" className="sr-only">
            Temporarily stop the alarm and have it ring again in 5 minutes
          </span>
        </button>
      </section>

      {/* Instructions */}
      <section 
        className="text-center mt-8 text-sm opacity-75 max-w-xs"
        role="note"
        aria-labelledby="instructions-heading"
      >
        <h3 id="instructions-heading" className="sr-only">Alternative Controls</h3>
        <p>Shake your device or use voice commands to dismiss the alarm</p>
      </section>

      {/* Snooze count */}
      {alarm.snoozeCount > 0 && (
        <div 
          className="absolute top-safe-top left-4 bg-black bg-opacity-30 rounded-lg px-3 py-2"
          role="status"
          aria-label={`This alarm has been snoozed ${alarm.snoozeCount} time${alarm.snoozeCount !== 1 ? 's' : ''}`}
        >
          <div className="text-sm font-medium">
            Snoozed {alarm.snoozeCount} time{alarm.snoozeCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </main>
  );
};

export default AlarmRinging;