import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Volume2, Mic, MicOff, RotateCcw, Square } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, getVoiceMoodConfig } from '../utils';
import { vibrate } from '../services/capacitor';
import { VoiceServiceEnhanced } from '../services/voice-enhanced';

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

const AlarmRingingEnhanced: React.FC<AlarmRingingProps> = ({ alarm, onDismiss, onSnooze }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackAudioRef = useRef<{stop: () => void} | null>(null);
  
  const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
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
      stopAllAudio();
    };
  }, [alarm.id]); // Dependencies for the effect

  // Functions moved inside useEffect to fix dependency warnings

  const startVibrationPattern = () => {
    // Vibrate every 2 seconds
    vibrateIntervalRef.current = setInterval(() => {
      if (isPlaying) {
        vibrate(1000);
      }
    }, 2000);
  };

  const stopVibrationPattern = () => {
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
  };

  const playAlarmSound = async () => {
    try {
      if (voiceEnabled) {
        // Start repeating voice messages every 30 seconds
        const stopRepeating = await VoiceServiceEnhanced.startRepeatingAlarmMessage(alarm, 30000);
        stopVoiceRef.current = stopRepeating;
        console.log('Voice alarm started successfully');
      } else {
        // Fallback to beep sound
        playFallbackSound();
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
      setVoiceEnabled(false);
      playFallbackSound();
    }
  };

  const playFallbackSound = () => {
    try {
      let intervalRef: NodeJS.Timeout | null = null;
      let isActive = true;
      
      const createBeep = () => {
        if (!isActive || !isPlaying) return;
        
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
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
        } catch (err) {
          console.error('Error creating beep:', err);
        }
      };
      
      // Create repeating beep pattern
      createBeep();
      intervalRef = setInterval(createBeep, 2000);
      
      // Store fallback audio control
      fallbackAudioRef.current = {
        stop: () => {
          isActive = false;
          if (intervalRef) {
            clearInterval(intervalRef);
            intervalRef = null;
          }
        }
      };
      
    } catch (error) {
      console.error('Error playing fallback sound:', error);
    }
  };

  const stopAllAudio = () => {
    // Stop voice
    if (stopVoiceRef.current) {
      stopVoiceRef.current();
      stopVoiceRef.current = null;
    }
    VoiceServiceEnhanced.stopSpeech();
    
    // Stop fallback audio
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.stop();
      fallbackAudioRef.current = null;
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
      if (isPlaying) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
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

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = (command: string) => {
    const dismissCommands = ['stop', 'dismiss', 'turn off', 'shut up', 'quiet', 'cancel', 'end'];
    const snoozeCommands = ['snooze', 'five more minutes', 'later', 'wait', 'sleep', 'more time'];
    
    console.log('Processing voice command:', command);
    
    if (dismissCommands.some(cmd => command.includes(cmd))) {
      handleDismiss('voice');
    } else if (snoozeCommands.some(cmd => command.includes(cmd))) {
      handleSnooze();
    }
  };

  const handleDismiss = (method: 'voice' | 'button' | 'shake') => {
    console.log(`Alarm dismissed via ${method}`);
    setIsPlaying(false);
    stopVibrationPattern();
    stopVoiceRecognition();
    stopAllAudio();
    
    onDismiss(alarm.id, method);
  };

  const handleSnooze = () => {
    console.log('Alarm snoozed');
    setIsPlaying(false);
    stopVibrationPattern();
    stopVoiceRecognition();
    stopAllAudio();
    
    onSnooze(alarm.id);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      // Switching to voice
      stopAllAudio();
      playAlarmSound();
    } else {
      // Switching to beep
      stopAllAudio();
      playFallbackSound();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex flex-col items-center justify-center p-4 text-white safe-top safe-bottom">
      {/* Pulsing alarm indicator */}
      <div className="relative mb-8">
        <div className="pulsing-alarm w-32 h-32 absolute -inset-4" />
        <div className="pulsing-alarm w-24 h-24 absolute -inset-2" />
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shaking-alarm">
          <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
        </div>
      </div>

      {/* Current time */}
      <div className="text-6xl font-bold mb-4 text-center">
        {formatTime(currentTime.toTimeString().slice(0, 5))}
      </div>

      {/* Alarm details */}
      <div className="text-center mb-8">
        <div className="text-2xl font-semibold mb-2">
          {alarm.label}
        </div>
        <div className="flex items-center justify-center gap-2 text-lg opacity-90">
          <span>{voiceMoodConfig.icon}</span>
          <span>{voiceMoodConfig.name} mode</span>
          {voiceEnabled && <Volume2 className="w-4 h-4 text-green-400" aria-hidden="true" />}
        </div>
      </div>

      {/* Voice recognition status */}
      <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-8 min-h-[100px] w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          {isListening ? (
            <Mic className="w-5 h-5 text-green-400 animate-pulse" aria-hidden="true" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">
            {isListening ? 'Listening for commands...' : 'Voice recognition paused'}
          </span>
        </div>
        
        {transcript && (
          <div className="text-sm text-gray-200 mb-2">
            You said: "{transcript}"
          </div>
        )}
        
        <div className="text-xs text-gray-300 mb-2">
          Say "stop" to dismiss or "snooze" for 5 more minutes
        </div>
        
        <button
          onClick={toggleVoice}
          className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
        >
          {voiceEnabled ? 'Switch to Beep' : 'Switch to Voice'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => handleDismiss('button')}
          className="bg-white text-red-600 py-4 px-6 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Square className="w-5 h-5" aria-hidden="true" />
          Stop Alarm
        </button>
        
        <button
          onClick={handleSnooze}
          className="bg-black bg-opacity-30 border-2 border-white text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          Snooze 5 min
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center mt-8 text-sm opacity-75 max-w-xs">
        <p>Shake your device or use voice commands to dismiss the alarm</p>
        {voiceEnabled && (
          <p className="mt-2">Voice commands: "stop", "dismiss", "snooze", "later"</p>
        )}
      </div>

      {/* Snooze count */}
      {alarm.snoozeCount > 0 && (
        <div className="absolute top-safe-top left-4 bg-black bg-opacity-30 rounded-lg px-3 py-2">
          <div className="text-sm font-medium">
            Snoozed {alarm.snoozeCount} time{alarm.snoozeCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Voice status indicator */}
      <div className="absolute top-safe-top right-4 bg-black bg-opacity-30 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          {voiceEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-green-400" aria-hidden="true" />
              <span>Voice Active</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <span>Beep Mode</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlarmRingingEnhanced;