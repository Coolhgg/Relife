// Patch for voice accessibility service
const patch = `
  /**
   * Initialize the voice accessibility service
   */
  async initialize(): Promise<void> {
    try {
      // Voice accessibility is initialized in the constructor
      // This method exists for consistency with other services
      console.log('Voice Accessibility Service initialized', { 
        isEnabled: this.state.isEnabled,
        hasRecognition: !!this.recognition,
        commandsCount: this.commands.size 
      });
    } catch (error) {
      console.warn('Voice accessibility initialization warning:', error);
    }
  }

  /**
   * Check if voice accessibility is enabled
   */
  isEnabled(): boolean {
    return this.state.isEnabled;
  }
`;

// Insert after static getInstance method
// Search for: static getInstance(): VoiceAccessibilityService {
// Add the patch methods after the getInstance method