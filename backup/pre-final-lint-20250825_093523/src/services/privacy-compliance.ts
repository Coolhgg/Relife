// Privacy Compliance Service for Smart Alarm App
// Handles GDPR, CCPA, and other privacy regulations compliance

export interface ConsentSettings {
  analytics: boolean;
  performance: boolean;
  errorTracking: boolean;
  sessionRecording: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface PrivacySettings {
  dataProcessing: boolean;
  dataSharing: boolean;
  cookieConsent: boolean;
  marketingCommunication: boolean;
  personalizedExperience: boolean;
  dataRetention: '1year' | '2years' | '5years' | 'indefinite';
}

export interface UserDataRequest {
  type: 'export' | 'delete' | 'rectify' | 'portability';
  userId: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestId: string;
}

export interface ConsentEvent {
  userId?: string;
  timestamp: number;
  consentGiven: boolean;
  consentType: keyof ConsentSettings;
  source: 'banner' | 'settings' | 'onboarding' | 'api';
  ipAddress?: string;
  userAgent: string;
  version: string; // Consent policy version
}

class PrivacyComplianceService {
  private static instance: PrivacyComplianceService;
  private consentSettings: ConsentSettings;
  private privacySettings: PrivacySettings;
  private consentHistory: ConsentEvent[] = [];
  private userDataRequests: UserDataRequest[] = [];
  private isInitialized = false;
  private consentPolicyVersion = '1.0';

  // Default consent settings (most restrictive)
  private defaultConsent: ConsentSettings = {
    analytics: false,
    performance: false,
    errorTracking: false,
    sessionRecording: false,
    marketing: false,
    functional: true, // Essential for app functionality
  };

  // Default privacy settings
  private defaultPrivacy: PrivacySettings = {
    dataProcessing: false,
    dataSharing: false,
    cookieConsent: false,
    marketingCommunication: false,
    personalizedExperience: false,
    dataRetention: '1year',
  };

  private constructor() {
    this.consentSettings = { ...this.defaultConsent };
    this.privacySettings = { ...this.defaultPrivacy };
  }

  static getInstance(): PrivacyComplianceService {
    if (!PrivacyComplianceService.instance) {
      PrivacyComplianceService.instance = new PrivacyComplianceService();
    }
    return PrivacyComplianceService.instance;
  }

  /**
   * Initialize privacy compliance system
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      // Load existing consent from localStorage
      this.loadConsentSettings();

      // Check if consent is still valid (not expired)
      this.validateConsentExpiry();

      // Apply consent to analytics services
      this.applyConsentToServices();

      this.isInitialized = true;
      console.info('Privacy compliance service initialized');
    } catch (_error) {
      console._error('Failed to initialize privacy compliance service:', _error);
    }
  }

  /**
   * Set user consent with full compliance tracking
   */
  setConsent(
    consentType: keyof ConsentSettings,
    granted: boolean,
    source: ConsentEvent['source'] = 'settings',
    userId?: string
  ): void {
    const previousConsent = this.consentSettings[consentType];

    // Update consent setting
    this.consentSettings[consentType] = granted;

    // Record consent event for compliance
    const consentEvent: ConsentEvent = {
      userId,
      timestamp: Date.now(),
      consentGiven: granted,
      consentType,
      source,
      userAgent: navigator.userAgent,
      version: this.consentPolicyVersion,
    };

    this.consentHistory.push(consentEvent);

    // Save to persistent storage
    this.saveConsentSettings();

    // Apply consent changes to services
    this.applyConsentToServices();

    // Log consent change for audit trail
    console.info(`Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`, {
      previousConsent,
      newConsent: granted,
      source,
      userId,
    });
  }

  /**
   * Set multiple consent settings at once (consent banner)
   */
  setBulkConsent(
    consents: Partial<ConsentSettings>,
    source: ConsentEvent['source'] = 'banner',
    userId?: string
  ): void {
    Object.entries(consents).forEach(([type, granted]) => {
      if (granted !== undefined) {
        this.setConsent(type as keyof ConsentSettings, granted, source, userId);
      }
    });
  }

  /**
   * Get current consent settings
   */
  getConsent(): ConsentSettings {
    return { ...this.consentSettings };
  }

  /**
   * Check if specific consent is granted
   */
  hasConsent(consentType: keyof ConsentSettings): boolean {
    return this.consentSettings[consentType];
  }

  /**
   * Check if analytics tracking is allowed
   */
  canTrackAnalytics(): boolean {
    return this.consentSettings.analytics && this.consentSettings.functional;
  }

  /**
   * Check if error tracking is allowed
   */
  canTrackErrors(): boolean {
    return this.consentSettings.errorTracking && this.consentSettings.functional;
  }

  /**
   * Check if performance monitoring is allowed
   */
  canMonitorPerformance(): boolean {
    return this.consentSettings.performance && this.consentSettings.functional;
  }

