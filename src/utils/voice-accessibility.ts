// Voice-Controlled Accessibility for Smart Alarm App
// Provides comprehensive voice navigation and control for accessibility

import ScreenReaderService from './screen-reader';
import KeyboardNavigationService from './keyboard-navigation';
import { TimeoutHandle } from '../types/timers';

export interface VoiceCommand {
  phrases: string[];
  action: (params?: any
) => void;
  description: string;
  category: 'navigation' | 'alarm' | 'accessibility' | 'general';
  enabled: boolean;
  confirmation?: boolean; // Requires voice confirmation for destructive actions
}

export interface VoiceAccessibilityState {
  isListening: boolean;
  isEnabled: boolean;
  language: string;
  confidence: number;
  voiceSpeed: number;
  enabledCategories: string[];
  requireConfirmation: boolean;
  continuous: boolean;
}

/**
 * Voice-Controlled Accessibility Service
 */
export class VoiceAccessibilityService {
  private static instance: VoiceAccessibilityService;
  private recognition?: SpeechRecognition;
  private synthesis: SpeechSynthesis;
  private commands: Map<string, VoiceCommand> = new Map();
  private state: VoiceAccessibilityState;
  private screenReader: ScreenReaderService;
  private keyboardNav: KeyboardNavigationService;
  private currentlyListening = false;
  private confirmationPending?: VoiceCommand;
  private feedbackTimer?: number;

  private constructor() {
    this.synthesis = window.speechSynthesis;
    this.screenReader = ScreenReaderService.getInstance();
    this.keyboardNav = KeyboardNavigationService.getInstance();

    this.state = {
      isListening: false,
      isEnabled: this.checkVoiceSupport(),
      language: 'en-US',
      confidence: 0.7,
      voiceSpeed: 1.0,
      enabledCategories: ['navigation', 'alarm', 'accessibility', 'general'],
      requireConfirmation: true,
      continuous: false,
    };

    this.initializeVoiceCommands();
    this.setupSpeechRecognition();
  }

  static getInstance(): VoiceAccessibilityService {
    if (!VoiceAccessibilityService.instance) {
      VoiceAccessibilityService.instance = new VoiceAccessibilityService();
    }
    return VoiceAccessibilityService.instance;
  }

  /**
   * Initialize the voice accessibility service (called from App.tsx)
   */
  public async initialize(): Promise<void> {
    // Service is already initialized in constructor
    // This method provides the expected interface for App.tsx
    console.log('VoiceAccessibilityService initialized');
  }

  /**
   * Get the current enabled state
   */
  public get isEnabled(): boolean {
    return this.state.isEnabled;
  }

