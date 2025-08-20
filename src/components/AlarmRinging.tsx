import React from "react";
import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  Square,
  Target,
} from "lucide-react";
import type { Alarm, User } from "../types";
import { formatTime, getVoiceMoodConfig } from "../utils";
import { vibrate } from "../services/capacitor";
import { VoiceService } from "../services/voice-pro";
import {
  VoiceRecognitionService,
  type VoiceCommand,
} from "../services/voice-recognition";
import { VoiceServiceEnhanced } from "../services/voice-enhanced";
import { CustomSoundManager } from "../services/custom-sound-manager";
import { AudioManager } from "../services/audio-manager";
import { NuclearModeChallenge } from "./NuclearModeChallenge";
import { PremiumService } from "../services/premium";
import { nuclearModeService } from "../services/nuclear-mode";
import type {
  NuclearModeSession,
  NuclearModeChallenge as Challenge,
} from "../types";

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
  user: User;
  onDismiss: (
    alarmId: string,
    method: "voice" | "button" | "shake" | "challenge",
  ) => void;
  onSnooze: (alarmId: string) => void;
}

const AlarmRinging: React.FC<AlarmRingingProps> = ({
  alarm,
  user,
  onDismiss,
  onSnooze,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);

  // Nuclear mode state
  const [showNuclearChallenge, setShowNuclearChallenge] = useState(false);
  const [nuclearSession, setNuclearSession] =
    useState<NuclearModeSession | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(
    null,
  );
  const [nuclearSessionActive, setNuclearSessionActive] = useState(false);

  useEffect(() => {
    // Check if this alarm uses nuclear mode
    if (alarm.difficulty === "nuclear") {
      initializeNuclearMode();
    }
  }, [alarm]);

  const initializeNuclearMode = async () => {
    try {
      // Start nuclear session
      const session = await nuclearModeService.startNuclearSession(alarm, user);
      setNuclearSession(session);

      // Get challenges for this alarm
      const challenges = await nuclearModeService.getChallengesForAlarm(
        alarm.id,
      );

      if (challenges.length > 0) {
        setCurrentChallenge(challenges[0]);
        setShowNuclearChallenge(true);
        setNuclearSessionActive(true);
      } else {
        console.warn("No nuclear challenges found for alarm");
        // Fallback to regular alarm
        setShowNuclearChallenge(false);
      }
    } catch (error) {
      console.error("Error initializing nuclear mode:", error);
      // Fallback to regular alarm if nuclear mode fails
      setShowNuclearChallenge(false);
    }
  };

  const stopVoiceRef = useRef<(() => void) | null>(null);
  const stopRecognitionRef = useRef<(() => void) | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackAudioRef = useRef<{ stop: () => void } | null>(null);

  const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Start vibration pattern
    startVibrationPattern();

    // Play alarm sound/voice (unless nuclear mode challenges are active)
    if (!showNuclearChallenge) {
      playAlarmSound();
      // Start voice recognition
      startVoiceRecognition();
    }

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
      // Handle different sound types
      switch (alarm.soundType) {
        case "custom":
          await playCustomSound();
          break;
        case "built-in":
          await playBuiltInSound();
          break;
        case "voice-only":
        default:
          await playVoiceOnlySound();
          break;
      }
    } catch (error) {
      console.error("Error playing alarm sound:", error);
      // Always fallback to voice or beep
      await playVoiceOnlySound();
    }
  };

  const playCustomSound = async () => {
    if (!alarm.customSoundId) {
      console.warn("Custom sound ID not found, falling back to voice");
      await playVoiceOnlySound();
      return;
    }

    try {
      const customSoundManager = CustomSoundManager.getInstance();
      const audioManager = AudioManager.getInstance();

      // Get the custom sound details
      const customSounds = await customSoundManager.getUserCustomSounds(
        alarm.userId,
      );
      const customSound = customSounds.find(
        (s) => s.id === alarm.customSoundId,
      );

      if (!customSound) {
        console.warn("Custom sound not found, falling back to voice");
        await playVoiceOnlySound();
        return;
      }

      // Play the custom sound with repeat
      let customAudioNode: AudioBufferSourceNode | null = null;
      const playCustomAudio = async () => {
        if (!isPlaying) return;

        try {
          customAudioNode = await audioManager.playCustomSound(customSound, {
            volume: 0.8,
            onEnded: () => {
              // Repeat the sound every 3 seconds
              setTimeout(() => {
                if (isPlaying) {
                  playCustomAudio();
                }
              }, 3000);
            },
          });
        } catch (error) {
          console.error("Error playing custom sound:", error);
          playFallbackSound();
        }
      };

      await playCustomAudio();

      // Store cleanup function
      stopVoiceRef.current = () => {
        if (customAudioNode) {
          customAudioNode.stop();
        }
      };

      // Also play voice message alongside custom sound if voice is enabled
      if (voiceEnabled) {
        const stopVoiceRepeating =
          await VoiceService.startRepeatingAlarmMessage(alarm, 45000); // Less frequent with custom sound
        const originalStop = stopVoiceRef.current;
        stopVoiceRef.current = () => {
          originalStop?.();
          stopVoiceRepeating?.();
        };
      }
    } catch (error) {
      console.error("Error with custom sound:", error);
      await playVoiceOnlySound();
    }
  };

  const playBuiltInSound = async () => {
    // For now, built-in sounds work similar to custom sounds
    // but could be handled differently in the future
    try {
      // Get built-in sound URL from alarm.sound property
      const soundUrl = alarm.sound || "/sounds/gentle_bells.mp3";
      const audioManager = AudioManager.getInstance();

      let audioNode: AudioBufferSourceNode | null = null;
      const playBuiltInAudio = async () => {
        if (!isPlaying) return;

        try {
          audioNode = await audioManager.playAudioFile(soundUrl, {
            volume: 0.8,
            onEnded: () => {
              // Repeat the sound every 3 seconds
              setTimeout(() => {
                if (isPlaying) {
                  playBuiltInAudio();
                }
              }, 3000);
            },
          });
        } catch (error) {
          console.error("Error playing built-in sound:", error);
          playFallbackSound();
        }
      };

      await playBuiltInAudio();

      // Store cleanup function
      stopVoiceRef.current = () => {
        if (audioNode) {
          audioNode.stop();
        }
      };

      // Also play voice message alongside built-in sound if voice is enabled
      if (voiceEnabled) {
        const stopVoiceRepeating =
          await VoiceService.startRepeatingAlarmMessage(alarm, 45000);
        const originalStop = stopVoiceRef.current;
        stopVoiceRef.current = () => {
          originalStop?.();
          stopVoiceRepeating?.();
        };
      }
    } catch (error) {
      console.error("Error with built-in sound:", error);
      await playVoiceOnlySound();
    }
  };

  const playVoiceOnlySound = async () => {
    try {
      if (voiceEnabled) {
        // Start repeating voice messages every 30 seconds
        const stopRepeating = await VoiceService.startRepeatingAlarmMessage(
          alarm,
          30000,
        );
        stopVoiceRef.current = stopRepeating;
        console.log("Enhanced voice alarm started successfully");
      } else {
        // Fallback to beep sound
        playFallbackSound();
      }
    } catch (error) {
      console.error("Error playing enhanced voice message:", error);
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
          const context = new (window.AudioContext ||
            window.webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(context.destination);

          oscillator.frequency.value = 800;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            context.currentTime + 0.5,
          );

          oscillator.start();
          oscillator.stop(context.currentTime + 0.5);
        } catch (err) {
          console.error("Error creating beep:", err);
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
        },
      };
    } catch (error) {
      console.error("Error playing fallback sound:", error);
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

  const startVoiceRecognition = async () => {
    try {
      const stopRecognition = await VoiceRecognitionService.startListening(
        (command: VoiceCommand) => {
          console.log("Enhanced voice command received:", command);
          setLastCommand(command);
          setTranscript(command.command);
          setRecognitionConfidence(command.confidence);
          processEnhancedVoiceCommand(command);
        },
        (transcript: string, confidence: number) => {
          setInterimTranscript(transcript);
          setRecognitionConfidence(confidence);
        },
        (error: string) => {
          console.error("Enhanced voice recognition error:", error);
          setIsListening(false);
        },
      );

      stopRecognitionRef.current = stopRecognition;
      setIsListening(true);
    } catch (error) {
      console.error("Error starting enhanced voice recognition:", error);
    }
  };

  const stopVoiceRecognition = () => {
    if (stopRecognitionRef.current) {
      stopRecognitionRef.current();
      stopRecognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript("");
    setInterimTranscript("");
    setRecognitionConfidence(0);
  };

  const processEnhancedVoiceCommand = (command: VoiceCommand) => {
    console.log("Processing enhanced voice command:", {
      intent: command.intent,
      confidence: command.confidence,
      command: command.command,
      entities: command.entities,
    });

    // Only act on high-confidence commands
    if (command.confidence < 0.5) {
      console.log("Command confidence too low, ignoring");
      return;
    }

    switch (command.intent) {
      case "dismiss":
        handleDismiss("voice");
        break;
      case "snooze":
        handleSnooze();
        break;
      default:
        console.log("Unknown voice command intent");
    }
  };

  const handleDismiss = (
    method: "voice" | "button" | "shake" | "challenge",
  ) => {
    console.log(`Alarm dismissed via ${method}`);
    setIsPlaying(false);
    stopVibrationPattern();
    stopVoiceRecognition();
    stopAllAudio();

    // Reset nuclear mode states
    setShowNuclearChallenge(false);
    setNuclearSessionActive(false);
    setNuclearSession(null);
    setCurrentChallenge(null);

    onDismiss(alarm.id, method);
  };

  const handleSnooze = () => {
    // Nuclear mode doesn't allow snoozing
    if (alarm.difficulty === "nuclear" || nuclearSessionActive) {
      console.log("Snooze not allowed in nuclear mode");
      return;
    }

    console.log("Alarm snoozed");
    setIsPlaying(false);
    stopVibrationPattern();
    stopVoiceRecognition();
    stopAllAudio();

    onSnooze(alarm.id);
  };

  const toggleVoice = () => {
    // Don't allow voice toggle during nuclear challenges
    if (nuclearSessionActive && showNuclearChallenge) {
      return;
    }

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

  // Nuclear mode challenge handlers
  const handleChallengeComplete = async (successful: boolean, data?: any) => {
    if (!nuclearSession || !currentChallenge) return;

    try {
      const result = await nuclearModeService.processChallengeAttempt(
        nuclearSession.id,
        currentChallenge.id,
        {
          successful,
          timeToComplete: data?.timeToComplete,
          hintsUsed: data?.hintsUsed,
          errorsMade: data?.errorsMade,
          details: data,
        },
      );

      if (result.sessionComplete) {
        // All challenges completed - dismiss alarm
        handleDismiss("challenge");
      } else if (result.continueSession && result.nextChallenge) {
        // Move to next challenge
        setCurrentChallenge(result.nextChallenge);
      } else {
        // Session failed - keep alarm ringing
        setShowNuclearChallenge(false);
        setNuclearSessionActive(false);
        // Resume normal alarm behavior
        playAlarmSound();
        startVoiceRecognition();
      }
    } catch (error) {
      console.error("Error processing challenge attempt:", error);
      // Fallback to normal alarm
      setShowNuclearChallenge(false);
      setNuclearSessionActive(false);
    }
  };

  const handleSessionComplete = () => {
    handleDismiss("challenge");
  };

  const handleSessionFailed = () => {
    setShowNuclearChallenge(false);
    setNuclearSessionActive(false);
    // Resume normal alarm behavior
    playAlarmSound();
    startVoiceRecognition();
  };

  // If nuclear mode is active and showing challenge, render the challenge component
  if (showNuclearChallenge && nuclearSession && currentChallenge) {
    return (
      <div className="min-h-screen">
        <NuclearModeChallenge
          session={nuclearSession}
          currentChallenge={currentChallenge}
          onChallengeComplete={handleChallengeComplete}
          onSessionComplete={handleSessionComplete}
          onSessionFailed={handleSessionFailed}
        />
      </div>
    );
  }

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
        <div className="text-2xl font-semibold mb-2">{alarm.label}</div>
        <div className="flex items-center justify-center gap-2 text-lg opacity-90">
          <span>{voiceMoodConfig.icon}</span>
          <span>{voiceMoodConfig.name} mode</span>
          {voiceEnabled && (
            <Volume2 className="w-4 h-4 text-green-400" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Voice recognition status */}
      <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-8 min-h-[100px] w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          {isListening ? (
            <Mic
              className="w-5 h-5 text-green-400 animate-pulse"
              aria-hidden="true"
            />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">
            {isListening
              ? "Listening for commands..."
              : "Voice recognition paused"}
          </span>
        </div>

        {transcript && (
          <div className="text-sm text-gray-200 mb-2">
            You said: "{transcript}"
          </div>
        )}

        <div className="text-xs text-gray-300 mb-2">
          Say "stop" to dismiss or "snooze" for {alarm.snoozeInterval || 5} more
          minutes
        </div>

        {!(nuclearSessionActive && showNuclearChallenge) && (
          <button
            onClick={toggleVoice}
            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
          >
            {voiceEnabled ? "Switch to Beep" : "Switch to Voice"}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => handleDismiss("button")}
          className="bg-white text-red-600 py-4 px-6 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Square className="w-5 h-5" aria-hidden="true" />
          Stop Alarm
        </button>

        {/* Only show snooze button if not in nuclear mode */}
        {!(alarm.difficulty === "nuclear" || nuclearSessionActive) && (
          <button
            onClick={handleSnooze}
            className="bg-black bg-opacity-30 border-2 border-white text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
            Snooze {alarm.snoozeInterval || 5} min
          </button>
        )}

        {/* Nuclear mode indicator */}
        {alarm.difficulty === "nuclear" && (
          <div className="bg-red-800 bg-opacity-50 border-2 border-red-400 text-red-100 py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            <Target className="w-4 h-4" aria-hidden="true" />
            Nuclear Mode Active - Snoozing Disabled
          </div>
        )}
      </div>

      {/* Enhanced Instructions */}
      <div className="text-center mt-8 text-sm opacity-75 max-w-xs">
        <p>Shake your device or use voice commands to dismiss the alarm</p>
        {voiceEnabled && (
          <div className="mt-2 space-y-1">
            <p>
              Enhanced voice commands: "stop", "dismiss", "snooze", "
              {alarm.snoozeInterval || 5} more minutes"
            </p>
            {isListening && (
              <p className="text-green-400">
                🎤 Listening with enhanced recognition...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nuclear mode warning */}
      {alarm.difficulty === "nuclear" && (
        <div className="absolute top-safe-top left-4 bg-red-800 bg-opacity-70 rounded-lg px-3 py-2 border border-red-400">
          <div className="text-sm space-y-1">
            <div className="font-bold text-red-100 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Nuclear Mode
            </div>
            <div className="text-xs text-red-200">
              Complete challenges to dismiss
            </div>
          </div>
        </div>
      )}

      {/* Snooze count and limits */}
      {(alarm.snoozeCount > 0 || (alarm.maxSnoozes && alarm.maxSnoozes > 0)) &&
        alarm.difficulty !== "nuclear" && (
          <div className="absolute top-safe-top left-4 bg-black bg-opacity-30 rounded-lg px-3 py-2">
            <div className="text-sm space-y-1">
              {alarm.snoozeCount > 0 && (
                <div className="font-medium">
                  Snoozed {alarm.snoozeCount} time
                  {alarm.snoozeCount !== 1 ? "s" : ""}
                </div>
              )}

              {alarm.maxSnoozes && alarm.maxSnoozes > 0 && (
                <div
                  className={`text-xs ${
                    alarm.snoozeCount >= alarm.maxSnoozes
                      ? "text-red-300 font-bold"
                      : "text-yellow-300"
                  }`}
                >
                  {alarm.snoozeCount >= alarm.maxSnoozes
                    ? "Max snoozes reached!"
                    : `${alarm.maxSnoozes - alarm.snoozeCount} snooze${alarm.maxSnoozes - alarm.snoozeCount !== 1 ? "s" : ""} left`}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Enhanced Voice status indicator */}
      <div className="absolute top-safe-top right-4 bg-black bg-opacity-30 rounded-lg px-3 py-2 min-w-[200px]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {voiceEnabled ? (
              <>
                <Volume2
                  className="w-4 h-4 text-green-400"
                  aria-hidden="true"
                />
                <span>Enhanced Voice Active</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <span>Beep Mode</span>
              </>
            )}
          </div>

          {voiceEnabled && isListening && (
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <Mic className="w-3 h-3 text-green-400 animate-pulse" />
                ) : (
                  <MicOff className="w-3 h-3 text-gray-400" />
                )}
                <span>Recognition: {isListening ? "Active" : "Inactive"}</span>
              </div>

              {recognitionConfidence > 0 && (
                <div className="text-xs">
                  <span>
                    Confidence: {Math.round(recognitionConfidence * 100)}%
                  </span>
                  <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        recognitionConfidence > 0.7
                          ? "bg-green-400"
                          : recognitionConfidence > 0.5
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${recognitionConfidence * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {interimTranscript && (
                <div className="text-xs text-gray-300 italic">
                  Hearing: "{interimTranscript}"
                </div>
              )}

              {lastCommand && (
                <div className="text-xs border-t border-gray-600 pt-1 mt-1">
                  <div
                    className={`font-semibold ${
                      lastCommand.intent === "dismiss"
                        ? "text-red-400"
                        : lastCommand.intent === "snooze"
                          ? "text-yellow-400"
                          : "text-gray-400"
                    }`}
                  >
                    Last: {lastCommand.intent.toUpperCase()}
                  </div>
                  <div className="truncate">
                    "{lastCommand.command.substring(0, 20)}..."
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlarmRinging;