  /**
   * Check if session recording is allowed
   */
  canRecordSessions(): boolean {
    return this.consentSettings.sessionRecording && this.consentSettings.analytics;
  }

  /**
   * Set privacy settings
   */
  setPrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings = {
      ...this.privacySettings,
      ...settings,
    };

    this.savePrivacySettings();

    // Apply privacy changes
    this.applyPrivacySettings();
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  /**
   * Check if consent banner should be shown
   */
  shouldShowConsentBanner(): boolean {
    const hasConsent = localStorage.getItem('privacy_consent');
    const consentTimestamp = localStorage.getItem('privacy_consent_timestamp');

    if (!hasConsent || !consentTimestamp) {
      return true;
    }

    // Show banner if consent is older than 1 year
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    return parseInt(consentTimestamp) < oneYearAgo;
  }

  /**
   * Create user data export
   */
  async createDataExport(userId: string): Promise<UserDataRequest> {
    const requestId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const request: UserDataRequest = {
      type: 'export',
      userId,
      timestamp: Date.now(),
      status: 'pending',
      requestId,
    };

    this.userDataRequests.push(request);

    try {
      // Simulate data export process
      request.status = 'processing';

      const exportData = {
        user: { id: userId },
        consent: this.getConsentHistory(userId),
        privacy: this.privacySettings,
        analytics: await this.getAnalyticsData(userId),
        errors: await this.getErrorData(userId),
        performance: await this.getPerformanceData(userId),
        exportedAt: new Date().toISOString(),
        requestId,
      };

      // In real implementation, this would generate a downloadable file
      console.info('User data export created:', {
        requestId,
        userId,
        dataSize: JSON.stringify(exportData).length,
      });

      request.status = 'completed';
      return request;
    } catch (_error) {
      request.status = 'failed';
      console.error('Failed to create data export:', _error);
      throw _error;
    }
  }