  /**
   * Check if voice recognition is supported
   */
  private checkVoiceSupport(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize comprehensive voice commands
   */
  private initializeVoiceCommands(): void {
    const commands: Omit<VoiceCommand, 'enabled'>[] = [
      // Navigation Commands
      {
        phrases: [
          'go to dashboard',
          'open dashboard',
          'show dashboard',
          'navigate dashboard',
        ],
        action: (
) => this.navigateToSection('dashboard'),
        description: 'Navigate to Dashboard',
        category: 'navigation',
      },
      {
        phrases: [
          'go to alarms',
          'open alarms',
          'show alarms',
          'navigate alarms',
          'alarm list',
        ],
        action: (
) => this.navigateToSection('alarms'),
        description: 'Navigate to Alarms',
        category: 'navigation',
      },
      {
        phrases: [
          'go to settings',
          'open settings',
          'show settings',
          'navigate settings',
        ],
        action: (
) => this.navigateToSection('settings'),
        description: 'Navigate to Settings',
        category: 'navigation',
      },
      {
        phrases: [
          'go to performance',
          'open performance',
          'show performance analytics',
        ],
        action: (
) => this.navigateToSection('performance'),
        description: 'Navigate to Performance',
        category: 'navigation',
      },
      {
        phrases: ['go back', 'navigate back', 'previous page', 'back'],
        action: (
) => this.goBack(),
        description: 'Go to previous page',
        category: 'navigation',
      },

      // Alarm Management Commands
      {
        phrases: ['create alarm', 'new alarm', 'add alarm', 'make alarm'],
        action: (
) => this.createAlarm(),
        description: 'Create a new alarm',
        category: 'alarm',
      },
      {
        phrases: ['delete alarm', 'remove alarm', 'delete selected alarm'],
        action: (
) => this.deleteAlarm(),
        description: 'Delete the selected alarm',
        category: 'alarm',
        confirmation: true,
      },
      {
        phrases: ['toggle alarm', 'switch alarm', 'activate alarm', 'deactivate alarm'],
        action: (
) => this.toggleAlarm(),
        description: 'Toggle the selected alarm on/off',
        category: 'alarm',
      },
      {
        phrases: ['edit alarm', 'modify alarm', 'change alarm'],
        action: (
) => this.editAlarm(),
        description: 'Edit the selected alarm',
        category: 'alarm',
      },
      {
        phrases: ['list alarms', 'show all alarms', 'read alarms'],
        action: (
) => this.listAlarms(),
        description: 'List all alarms',
        category: 'alarm',
      },
      {
        phrases: ['select first alarm', 'focus first alarm'],
        action: (
) => this.selectAlarm('first'),
        description: 'Select the first alarm',
        category: 'alarm',
      },
      {
        phrases: ['select last alarm', 'focus last alarm'],
        action: (
) => this.selectAlarm('last'),
        description: 'Select the last alarm',
        category: 'alarm',
      },
      {
        phrases: ['next alarm', 'select next alarm'],
        action: (
) => this.selectAlarm('next'),
        description: 'Select the next alarm',
        category: 'alarm',
      },
      {
        phrases: ['previous alarm', 'select previous alarm'],
        action: (
) => this.selectAlarm('previous'),
        description: 'Select the previous alarm',
        category: 'alarm',
      },

      // Accessibility Commands
      {
        phrases: ['increase voice speed', 'speak faster', 'speed up voice'],
        action: (
) => this.adjustVoiceSpeed(0.2),
        description: 'Increase voice playback speed',
        category: 'accessibility',
      },
      {
        phrases: ['decrease voice speed', 'speak slower', 'slow down voice'],
        action: (
) => this.adjustVoiceSpeed(-0.2),
        description: 'Decrease voice playback speed',
        category: 'accessibility',
      },
      {
        phrases: ['read page', 'read screen', 'read current page'],
        action: (
) => this.readCurrentPage(),
        description: 'Read the current page content',
        category: 'accessibility',
      },
      {
        phrases: ['keyboard shortcuts', 'show shortcuts', 'list shortcuts'],
        action: (
) => this.readKeyboardShortcuts(),
        description: 'List available keyboard shortcuts',
        category: 'accessibility',
      },
      {
        phrases: ['voice commands', 'voice help', 'list commands'],
        action: (
) => this.readVoiceCommands(),
        description: 'List available voice commands',
        category: 'accessibility',
      },
      {
        phrases: ['focus first', 'go to first element'],
        action: (
) => this.focusElement('first'),
        description: 'Focus the first interactive element',
        category: 'accessibility',
      },
      {
        phrases: ['focus last', 'go to last element'],
        action: (
) => this.focusElement('last'),
        description: 'Focus the last interactive element',
        category: 'accessibility',
      },
      {
        phrases: ['repeat', 'say again', 'repeat last'],
        action: (
) => this.repeatLastAnnouncement(),
        description: 'Repeat the last announcement',
        category: 'accessibility',
      },

      // General Commands
      {
        phrases: ['help', 'show help', 'what can you do'],
        action: (
) => this.showHelp(),
        description: 'Show help information',
        category: 'general',
      },
      {
        phrases: ['stop listening', 'turn off voice', 'disable voice'],
        action: (
) => this.stopListening(),
        description: 'Stop voice recognition',
        category: 'general',
      },
      {
        phrases: ['start listening', 'turn on voice', 'enable voice'],
        action: (
) => this.startListening(),
        description: 'Start voice recognition',
        category: 'general',
      },
      {
        phrases: ['what time is it', 'current time', 'time'],
        action: (
) => this.announceTime(),
        description: 'Announce the current time',
        category: 'general',
      },
      {
        phrases: ['cancel', 'nevermind', 'abort'],
        action: (
) => this.cancelAction(),
        description: 'Cancel the current action',
        category: 'general',
      },
      {
        phrases: ['yes', 'confirm', 'okay', 'proceed'],
        action: (
) => this.confirmAction(),
        description: 'Confirm the pending action',
        category: 'general',
      },
      {
        phrases: ['no', 'cancel', 'stop', 'abort'],
        action: (
) => this.rejectAction(),
        description: 'Reject the pending action',
        category: 'general',
      },
    ];

    commands.forEach((command, index
) => {
      this.addCommand(`cmd-${index}`, {
        ...command,
        enabled: true,
      });
    });
  }

  /**
   * Setup speech recognition
   */
  private setupSpeechRecognition(): void {
    if (!this.checkVoiceSupport()) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.state.continuous;
    this.recognition.interimResults = false;
    this.recognition.lang = this.state.language;

    this.recognition.onstart = (
) => {
      this.currentlyListening = true;
      this.state.isListening = true;
      this.provideFeedback('Voice recognition started. Listening for commands.');
    };

    this.recognition.onend = (
) => {
      this.currentlyListening = false;
      this.state.isListening = false;

      if (this.state.continuous && this.state.isEnabled) {
        // Restart if continuous mode is enabled
        setTimeout((
) => this.startListening(), 1000);
      }
    };

    this.recognition.onerror = event => {
      console.warn('Speech recognition error:', event.error);
      this.provideFeedback(`Voice recognition error: ${event.error}`);
      this.currentlyListening = false;
      this.state.isListening = false;
    };

    this.recognition.onresult = event => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal && result[0].confidence >= this.state.confidence) {
        const transcript = result[0].transcript.toLowerCase().trim();
        this.processVoiceCommand(transcript);
      }
    };
  }

  /**
   * Process voice command from speech recognition
   */
  private processVoiceCommand(transcript: string): void {
    console.log('Voice command received:', transcript);

    // Check if we're waiting for confirmation
    if (this.confirmationPending) {
      this.handleConfirmation(transcript);
      return;
    }

    // Find matching command
    const matchedCommand = this.findMatchingCommand(transcript);

    if (matchedCommand) {
      if (matchedCommand.confirmation && this.state.requireConfirmation) {
        this.requestConfirmation(matchedCommand);
      } else {
        this.executeCommand(matchedCommand);
      }
    } else {
      this.provideFeedback(
        `Command not recognized: "${transcript}". Say "voice help" for available commands.`
      );
    }
  }

  /**
   * Find matching voice command
   */
  private findMatchingCommand(transcript: string): VoiceCommand | undefined {
    for (const command of this.commands.values()) {
      if (
        !command.enabled ||
        !this.state.enabledCategories.includes(command.category)
      ) {
        continue;
      }

      for (const phrase of command.phrases) {
        if (this.matchesPhrase(transcript, phrase)) {
          return command;
        }
      }
    }
    return undefined;
  }

  /**
   * Check if transcript matches a command phrase
   */
  private matchesPhrase(transcript: string, phrase: string): boolean {
    // Exact match
    if (transcript === phrase) return true;

    // Fuzzy matching for natural speech
    const transcriptWords = transcript.split(' ');
    const phraseWords = phrase.split(' ');

    // Check if all phrase words are in transcript
    return phraseWords.every(word =>
      transcriptWords.some(tWord => tWord.includes(word) || word.includes(tWord))
    );
  }

  /**
   * Request confirmation for destructive actions
   */
  private requestConfirmation(command: VoiceCommand): void {
    this.confirmationPending = command;
    this.provideFeedback(
      `Are you sure you want to ${command.description.toLowerCase()}? Say "yes" to confirm or "no" to cancel.`
    );

    // Auto-cancel confirmation after 10 seconds
    setTimeout((
) => {
      if (this.confirmationPending === command) {
        this.confirmationPending = undefined;
        this.provideFeedback('Confirmation timeout. Action cancelled.');
      }
    }, 10000);
  }

  /**
   * Handle confirmation response
   */
  private handleConfirmation(transcript: string): void {
    const isConfirmed = ['yes', 'confirm', 'okay', 'proceed', 'do it'].some(word =>
      transcript.includes(word)
    );

    const isRejected = ['no', 'cancel', 'stop', 'abort', 'nevermind'].some(word =>
      transcript.includes(word)
    );

    if (isConfirmed && this.confirmationPending) {
      const command = this.confirmationPending;
      this.confirmationPending = undefined;
      this.executeCommand(command);
    } else if (isRejected) {
      this.confirmationPending = undefined;
      this.provideFeedback('Action cancelled.');
    } else {
      this.provideFeedback('Please say "yes" to confirm or "no" to cancel.');
    }
  }

  /**
   * Execute a voice command
   */
  private executeCommand(command: VoiceCommand): void {
    try {
      command.action();
      this.provideFeedback(`Executed: ${command.description}`);
    } catch (error) {
      console.error('Error executing voice command:', error);
      this.provideFeedback(`Error executing command: ${command.description}`);
    }
  }

  /**
   * Add a new voice command
   */
  addCommand(id: string, command: VoiceCommand): void {
    this.commands.set(id, command);
  }

  /**
   * Remove a voice command
   */
  removeCommand(id: string): void {
    this.commands.delete(id);
  }

  /**
   * Start voice recognition
   */
  startListening(): void {
    if (!this.state.isEnabled || !this.recognition || this.currentlyListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.warn('Could not start voice recognition:', error);
      this.provideFeedback(
        'Could not start voice recognition. Please check microphone permissions.'
      );
    }
  }

  /**
   * Stop voice recognition
   */
  stopListening(): void {
    if (this.recognition && this.currentlyListening) {
      this.recognition.stop();
    }
    this.currentlyListening = false;
    this.state.isListening = false;
    this.provideFeedback('Voice recognition stopped.');
  }

  /**
   * Provide audio feedback to user
   */
  private provideFeedback(
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    // Clear any existing feedback timer
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }

    // Use screen reader for announcement
    this.screenReader.announce(message, priority === 'high' ? 'assertive' : 'polite');

    // Also use speech synthesis for immediate feedback
    if (this.synthesis && !this.synthesis.speaking) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = this.state.voiceSpeed;
      utterance.lang = this.state.language;

      // Set voice if specified
      if (this.state.preferredVoice) {
        const voices = this.synthesis.getVoices();
        const voice = voices.find(v => v.name === this.state.preferredVoice);
        if (voice) utterance.voice = voice;
      }

      this.synthesis.speak(utterance);
    }
  }

  /**
   * Command implementation methods
   */
  private navigateToSection(section: string): void {
    const event = new CustomEvent('keyboard-navigate', {
      detail: { section, source: 'voice' },
    });
    document.dispatchEvent(event);
  }

  private goBack(): void {
    window.history.back();
  }

  private createAlarm(): void {
    const event = new CustomEvent('alarm-action', {
      detail: { action: 'create', source: 'voice' },
    });
    document.dispatchEvent(event);
  }

  private deleteAlarm(): void {
    const selectedAlarm = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    if (selectedAlarm) {
      const event = new CustomEvent('alarm-action', {
        detail: { action: 'delete', target: selectedAlarm, source: 'voice' },
      });
      document.dispatchEvent(event);
    } else {
      this.provideFeedback('No alarm selected. Please select an alarm first.');
    }
  }

  private toggleAlarm(): void {
    const selectedAlarm = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    if (selectedAlarm) {
      const event = new CustomEvent('alarm-action', {
        detail: { action: 'toggle', target: selectedAlarm, source: 'voice' },
      });
      document.dispatchEvent(event);
    } else {
      this.provideFeedback('No alarm selected. Please select an alarm first.');
    }
  }

  private editAlarm(): void {
    const selectedAlarm = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    if (selectedAlarm) {
      const event = new CustomEvent('alarm-action', {
        detail: { action: 'edit', target: selectedAlarm, source: 'voice' },
      });
      document.dispatchEvent(event);
    } else {
      this.provideFeedback('No alarm selected. Please select an alarm first.');
    }
  }

  private listAlarms(): void {
    const alarms = document.querySelectorAll('[data-alarm-item]');
    if (alarms.length === 0) {
      this.provideFeedback('No alarms found.');
      return;
    }

    let alarmsList = `Found ${alarms.length} alarm${alarms.length > 1 ? 's' : ''}: `;
    alarms.forEach((alarm, index
) => {
      const timeElement = alarm.querySelector('[data-alarm-time]');
      const labelElement = alarm.querySelector('[data-alarm-label]');
      const statusElement = alarm.querySelector('[data-alarm-status]');

      const time = timeElement?.textContent || 'Unknown time';
      const label = labelElement?.textContent || 'No label';
      const status =
        statusElement?.getAttribute('data-active') === 'true' ? 'active' : 'inactive';

      alarmsList += `${index + 1}: ${time}, ${label}, ${status}. `;
    });

    this.provideFeedback(alarmsList);
  }

  private selectAlarm(direction: 'first' | 'last' | 'next' | 'previous'): void {
    const alarms = Array.from(
      document.querySelectorAll('[data-alarm-item]')
    ) as HTMLElement[];
    if (alarms.length === 0) {
      this.provideFeedback('No alarms available.');
      return;
    }

    const currentSelected = document.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement;
    const currentIndex = currentSelected ? alarms.indexOf(currentSelected) : -1;
    let newIndex = 0;

    switch (direction) {
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = alarms.length - 1;
        break;
      case 'next':
        newIndex = currentIndex < alarms.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'previous':
        newIndex = currentIndex > 0 ? currentIndex - 1 : alarms.length - 1;
        break;
    }

    // Remove previous selection
    if (currentSelected) {
      currentSelected.removeAttribute('data-selected');
    }

    // Select new alarm
    const newSelected = alarms[newIndex];
    newSelected.setAttribute('data-selected', 'true');
    newSelected.focus();

    const timeElement = newSelected.querySelector('[data-alarm-time]');
    const labelElement = newSelected.querySelector('[data-alarm-label]');
    const time = timeElement?.textContent || 'Unknown time';
    const label = labelElement?.textContent || 'No label';

    this.provideFeedback(`Selected alarm: ${time}, ${label}`);
  }

  private adjustVoiceSpeed(delta: number): void {
    this.state.voiceSpeed = Math.max(0.5, Math.min(2.0, this.state.voiceSpeed + delta));
    this.provideFeedback(`Voice speed set to ${this.state.voiceSpeed.toFixed(1)}x`);
  }

  private readCurrentPage(): void {
    const mainContent = document.querySelector('main') || document.body;
    const textContent = this.extractReadableText(mainContent);
    this.provideFeedback(textContent);
  }

  private extractReadableText(element: Element): string {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // Skip hidden elements
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip script and style elements
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text) {
        textNodes.push(text);
      }
    }

    return textNodes.join(' ').replace(/\s+/g, ' ').trim();
  }

  private readKeyboardShortcuts(): void {
    const shortcuts = this.keyboardNav.getShortcuts();
    const shortcutText = shortcuts
      .map(s => `${s.description}: ${s.modifiers.join(' plus ')} ${s.key}`)
      .join('. ');
    this.provideFeedback(`Available keyboard shortcuts: ${shortcutText}`);
  }

  private readVoiceCommands(): void {
    const commands = Array.from(this.commands.values())
      .filter(cmd => cmd.enabled && this.state.enabledCategories.includes(cmd.category))
      .map(cmd => cmd.description)
      .join(', ');
    this.provideFeedback(`Available voice commands: ${commands}`);
  }

  private focusElement(position: 'first' | 'last'): void {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )
    ) as HTMLElement[];

    if (focusableElements.length === 0) {
      this.provideFeedback('No focusable elements found.');
      return;
    }

    const targetElement =
      position === 'first'
        ? focusableElements[0]
        : focusableElements[focusableElements.length - 1];

    targetElement.focus();
    this.provideFeedback(
      `Focused ${position} element: ${this.getElementDescription(targetElement)}`
    );
  }

  private getElementDescription(element: HTMLElement): string {
    return (
      element.getAttribute('aria-label') ||
      element.textContent?.trim() ||
      element.tagName.toLowerCase()
    );
  }

  private repeatLastAnnouncement(): void {
    // This would need to store the last announcement
    this.provideFeedback('Repeat functionality not yet implemented.');
  }

  private showHelp(): void {
    const helpText = `
      Voice Accessibility Help.
      Available categories: Navigation, Alarm Management, Accessibility, and General commands.
      Say "voice commands" to hear all available commands.
      Say "keyboard shortcuts" to hear keyboard options.
      Say "stop listening" to disable voice recognition.
    `;
    this.provideFeedback(helpText);
  }

  private announceTime(): void {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.provideFeedback(`Current time is ${timeString}`);
  }

  private cancelAction(): void {
    if (this.confirmationPending) {
      this.confirmationPending = undefined;
      this.provideFeedback('Action cancelled.');
    } else {
      this.provideFeedback('No action to cancel.');
    }
  }

  private confirmAction(): void {
    if (this.confirmationPending) {
      const command = this.confirmationPending;
      this.confirmationPending = undefined;
      this.executeCommand(command);
    } else {
      this.provideFeedback('No action to confirm.');
    }
  }

  private rejectAction(): void {
    this.cancelAction();
  }

  /**
   * Update voice accessibility settings
   */
  updateSettings(settings: Partial<VoiceAccessibilityState>): void {
    this.state = { ...this.state, ...settings };

    if (this.recognition) {
      this.recognition.continuous = this.state.continuous;
      this.recognition.lang = this.state.language;
    }

    this.provideFeedback('Voice accessibility settings updated.');
  }

  /**
   * Get current state
   */
  getState(): VoiceAccessibilityState {
    return { ...this.state };
  }

  /**
   * Get available voice commands
   */
  getCommands(): VoiceCommand[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.enabled);
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
  }
}

export default VoiceAccessibilityService;
