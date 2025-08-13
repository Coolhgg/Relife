import PrivacyComplianceService, { 
  ConsentSettings, 
  PrivacySettings, 
  UserDataRequest,
  ConsentEvent 
} from '../privacy-compliance';
import { testUtils } from '../../test-setup';

describe('PrivacyComplianceService', () => {
  let privacyService: PrivacyComplianceService;

  beforeEach(() => {
    testUtils.clearAllMocks();
    
    // Reset singleton instance
    (PrivacyComplianceService as any).instance = null;
    privacyService = PrivacyComplianceService.getInstance();
    
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Clear localStorage
    testUtils.mockLocalStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = PrivacyComplianceService.getInstance();
      const instance2 = PrivacyComplianceService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    test('initializes with default consent settings', () => {
      privacyService.initialize();
      
      const consent = privacyService.getConsent();
      expect(consent).toEqual({
        analytics: false,
        performance: false,
        errorTracking: false,
        sessionRecording: false,
        marketing: false,
        functional: true
      });
    });

    test('loads existing consent from localStorage', () => {
      const storedConsent = {
        analytics: true,
        performance: true,
        errorTracking: true,
        sessionRecording: false,
        marketing: false,
        functional: true
      };
      
      testUtils.mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'privacy_consent') return JSON.stringify(storedConsent);
        return null;
      });
      
      privacyService.initialize();
      
      const consent = privacyService.getConsent();
      expect(consent).toEqual(storedConsent);
    });

    test('loads existing privacy settings from localStorage', () => {
      const storedPrivacy = {
        dataProcessing: true,
        dataSharing: false,
        cookieConsent: true,
        marketingCommunication: false,
        personalizedExperience: true,
        dataRetention: '2years' as const
      };
      
      testUtils.mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'privacy_settings') return JSON.stringify(storedPrivacy);
        return null;
      });
      
      privacyService.initialize();
      
      const privacy = privacyService.getPrivacySettings();
      expect(privacy).toEqual(storedPrivacy);
    });

    test('handles corrupted localStorage data gracefully', () => {
      testUtils.mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'privacy_consent') return 'invalid json';
        return null;
      });
      
      privacyService.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to load privacy settings:', expect.any(Error));
      
      // Should fall back to defaults
      const consent = privacyService.getConsent();
      expect(consent.functional).toBe(true);
      expect(consent.analytics).toBe(false);
    });

    test('validates consent expiry on initialization', () => {
      const oldTimestamp = (Date.now() - 400 * 24 * 60 * 60 * 1000).toString(); // 400 days ago
      const storedConsent = { analytics: true, functional: true };
      
      testUtils.mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'privacy_consent') return JSON.stringify(storedConsent);
        if (key === 'privacy_consent_timestamp') return oldTimestamp;
        return null;
      });
      
      privacyService.initialize();
      
      const consent = privacyService.getConsent();
      expect(consent.analytics).toBe(false); // Should be reset due to expiry
      expect(console.info).toHaveBeenCalledWith('Consent expired, reset to defaults');
    });
  });

  describe('Consent Management', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('sets individual consent correctly', () => {
      privacyService.setConsent('analytics', true, 'settings', 'user-123');
      
      expect(privacyService.hasConsent('analytics')).toBe(true);
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'privacy_consent',
        expect.stringContaining('"analytics":true')
      );
    });

    test('records consent event with full context', () => {
      const userId = 'user-123';
      privacyService.setConsent('analytics', true, 'banner', userId);
      
      const history = privacyService.getConsentHistory(userId);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        userId,
        consentGiven: true,
        consentType: 'analytics',
        source: 'banner',
        userAgent: navigator.userAgent,
        version: '1.0'
      });
      expect(history[0].timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    test('sets bulk consent correctly', () => {
      const consents: Partial<ConsentSettings> = {
        analytics: true,
        performance: true,
        marketing: false
      };
      
      privacyService.setBulkConsent(consents, 'banner', 'user-123');
      
      const consent = privacyService.getConsent();
      expect(consent.analytics).toBe(true);
      expect(consent.performance).toBe(true);
      expect(consent.marketing).toBe(false);
      
      const history = privacyService.getConsentHistory('user-123');
      expect(history).toHaveLength(3); // One event per consent type
    });

    test('logs consent changes for audit trail', () => {
      privacyService.setConsent('analytics', true, 'settings', 'user-123');
      
      expect(console.info).toHaveBeenCalledWith(
        'Consent granted for analytics',
        expect.objectContaining({
          previousConsent: false,
          newConsent: true,
          source: 'settings',
          userId: 'user-123'
        })
      );
    });
  });

  describe('Consent Queries', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('checks analytics tracking permission correctly', () => {
      // Both analytics and functional must be true
      privacyService.setConsent('analytics', true);
      privacyService.setConsent('functional', true);
      expect(privacyService.canTrackAnalytics()).toBe(true);
      
      privacyService.setConsent('analytics', false);
      expect(privacyService.canTrackAnalytics()).toBe(false);
      
      privacyService.setConsent('analytics', true);
      privacyService.setConsent('functional', false);
      expect(privacyService.canTrackAnalytics()).toBe(false);
    });

    test('checks error tracking permission correctly', () => {
      privacyService.setConsent('errorTracking', true);
      privacyService.setConsent('functional', true);
      expect(privacyService.canTrackErrors()).toBe(true);
      
      privacyService.setConsent('errorTracking', false);
      expect(privacyService.canTrackErrors()).toBe(false);
    });

    test('checks performance monitoring permission correctly', () => {
      privacyService.setConsent('performance', true);
      privacyService.setConsent('functional', true);
      expect(privacyService.canMonitorPerformance()).toBe(true);
      
      privacyService.setConsent('performance', false);
      expect(privacyService.canMonitorPerformance()).toBe(false);
    });

    test('checks session recording permission correctly', () => {
      privacyService.setConsent('sessionRecording', true);
      privacyService.setConsent('analytics', true);
      expect(privacyService.canRecordSessions()).toBe(true);
      
      privacyService.setConsent('sessionRecording', false);
      expect(privacyService.canRecordSessions()).toBe(false);
      
      privacyService.setConsent('sessionRecording', true);
      privacyService.setConsent('analytics', false);
      expect(privacyService.canRecordSessions()).toBe(false);
    });
  });

  describe('Privacy Settings', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('sets privacy settings correctly', () => {
      const settings: Partial<PrivacySettings> = {
        dataProcessing: true,
        dataRetention: '2years',
        marketingCommunication: false
      };
      
      privacyService.setPrivacySettings(settings);
      
      const privacy = privacyService.getPrivacySettings();
      expect(privacy.dataProcessing).toBe(true);
      expect(privacy.dataRetention).toBe('2years');
      expect(privacy.marketingCommunication).toBe(false);
      
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'privacy_settings',
        expect.stringContaining('"dataProcessing":true')
      );
    });

    test('handles privacy settings save failure gracefully', () => {
      testUtils.mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      privacyService.setPrivacySettings({ dataProcessing: true });
      
      expect(console.warn).toHaveBeenCalledWith('Failed to save privacy settings:', expect.any(Error));
    });
  });

  describe('Consent Banner Logic', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('shows banner when no consent exists', () => {
      testUtils.mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(privacyService.shouldShowConsentBanner()).toBe(true);
    });

    test('shows banner when consent is expired', () => {
      const oldTimestamp = (Date.now() - 400 * 24 * 60 * 60 * 1000).toString(); // 400 days ago
      
      testUtils.mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'privacy_consent') return '{"analytics":true}';
        if (key === 'privacy_consent_timestamp') return oldTimestamp;
        return null;
      });
      
      expect(privacyService.shouldShowConsentBanner()).toBe(true);
    });

    test('does not show banner when consent is recent', () => {
      const recentTimestamp = (Date.now() - 30 * 24 * 60 * 60 * 1000).toString(); // 30 days ago
      
      testUtils.mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'privacy_consent') return '{"analytics":true}';
        if (key === 'privacy_consent_timestamp') return recentTimestamp;
        return null;
      });
      
      expect(privacyService.shouldShowConsentBanner()).toBe(false);
    });
  });

  describe('Data Export (GDPR)', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('creates data export request successfully', async () => {
      const userId = 'user-123';
      const request = await privacyService.createDataExport(userId);
      
      expect(request.type).toBe('export');
      expect(request.userId).toBe(userId);
      expect(request.status).toBe('completed');
      expect(request.requestId).toMatch(/^export_/);
      expect(request.timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    test('handles export failure gracefully', async () => {
      // Mock a failure in the export process
      jest.spyOn(privacyService as any, 'getAnalyticsData').mockRejectedValue(new Error('API failure'));
      
      await expect(privacyService.createDataExport('user-123')).rejects.toThrow('API failure');
    });
  });

  describe('Data Deletion (Right to be Forgotten)', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('processes data deletion successfully', async () => {
      const userId = 'user-123';
      
      // Add some consent history for the user
      privacyService.setConsent('analytics', true, 'settings', userId);
      expect(privacyService.getConsentHistory(userId)).toHaveLength(1);
      
      const request = await privacyService.processDataDeletion(userId);
      
      expect(request.type).toBe('delete');
      expect(request.userId).toBe(userId);
      expect(request.status).toBe('completed');
      expect(request.requestId).toMatch(/^delete_/);
      
      // Consent history should be cleared for this user
      expect(privacyService.getConsentHistory(userId)).toHaveLength(0);
    });

    test('handles deletion failure gracefully', async () => {
      // Mock a failure in the deletion process
      jest.spyOn(privacyService as any, 'deleteAnalyticsData').mockRejectedValue(new Error('Deletion failed'));
      
      const request = await privacyService.processDataDeletion('user-123');
      expect(request.status).toBe('failed');
    });
  });

  describe('Consent History', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('tracks consent history correctly', () => {
      privacyService.setConsent('analytics', true, 'banner', 'user-1');
      privacyService.setConsent('performance', false, 'settings', 'user-1');
      privacyService.setConsent('analytics', true, 'settings', 'user-2');
      
      const allHistory = privacyService.getConsentHistory();
      expect(allHistory).toHaveLength(3);
      
      const user1History = privacyService.getConsentHistory('user-1');
      expect(user1History).toHaveLength(2);
      expect(user1History[0].consentType).toBe('analytics');
      expect(user1History[1].consentType).toBe('performance');
      
      const user2History = privacyService.getConsentHistory('user-2');
      expect(user2History).toHaveLength(1);
      expect(user2History[0].userId).toBe('user-2');
    });

    test('limits stored consent history to prevent storage overflow', () => {
      // Simulate many consent changes
      for (let i = 0; i < 150; i++) {
        privacyService.setConsent('analytics', i % 2 === 0, 'settings', `user-${i}`);
      }
      
      // Should only store last 100 events in localStorage
      expect(testUtils.mockLocalStorage.setItem).toHaveBeenCalledWith(
        'privacy_consent_history',
        expect.any(String)
      );
      
      const lastCall = testUtils.mockLocalStorage.setItem.mock.calls
        .find(call => call[0] === 'privacy_consent_history');
      const storedHistory = JSON.parse(lastCall![1]);
      expect(storedHistory.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Retention Policy', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('returns correct data retention policy', () => {
      privacyService.setPrivacySettings({ dataRetention: '2years' });
      
      const policy = privacyService.getDataRetentionPolicy();
      
      expect(policy).toEqual({
        analytics: '2years',
        errors: '2years',
        performance: '6months',
        consent: '7years'
      });
    });
  });

  describe('Compliance Checks', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('checks GDPR compliance correctly', () => {
      // Set up valid consent
      privacyService.setConsent('analytics', true, 'banner', 'user-123');
      privacyService.setPrivacySettings({ dataRetention: '1year' });
      
      const compliance = privacyService.isCompliant();
      
      expect(compliance.gdpr).toBe(true);
      expect(compliance.issues).toHaveLength(0);
    });

    test('identifies GDPR violations', () => {
      // Set up violations
      privacyService.setConsent('analytics', true, 'banner', 'user-123');
      privacyService.setPrivacySettings({ dataRetention: 'indefinite' });
      
      // Make consent appear old by mocking the consent history
      (privacyService as any).consentHistory = [{
        userId: 'user-123',
        timestamp: Date.now() - 400 * 24 * 60 * 60 * 1000, // 400 days ago
        consentGiven: true,
        consentType: 'analytics',
        source: 'banner',
        userAgent: navigator.userAgent,
        version: '1.0'
      }];
      
      const compliance = privacyService.isCompliant();
      
      expect(compliance.gdpr).toBe(false);
      expect(compliance.issues).toContain('Data retention period should be limited');
    });

    test('checks CCPA compliance correctly', () => {
      privacyService.setPrivacySettings({
        dataSharing: false,
        marketingCommunication: false
      });
      
      const compliance = privacyService.isCompliant();
      
      expect(compliance.ccpa).toBe(true);
    });

    test('identifies CCPA violations', () => {
      privacyService.setPrivacySettings({
        dataSharing: true,
        marketingCommunication: false
      });
      
      const compliance = privacyService.isCompliant();
      
      expect(compliance.ccpa).toBe(false);
      expect(compliance.issues).toContain('Users must be able to opt-out of data sharing');
    });

    test('assumes COPPA compliance for general app', () => {
      const compliance = privacyService.isCompliant();
      expect(compliance.coppa).toBe(true);
    });
  });

  describe('Storage Error Handling', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('handles localStorage save failures gracefully', () => {
      testUtils.mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      privacyService.setConsent('analytics', true);
      
      expect(console.warn).toHaveBeenCalledWith('Failed to save privacy settings:', expect.any(Error));
      // Should still update in-memory state
      expect(privacyService.hasConsent('analytics')).toBe(true);
    });

    test('handles localStorage load failures gracefully', () => {
      testUtils.mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      privacyService.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to load privacy settings:', expect.any(Error));
      // Should fall back to default settings
      const consent = privacyService.getConsent();
      expect(consent.functional).toBe(true);
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      privacyService.initialize();
    });

    test('applies consent to services when changed', () => {
      privacyService.setConsent('analytics', true);
      
      expect(console.info).toHaveBeenCalledWith(
        'Applying consent to services:',
        expect.objectContaining({ analytics: true })
      );
    });

    test('applies privacy settings when changed', () => {
      privacyService.setPrivacySettings({ dataProcessing: true });
      
      expect(console.info).toHaveBeenCalledWith(
        'Applying privacy settings:',
        expect.objectContaining({ dataProcessing: true })
      );
    });
  });
});