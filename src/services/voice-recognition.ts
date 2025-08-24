import { VoiceProService, RecognitionResult } from './voice-pro';

export interface VoiceCommand {
  command: string;
  confidence: number;
  intent: 'dismiss' | 'snooze' | 'unknown';
  entities: { [key: string]: string };
  timestamp: Date;
}

export interface RecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  noiseReduction: boolean;
  adaptiveThreshold: boolean;
}

export class VoiceRecognitionService {
  private static recognition: SpeechRecognition | null = null;
  private static isListening = false;
  private static config: RecognitionConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.6,
    noiseReduction: true,
    adaptiveThreshold: true,
  };

  // Enhanced command patterns with context awareness
  private static commandPatterns = {
    dismiss: {
      exact: [
        'stop',
        'stop alarm',
        'turn off',
        'turn off alarm',
        'dismiss',
        'dismiss alarm',
        'shut up',
        'quiet',
        'silence',
        'cancel',
        'cancel alarm',
        'end',
        'end alarm',
        'off',
        'alarm off',
        'no more',
        'enough',
        'wake up',
        'im up',
        "i'm up",
        'ok',
        'okay',
        'alright',
        'fine',
        'done',
        'finished',
      ],
      patterns: [
        /^(stop|turn off|shut up|dismiss|cancel|end)\s*(the\s*)?(alarm|ringing)?$/i,
        /^(ok|okay|alright|fine)\s*(i'm?\s*)?(up|awake|ready)$/i,
        /^(enough|no more)\s*(alarm|noise|sound)?$/i,
        /^(silence|quiet)\s*(please|now)?$/i,
      ],
    },
    snooze: {
      exact: [
        'snooze',
        'snooze alarm',
        'five more minutes',
        'five minutes',
        '5 minutes',
        'five more',
        '5 more',
        'later',
        'wait',
        'sleep',
        'more time',
        'not yet',
        'too early',
        'few more minutes',
        'bit longer',
        'little longer',
        'postpone',
        'delay',
        'reschedule',
      ],
      patterns: [
        /^(snooze|postpone|delay)\s*(the\s*)?(alarm|for)?$/i,
        /^(\d+|five|ten|fifteen)\s*(more\s*)?(minutes?)$/i,
        /^(later|wait|sleep)\s*(please|a bit|some more)?$/i,
        /^(not yet|too early)\s*(please)?$/i,
        /^(few|bit|little)\s*(more\s*)?(minutes?|time)$/i,
      ],
    },
  };

  // Context-aware thresholds
  private static confidenceThresholds = {
    dismiss: 0.65, // Higher threshold for dismissing
    snooze: 0.6, // Lower threshold for snoozing
    unknown: 0.4, // Fallback threshold
  };

  // Adaptive learning data
  private static commandHistory: VoiceCommand[] = [];
  private static userPreferences = {
    preferredCommands: new Map<string, TimeoutHandle>(),
    avgConfidence: new Map<string, TimeoutHandle>(),
    timeOfDayPatterns: new Map<string, string[]>(),
  };

  static async initialize(config?: Partial<RecognitionConfig>): Promise<boolean> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Load user preferences
      await this.loadUserPreferences();

      return true;
    } catch (error) {
      console.error('Error initializing voice recognition:', error);
      return false;
    }
  }

  static async startListening(
    onCommand: (command: VoiceCommand) => void,
    onInterim?: (transcript: string, confidence: number) => void,
    onError?: (error: string) => void
  ): Promise<() => void> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError?.('Speech recognition not supported in this browser');
      return () => {};
    }

    // Initialize voice recognition through VoiceProService
    const stopRecognition = await VoiceProService.startVoiceRecognition(
      (result: RecognitionResult) => {
        this.processRecognitionResult(result, onCommand, onInterim);
      },
      onError
    );

    this.isListening = true;
    return () => {
      this.isListening = false;
      stopRecognition();
    };
  }

  private static processRecognitionResult(
    result: RecognitionResult,
    onCommand: (command: VoiceCommand) => void,
    onInterim?: (transcript: string, confidence: number) => void
  ): void {
    const { transcript, confidence, isFinal } = result;

    // Handle interim results
    if (!isFinal && onInterim) {
      onInterim(transcript, confidence);
      return;
    }

    // Only process final results with sufficient confidence
    const minConfidence = this.getAdaptiveConfidence(transcript);
    if (!isFinal || confidence < minConfidence) {
      return;
    }

    // Enhanced command parsing
    const command = this.parseEnhancedCommand(transcript, confidence);

    if (command.intent !== 'unknown') {
      // Log successful command
      this.logCommand(command);

      // Update user preferences
      this.updateUserPreferences(command);

      // Execute command
      onCommand(command);
    }
  }

  private static parseEnhancedCommand(
    transcript: string,
    confidence: number
  ): VoiceCommand {
    const cleanTranscript = transcript.toLowerCase().trim();

    // Try exact matches first
    for (const [intent, patterns] of Object.entries(this.commandPatterns)) {
      const intentKey = intent as 'dismiss' | 'snooze';

      // Check exact matches
      if (
        patterns.exact.some(
          exact => cleanTranscript === exact || cleanTranscript.endsWith(exact)
        )
      ) {
        return {
          command: transcript,
          confidence: Math.min(confidence * 1.1, 1.0), // Boost confidence for exact matches
          intent: intentKey,
          entities: this.extractEntities(cleanTranscript),
          timestamp: new Date(),
        };
      }

      // Check pattern matches
      for (const pattern of patterns.patterns) {
        if (pattern.test(cleanTranscript)) {
          return {
            command: transcript,
            confidence: Math.min(confidence * 1.05, 1.0), // Slight confidence boost for patterns
            intent: intentKey,
            entities: this.extractEntities(cleanTranscript),
            timestamp: new Date(),
          };
        }
      }
    }

    // Fuzzy matching for common variations
    const fuzzyMatch = this.performFuzzyMatching(cleanTranscript);
    if (fuzzyMatch) {
      return {
        command: transcript,
        confidence: confidence * 0.9, // Slightly reduce confidence for fuzzy matches
        intent: fuzzyMatch.intent,
        entities: this.extractEntities(cleanTranscript),
        timestamp: new Date(),
      };
    }

    // Check user's historical preferences
    const historicalMatch = this.checkHistoricalPatterns(cleanTranscript);
    if (historicalMatch) {
      return {
        command: transcript,
        confidence: confidence * 0.85, // Reduce confidence for historical matches
        intent: historicalMatch,
        entities: this.extractEntities(cleanTranscript),
        timestamp: new Date(),
      };
    }

    return {
      command: transcript,
      confidence,
      intent: 'unknown',
      entities: {},
      timestamp: new Date(),
    };
  }

  private static performFuzzyMatching(
    transcript: string
  ): { intent: 'dismiss' | 'snooze' } | null {
    const dismissWords = ['stop', 'off', 'end', 'done', 'up', 'awake', 'ready'];
    const snoozeWords = ['more', 'minutes', 'later', 'wait', 'sleep', 'postpone'];

    const words = transcript.split(' ');
    let dismissScore = 0;
    let snoozeScore = 0;

    words.forEach(word => {
      dismissWords.forEach(dismissWord => {
        if (this.calculateSimilarity(word, dismissWord) > 0.7) {
          dismissScore += 1;
        }
      });

      snoozeWords.forEach(snoozeWord => {
        if (this.calculateSimilarity(word, snoozeWord) > 0.7) {
          snoozeScore += 1;
        }
      });
    });

    if (dismissScore > snoozeScore && dismissScore > 0) {
      return { intent: 'dismiss' };
    } else if (snoozeScore > dismissScore && snoozeScore > 0) {
      return { intent: 'snooze' };
    }

    return null;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.calculateLevenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private static checkHistoricalPatterns(
    transcript: string
  ): 'dismiss' | 'snooze' | null {
    const userCommands = this.userPreferences.preferredCommands;
    let bestMatch: { intent: 'dismiss' | 'snooze'; score: number } | null = null;

    userCommands.forEach((count, command) => {
      const similarity = this.calculateSimilarity(transcript, command);
      if (similarity > 0.8) {
        const intent = this.commandHistory.find(h =>
          h.command.toLowerCase().includes(command)
        )?.intent;
        if (intent && intent !== 'unknown') {
          const score = similarity * (count / 100); // Weight by usage frequency
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { intent, score };
          }
        }
      }
    });

    return bestMatch && bestMatch.score > 0.5 ? bestMatch.intent : null;
  }

  private static extractEntities(transcript: string): { [key: string]: string } {
    const entities: { [key: string]: string } = {};

    // Extract time mentions
    const timePatterns = [
      /(\d+)\s*(minute|minutes|min|mins)/i,
      /(\d+)\s*(hour|hours|hr|hrs)/i,
      /(five|ten|fifteen|twenty|thirty)\s*(minutes?|mins?)/i,
    ];

    timePatterns.forEach(pattern => {
      const match = transcript.match(pattern);
      if (match) {
        entities.duration = match[0];
        entities.durationValue = match[1];
        entities.durationUnit = match[2];
      }
    });

    // Extract emotional context
    const emotionalWords = ['please', 'sorry', 'tired', 'sleepy', 'stressed', 'busy'];
    emotionalWords.forEach(word => {
      if (transcript.toLowerCase().includes(word)) {
        entities.emotional_context = entities.emotional_context
          ? `${entities.emotional_context}, ${word}`
          : word;
      }
    });

    // Extract politeness indicators
    const politenessWords = ['please', 'thanks', 'thank you', 'sorry'];
    const politeness = politenessWords.some(word =>
      transcript.toLowerCase().includes(word)
    );
    if (politeness) {
      entities.politeness = 'polite';
    }

    return entities;
  }

  private static getAdaptiveConfidence(transcript: string): number {
    const baseThreshold = this.config.confidenceThreshold;

    if (!this.config.adaptiveThreshold) {
      return baseThreshold;
    }

    // Lower threshold for familiar commands
    const similarCommands = this.commandHistory.filter(
      cmd =>
        this.calculateSimilarity(cmd.command.toLowerCase(), transcript.toLowerCase()) >
        0.8
    );

    if (similarCommands.length > 0) {
      const avgHistoricalConfidence =
        similarCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) /
        similarCommands.length;
      return Math.max(baseThreshold - 0.1, avgHistoricalConfidence - 0.1);
    }

    // Higher threshold during typically noisy times
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour <= 6) {
      return baseThreshold + 0.05; // Slightly higher threshold at night
    }

    return baseThreshold;
  }

  private static logCommand(command: VoiceCommand): void {
    this.commandHistory.push(command);

    // Keep only last 100 commands
    if (this.commandHistory.length > 100) {
      this.commandHistory = this.commandHistory.slice(-100);
    }

    console.log('Voice command processed:', {
      command: command.command,
      intent: command.intent,
      confidence: command.confidence.toFixed(2),
      entities: command.entities,
    });
  }

  private static updateUserPreferences(command: VoiceCommand): void {
    const commandKey = command.command.toLowerCase();

    // Update command frequency
    const currentCount = this.userPreferences.preferredCommands.get(commandKey) || 0;
    this.userPreferences.preferredCommands.set(commandKey, currentCount + 1);

    // Update average confidence
    const currentAvg =
      this.userPreferences.avgConfidence.get(commandKey) || command.confidence;
    const newAvg = (currentAvg + command.confidence) / 2;
    this.userPreferences.avgConfidence.set(commandKey, newAvg);

    // Update time-of-day patterns
    const hour = command.timestamp.getHours();
    const timeSlot = this.getTimeSlot(hour);
    const currentPatterns = this.userPreferences.timeOfDayPatterns.get(timeSlot) || [];
    if (!currentPatterns.includes(command.intent)) {
      currentPatterns.push(command.intent);
      this.userPreferences.timeOfDayPatterns.set(timeSlot, currentPatterns);
    }

    // Persist preferences
    this.saveUserPreferences();
  }

  private static getTimeSlot(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private static async loadUserPreferences(): Promise<void> {
    try {
      const preferences = localStorage.getItem('voice_recognition_preferences');
      if (preferences) {
        const data = JSON.parse(preferences);
        this.userPreferences.preferredCommands = new Map(data.preferredCommands || []);
        this.userPreferences.avgConfidence = new Map(data.avgConfidence || []);
        this.userPreferences.timeOfDayPatterns = new Map(data.timeOfDayPatterns || []);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  private static saveUserPreferences(): void {
    try {
      const data = {
        preferredCommands: Array.from(this.userPreferences.preferredCommands.entries()),
        avgConfidence: Array.from(this.userPreferences.avgConfidence.entries()),
        timeOfDayPatterns: Array.from(this.userPreferences.timeOfDayPatterns.entries()),
      };
      localStorage.setItem('voice_recognition_preferences', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  static getRecognitionStats(): {
    totalCommands: number;
    avgConfidence: number;
    mostUsedCommands: { command: string; count: number; avgConfidence: number }[];
    intentDistribution: { [intent: string]: number };
  } {
    const totalCommands = this.commandHistory.length;
    const avgConfidence =
      totalCommands > 0
        ? this.commandHistory.reduce((sum, cmd) => sum + cmd.confidence, 0) /
          totalCommands
        : 0;

    // Most used commands
    const commandCounts = new Map<string, TimeoutHandle>();
    const commandConfidence = new Map<string, number[]>();

    this.commandHistory.forEach(cmd => {
      const command = cmd.command.toLowerCase();
      commandCounts.set(command, (commandCounts.get(command) || 0) + 1);

      if (!commandConfidence.has(command)) {
        commandConfidence.set(command, []);
      }
      commandConfidence.get(command)!.push(cmd.confidence);
    });

    const mostUsedCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({
        command,
        count,
        avgConfidence:
          commandConfidence.get(command)!.reduce((a, b) => a + b, 0) / count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Intent distribution
    const intentDistribution: { [intent: string]: number } = {};
    this.commandHistory.forEach(cmd => {
      intentDistribution[cmd.intent] = (intentDistribution[cmd.intent] || 0) + 1;
    });

    return {
      totalCommands,
      avgConfidence,
      mostUsedCommands,
      intentDistribution,
    };
  }

  static clearHistory(): void {
    this.commandHistory = [];
    this.userPreferences.preferredCommands.clear();
    this.userPreferences.avgConfidence.clear();
    this.userPreferences.timeOfDayPatterns.clear();
    localStorage.removeItem('voice_recognition_preferences');
  }

  static updateConfig(newConfig: Partial<RecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  static getConfig(): RecognitionConfig {
    return { ...this.config };
  }

  static isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export default VoiceRecognitionService;