  /**
   * Process data deletion request (Right to be Forgotten)
   */
  async processDataDeletion(userId: string): Promise<UserDataRequest> {
    const requestId = `delete_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const request: UserDataRequest = {
      type: 'delete',
      userId,
      timestamp: Date.now(),
      status: 'pending',
      requestId,
    };

    this.userDataRequests.push(request);

    try {
      request.status = 'processing';

      // Delete user data from various services
      await this.deleteAnalyticsData(userId);
      await this.deleteErrorData(userId);
      await this.deletePerformanceData(userId);

      // Remove consent history for this user
      this.consentHistory = this.consentHistory.filter(
        event => _event.userId !== userId
      );

      request.status = 'completed';

      console.info('User data deletion completed:', { requestId, userId });
      return request;
    } catch (_error) {
      request.status = 'failed';
      console.error('Failed to delete _user data:', _error);
      throw _error;
    }
  }

  /**
   * Get consent history for a user
   */
  getConsentHistory(userId?: string): ConsentEvent[] {
    if (userId) {
      return this.consentHistory.filter(event => _event.userId === userId);
    }
    return [...this.consentHistory];
  }

  /**
   * Get data retention policy
   */
  getDataRetentionPolicy(): {
    analytics: string;
    errors: string;
    performance: string;
    consent: string;
  } {
    return {
      analytics: this.privacySettings.dataRetention,
      errors: this.privacySettings.dataRetention,
      performance: '6months', // Performance data kept shorter
      consent: '7years', // Legal requirement to keep consent records
    };
  }

  /**
   * Check if data collection is compliant with regulations
   */
  isCompliant(): {
    gdpr: boolean;
    ccpa: boolean;
    coppa: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // GDPR compliance checks
    const gdprCompliant = this.checkGDPRCompliance(issues);

    // CCPA compliance checks
    const ccpaCompliant = this.checkCCPACompliance(issues);

    // COPPA compliance checks
    const coppaCompliant = this.checkCOPPACompliance(issues);

    return {
      gdpr: gdprCompliant,
      ccpa: ccpaCompliant,
      coppa: coppaCompliant,
      issues,
    };
  }

  /**
   * Load consent settings from localStorage
   */
  private loadConsentSettings(): void {
    try {
      const stored = localStorage.getItem('privacy_consent');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.consentSettings = { ...this.defaultConsent, ...parsed };
      }

      // Load privacy settings
      const privacyStored = localStorage.getItem('privacy_settings');
      if (privacyStored) {
        const parsed = JSON.parse(privacyStored);
        this.privacySettings = { ...this.defaultPrivacy, ...parsed };
      }

      // Load consent history
      const historyStored = localStorage.getItem('privacy_consent_history');
      if (historyStored) {
        this.consentHistory = JSON.parse(historyStored);
      }
    } catch (_error) {
      console.warn('Failed to load privacy settings:', _error);
    }
  }

  /**
   * Save consent settings to localStorage
   */
  private saveConsentSettings(): void {
    try {
      localStorage.setItem('privacy_consent', JSON.stringify(this.consentSettings));
      localStorage.setItem('privacy_consent_timestamp', Date.now().toString());
      localStorage.setItem(
        'privacy_consent_history',
        JSON.stringify(this.consentHistory.slice(-100))
      ); // Keep last 100 events
    } catch (_error) {
      console.warn('Failed to save privacy settings:', _error);
    }
  }

  /**
   * Save privacy settings to localStorage
   */
  private savePrivacySettings(): void {
    try {
      localStorage.setItem('privacy_settings', JSON.stringify(this.privacySettings));
    } catch (_error) {
      console.warn('Failed to save privacy settings:', _error);
    }
  }

  /**
   * Validate consent expiry
   */
  private validateConsentExpiry(): void {
    const timestamp = localStorage.getItem('privacy_consent_timestamp');
    if (timestamp) {
      const consentAge = Date.now() - parseInt(timestamp);
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      if (consentAge > oneYear) {
        // Consent expired, reset to defaults
        this.consentSettings = { ...this.defaultConsent };
        console.info('Consent expired, reset to defaults');
      }
    }
  }

  /**
   * Apply consent settings to analytics services
   */
  private applyConsentToServices(): void {
    // This would integrate with the analytics services
    // For now, we'll just log the changes
    console.info('Applying consent to services:', this.consentSettings);

    // In real implementation, you would:
    // - Enable/disable PostHog tracking
    // - Enable/disable Sentry _error reporting
    // - Enable/disable session recording
    // - Clear existing data if consent revoked
  }

  /**
   * Apply privacy settings
   */
  private applyPrivacySettings(): void {
    console.info('Applying privacy settings:', this.privacySettings);

    // In real implementation:
    // - Configure data sharing policies
    // - Set data retention periods
    // - Update marketing preferences
  }

  /**
   * Check GDPR compliance
   */
  private checkGDPRCompliance(issues: string[]): boolean {
    let compliant = true;

    // Check if consent was properly obtained
    const hasValidConsent = this.consentHistory.some(
      event =>
        event.consentGiven && _event.timestamp > Date.now() - 365 * 24 * 60 * 60 * 1000
    );

    if (
      !hasValidConsent &&
      (this.consentSettings.analytics || this.consentSettings.marketing)
    ) {
      issues.push('Missing valid consent for data processing');
      compliant = false;
    }

    // Check data retention policy
    if (this.privacySettings.dataRetention === 'indefinite') {
      issues.push('Data retention period should be limited');
      compliant = false;
    }

    return compliant;
  }

  /**
   * Check CCPA compliance
   */
  private checkCCPACompliance(issues: string[]): boolean {
    let compliant = true;

    // Check if user can opt-out of data sale
    if (
      this.privacySettings.dataSharing &&
      !this.privacySettings.marketingCommunication
    ) {
      issues.push('Users must be able to opt-out of data sharing');
      compliant = false;
    }

    return compliant;
  }

  /**
   * Check COPPA compliance
   */
  private checkCOPPACompliance(issues: string[]): boolean {
    // For COPPA, we assume this app is not directed at children under 13
    // In a real implementation, you'd check user age
    return true;
  }

  /**
   * Get analytics data for export (mock implementation)
   */
  private async getAnalyticsData(userId: string): Promise<any> {
    // In real implementation, this would fetch data from PostHog/analytics service
    return {
      events: [],
      sessions: [],
      userId,
      note: 'Analytics data would be fetched from PostHog API',
    };
  }

  /**
   * Get error data for export (mock implementation)
   */
  private async getErrorData(userId: string): Promise<any> {
    // In real implementation, this would fetch data from Sentry
    return {
      errors: [],
      userId,
      note: 'Error data would be fetched from Sentry API',
    };
  }

  /**
   * Get performance data for export (mock implementation)
   */
  private async getPerformanceData(userId: string): Promise<any> {
    return {
      metrics: [],
      userId,
      note: 'Performance data from local storage and analytics',
    };
  }

  /**
   * Delete analytics data (mock implementation)
   */
  private async deleteAnalyticsData(userId: string): Promise<void> {
    // In real implementation, this would call PostHog delete API
    console.info('Deleting analytics data for _user:', userId);
  }

  /**
   * Delete error data (mock implementation)
   */
  private async deleteErrorData(userId: string): Promise<void> {
    // In real implementation, this would call Sentry delete API
    console.info('Deleting _error data for _user:', userId);
  }

  /**
   * Delete performance data (mock implementation)
   */
  private async deletePerformanceData(userId: string): Promise<void> {
    // Delete local performance data
    console.info('Deleting performance data for _user:', userId);
  }
}

export default PrivacyComplianceService;
