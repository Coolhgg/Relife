/// <reference lib="dom" />
/**
 * AI Voice Cloning Integration Tests
 *
 * Comprehensive end-to-end tests for AI voice cloning functionality including:
 * - Voice recording and sample upload
 * - AI voice cloning with premium TTS services
 * - Voice biometrics authentication and training
 * - Voice personalities and contextual message generation
 * - Premium subscription validation and feature access
 * - Error handling, performance validation, and analytics tracking
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import VoiceCloning from '../../src/components/VoiceCloning';
import { SupabaseService } from '../../src/services/supabase';
import VoiceAIEnhancedService from '../../src/services/voice-ai-enhanced';
import VoiceBiometricsService from '../../src/services/voice-biometrics';
import { PremiumVoiceService } from '../../src/services/premium-voice';
import { PremiumService } from '../../src/services/premium';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import test utilities
import {
  createMockUser,
  createMockAlarm,
  measurePerformance,
  setupAllMocks,
} from '../utils/test-mocks';

import type {
  User,
  VoiceCloneRequest,
  VoicePrint,
  VoiceAuthentication,
  VoiceMoodAnalysis,
} from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/voice-ai-enhanced');
vi.mock('../../src/services/voice-biometrics');
vi.mock('../../src/services/premium-voice');
vi.mock('../../src/services/premium');
vi.mock('../../src/services/app-analytics');

describe('AI Voice Cloning Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;

  // Service instances
  let voiceAIService: VoiceAIEnhancedService;
  let voiceBiometricsService: VoiceBiometricsService;
  let premiumVoiceService: PremiumVoiceService;
  let premiumService: PremiumService;
  let analyticsService: AppAnalyticsService;

  // Mock audio data
  const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
  const mockAudioBuffer = new ArrayBuffer(1024);
  const mockAudioElement = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    currentTime: 0,
    duration: 30,
    volume: 1,
    onended: null as any,
    onpause: null as any,
  };

  beforeAll(() => {
    setupAllMocks();

    // Mock additional voice-specific APIs
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: null,
      onstop: null,
      state: 'inactive',
    }));

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-audio-url');
    global.URL.revokeObjectURL = vi.fn();

    global.Audio = vi.fn().mockImplementation(() => mockAudioElement);

    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => ({
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
      resume: vi.fn().mockResolvedValue(undefined),
      state: 'running',
    }));

    console.log('Voice cloning integration tests initialized');
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser({
      id: 'voice-clone-user-123',
      email: 'voice.clone@example.com',
      name: 'Voice Clone Test User',
      subscriptionTier: 'premium',
      premiumFeatures: ['voice_cloning', 'premium_tts'],
      preferences: {
        voiceSettings: {
          enabled: true,
          defaultMood: 'motivational',
        },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Mock service instances
    voiceAIService = VoiceAIEnhancedService.getInstance() as any;
    voiceBiometricsService = VoiceBiometricsService.getInstance() as any;
    premiumVoiceService = PremiumVoiceService.getInstance() as any;
    premiumService = PremiumService.getInstance() as any;
    analyticsService = AppAnalyticsService.getInstance();

    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
      alarms: [],
      error: null,
    });

    // Mock premium service access
    vi.mocked(premiumService.hasFeatureAccess).mockResolvedValue(true);
    vi.mocked(premiumService.validateSubscription).mockResolvedValue({
      valid: true,
      tier: 'premium',
      features: ['voice_cloning', 'premium_tts'],
    });

    // Mock voice services
    vi.mocked(voiceAIService.generateContextualMessage).mockResolvedValue({
      text: 'Good morning! Time to wake up!',
      audioUrl: 'blob:mock-tts-audio',
      emotion: 'motivational',
      personalizations: ['Addressed as Test User'],
      effectiveness_prediction: 85,
    });

    // Mock analytics
    vi.mocked(analyticsService.trackVoiceCloning).mockImplementation(() => {});
    vi.mocked(analyticsService.trackPremiumFeatureUsage).mockImplementation(() => {});
    vi.mocked(analyticsService.trackVoiceBiometrics).mockImplementation(() => {});
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Voice Recording and Sample Management', () => {
    it('should record voice samples successfully', async () => {
      const performanceMeasures: { [key: string]: number } = {};

      // Step 1: Render voice cloning component
      const recordingTime = await measurePerformance(async () => {
        await act(async () => {
          const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
          container = result.container;
        });
      });

      performanceMeasures.componentRender = recordingTime;

      // Step 2: Start recording
      const recordButton = screen.getByRole('button', {
        name: /start.*recording|record.*voice/i,
      });
      expect(recordButton).toBeInTheDocument();

      // Mock successful microphone access
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(
        mockStream as any
      );

      await user.click(recordButton);

      // Should show recording state
      await waitFor(() => {
        expect(
          screen.getByText(/recording|recording in progress/i)
        ).toBeInTheDocument();
      });

      // Should show recording timer
      expect(screen.getByText(/00:0/)).toBeInTheDocument();

      // Step 3: Stop recording after simulated duration
      const stopButton = screen.getByRole('button', { name: /stop.*recording|stop/i });

      await act(async () => {
        // Simulate 5 seconds of recording
        vi.advanceTimersByTime(5000);
      });

      await user.click(stopButton);

      // Step 4: Verify recording was saved
      await waitFor(() => {
        expect(screen.getByText(/recording 1|sample 1/i)).toBeInTheDocument();
      });

      // Should show recording controls
      const playButton = screen.getByRole('button', { name: /play/i });
      const deleteButton = screen.getByRole('button', { name: /delete|remove/i });

      expect(playButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();

      // Step 5: Test playback functionality
      await user.click(playButton);

      expect(mockAudioElement.play).toHaveBeenCalled();
      expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
        action: 'sample_recorded',
        userId: mockUser.id,
        sampleDuration: expect.any(Number),
      });

      console.log('Voice recording performance:', performanceMeasures);
    });

    it('should handle file upload for voice samples', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Step 1: Find upload input
      const uploadInput = screen.getByLabelText(/upload.*audio|choose.*file/i);
      expect(uploadInput).toBeInTheDocument();

      // Step 2: Create mock audio file
      const mockFile = new File(['mock audio data'], 'voice-sample.wav', {
        type: 'audio/wav',
      });

      // Step 3: Upload file
      await user.upload(uploadInput, mockFile);

      // Step 4: Verify file was processed
      await waitFor(() => {
        expect(screen.getByText('voice-sample.wav')).toBeInTheDocument();
      });

      // Should show file controls
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete|remove/i })
      ).toBeInTheDocument();

      expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
        action: 'sample_uploaded',
        userId: mockUser.id,
        fileName: 'voice-sample.wav',
      });
    });

    it('should require minimum samples for voice cloning', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Try to create clone with no samples
      const cloneButton = screen.getByRole('button', {
        name: /create.*voice.*clone|clone.*voice/i,
      });
      await user.click(cloneButton);

      // Should show error message
      await waitFor(() => {
        expect(
          screen.getByText(/at least.*3.*samples|minimum.*samples/i)
        ).toBeInTheDocument();
      });

      // Add one sample (still not enough)
      const uploadInput = screen.getByLabelText(/upload.*audio/i);
      const mockFile = new File(['mock'], 'sample1.wav', { type: 'audio/wav' });
      await user.upload(uploadInput, mockFile);

      // Try again
      await user.click(cloneButton);

      // Should still show error
      await waitFor(() => {
        expect(screen.getByText(/at least.*3.*samples/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Voice Cloning Process', () => {
    it('should create voice clone with premium TTS integration', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Step 1: Add required voice samples
      const uploadInput = screen.getByLabelText(/upload.*audio/i);

      for (let i = 0; i < 3; i++) {
        const mockFile = new File(['mock audio data'], `sample${i + 1}.wav`, {
          type: 'audio/wav',
        });
        await user.upload(uploadInput, mockFile);

        await waitFor(() => {
          expect(screen.getByText(`sample${i + 1}.wav`)).toBeInTheDocument();
        });
      }

      // Step 2: Mock successful voice cloning
      const mockCloneRequest: VoiceCloneRequest = {
        id: 'clone-request-123',
        userId: mockUser.id,
        status: 'processing',
        samples: ['sample1.wav', 'sample2.wav', 'sample3.wav'],
        createdAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 300000), // 5 minutes
        voiceId: null,
      };

      vi.mocked(premiumVoiceService.createVoiceClone).mockResolvedValue({
        success: true,
        cloneRequest: mockCloneRequest,
      });

      // Step 3: Initiate cloning process
      const cloneButton = screen.getByRole('button', { name: /create.*voice.*clone/i });
      await user.click(cloneButton);

      // Step 4: Should show processing state
      await waitFor(() => {
        expect(screen.getByText(/processing|creating.*clone/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/estimated.*completion/i)).toBeInTheDocument();
      expect(screen.getByText(/5.*minutes/i)).toBeInTheDocument();

      // Step 5: Mock completion
      await act(async () => {
        const completedRequest = {
          ...mockCloneRequest,
          status: 'completed' as const,
          voiceId: 'voice-clone-123',
        };

        vi.mocked(premiumVoiceService.getCloneStatus).mockResolvedValue(
          completedRequest
        );
      });

      // Step 6: Simulate polling completion
      await act(async () => {
        vi.advanceTimersByTime(10000); // Advance 10 seconds for polling
      });

      await waitFor(() => {
        expect(screen.getByText(/clone.*completed|voice.*ready/i)).toBeInTheDocument();
      });

      // Step 7: Should show clone preview
      const previewButton = screen.getByRole('button', {
        name: /preview.*voice|test.*clone/i,
      });
      expect(previewButton).toBeInTheDocument();

      await user.click(previewButton);

      // Should generate and play preview
      expect(voiceAIService.generateContextualMessage).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser,
        expect.any(Object)
      );

      expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
        action: 'clone_completed',
        userId: mockUser.id,
        cloneId: 'clone-request-123',
        processingTime: expect.any(Number),
      });
    });

    it('should handle voice cloning failures gracefully', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Add samples
      const uploadInput = screen.getByLabelText(/upload.*audio/i);
      for (let i = 0; i < 3; i++) {
        const mockFile = new File(['mock'], `sample${i + 1}.wav`, {
          type: 'audio/wav',
        });
        await user.upload(uploadInput, mockFile);
      }

      // Mock cloning failure
      vi.mocked(premiumVoiceService.createVoiceClone).mockRejectedValue(
        new Error('Voice cloning service unavailable')
      );

      const cloneButton = screen.getByRole('button', { name: /create.*voice.*clone/i });
      await user.click(cloneButton);

      // Should show error state
      await waitFor(() => {
        expect(
          screen.getByText(/cloning.*failed|error.*processing/i)
        ).toBeInTheDocument();
      });

      // Should show retry option
      const retryButton = screen.getByRole('button', { name: /retry|try.*again/i });
      expect(retryButton).toBeInTheDocument();

      expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
        action: 'clone_failed',
        userId: mockUser.id,
        error: 'Voice cloning service unavailable',
      });
    });

    it('should validate premium subscription for voice cloning', async () => {
      // Create free user
      const freeUser = createMockUser({
        id: 'free-user-123',
        subscriptionTier: 'free',
        premiumFeatures: [],
      });

      // Mock access check failure
      vi.mocked(premiumService.hasFeatureAccess).mockResolvedValue(false);

      await act(async () => {
        const result = render(<VoiceCloning user={freeUser} onClose={() => {}} />);
        container = result.container;
      });

      // Should show premium upsell
      await waitFor(() => {
        expect(
          screen.getByText(/premium.*feature|upgrade.*required/i)
        ).toBeInTheDocument();
      });

      const upgradeButton = screen.getByRole('button', {
        name: /upgrade|get.*premium/i,
      });
      expect(upgradeButton).toBeInTheDocument();

      // Voice cloning controls should be disabled
      const cloneButton = screen.queryByRole('button', {
        name: /create.*voice.*clone/i,
      });
      if (cloneButton) {
        expect(cloneButton).toBeDisabled();
      }
    });
  });

  describe('Voice Biometrics and Authentication', () => {
    it('should perform voice training session', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to voice settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const voiceTab = screen.getByRole('tab', { name: /voice|biometrics/i });
      await user.click(voiceTab);

      // Step 1: Start voice training
      const trainButton = screen.getByRole('button', {
        name: /start.*training|train.*voice/i,
      });
      await user.click(trainButton);

      // Mock training session
      vi.mocked(voiceBiometricsService.startVoiceTraining).mockResolvedValue(
        'training-session-123'
      );

      // Should show training phrases
      await waitFor(() => {
        expect(screen.getByText(/speak.*phrase|read.*aloud/i)).toBeInTheDocument();
      });

      // Mock training phrases
      const trainingPhrases = [
        'Good morning, this is my voice training session',
        'My name is unique and this is how I sound',
        'I am recording my voice for biometric authentication',
      ];

      // Step 2: Complete training phrases
      for (const phrase of trainingPhrases) {
        // Should display phrase
        expect(screen.getByText(phrase)).toBeInTheDocument();

        // Mock recording
        const mockVoicePrint: VoicePrint = {
          userId: mockUser.id,
          features: {
            fundamentalFrequency: [150, 155, 152],
            formants: [
              [500, 1500],
              [520, 1480],
            ],
            spectralCentroid: [1200, 1250],
            mfcc: [
              [0.1, 0.2],
              [0.15, 0.25],
            ],
            voiceQuality: {
              jitter: 0.02,
              shimmer: 0.03,
              harmonicsRatio: 15.5,
            },
          },
          confidence: 0.85,
          recordedAt: new Date(),
          language: 'en-US',
          accent: 'General American',
          emotion: 'neutral',
        };

        vi.mocked(voiceBiometricsService.recordVoiceSample).mockResolvedValue(
          mockAudioBuffer as any
        );
        vi.mocked(voiceBiometricsService.analyzeVoiceSample).mockResolvedValue(
          mockVoicePrint
        );

        const recordPhraseButton = screen.getByRole('button', {
          name: /record.*phrase|start.*recording/i,
        });
        await user.click(recordPhraseButton);

        // Wait for recording completion
        await waitFor(() => {
          expect(
            screen.getByText(/phrase.*recorded|next.*phrase/i)
          ).toBeInTheDocument();
        });
      }

      // Step 3: Training completion
      await waitFor(() => {
        expect(
          screen.getByText(/training.*complete|voice.*profile.*ready/i)
        ).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceBiometrics).toHaveBeenCalledWith({
        action: 'training_completed',
        userId: mockUser.id,
        samplesRecorded: trainingPhrases.length,
      });
    });

    it('should authenticate user with voice biometrics', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Navigate to voice authentication
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const authTab = screen.getByRole('tab', { name: /authentication|security/i });
      await user.click(authTab);

      // Step 1: Enable voice authentication
      const voiceAuthToggle = screen.getByLabelText(
        /voice.*authentication|biometric.*auth/i
      );
      await user.click(voiceAuthToggle);

      // Step 2: Test authentication
      const testAuthButton = screen.getByRole('button', {
        name: /test.*authentication|verify.*voice/i,
      });
      await user.click(testAuthButton);

      // Should prompt for voice
      await waitFor(() => {
        expect(
          screen.getByText(/speak.*verify|voice.*verification/i)
        ).toBeInTheDocument();
      });

      // Mock successful authentication
      const mockAuth: VoiceAuthentication = {
        userId: mockUser.id,
        authenticated: true,
        confidence: 92,
        matchedFeatures: ['fundamental_frequency', 'voice_quality', 'mfcc'],
        riskLevel: 'low',
        timestamp: new Date(),
      };

      vi.mocked(voiceBiometricsService.authenticateUser).mockResolvedValue(mockAuth);

      const speakButton = screen.getByRole('button', {
        name: /start.*speaking|begin.*verification/i,
      });
      await user.click(speakButton);

      // Step 3: Should show authentication result
      await waitFor(() => {
        expect(
          screen.getByText(/authentication.*successful|verified/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/confidence.*92/i)).toBeInTheDocument();
      expect(screen.getByText(/low.*risk/i)).toBeInTheDocument();

      expect(analyticsService.trackVoiceBiometrics).toHaveBeenCalledWith({
        action: 'authentication_attempt',
        userId: mockUser.id,
        success: true,
        confidence: 92,
        riskLevel: 'low',
      });
    });

    it('should handle voice authentication failures', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const authTab = screen.getByRole('tab', { name: /authentication/i });
      await user.click(authTab);

      const testAuthButton = screen.getByRole('button', {
        name: /test.*authentication/i,
      });
      await user.click(testAuthButton);

      // Mock authentication failure
      const mockAuth: VoiceAuthentication = {
        userId: mockUser.id,
        authenticated: false,
        confidence: 35,
        matchedFeatures: ['fundamental_frequency'],
        riskLevel: 'high',
        timestamp: new Date(),
      };

      vi.mocked(voiceBiometricsService.authenticateUser).mockResolvedValue(mockAuth);

      const speakButton = screen.getByRole('button', { name: /start.*speaking/i });
      await user.click(speakButton);

      // Should show failure message
      await waitFor(() => {
        expect(
          screen.getByText(/authentication.*failed|not.*verified/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/confidence.*35|low.*confidence/i)).toBeInTheDocument();
      expect(screen.getByText(/high.*risk/i)).toBeInTheDocument();

      // Should suggest retraining
      expect(screen.getByText(/retrain.*voice|improve.*accuracy/i)).toBeInTheDocument();
    });
  });

  describe('Voice Mood Analysis and Contextual Messages', () => {
    it('should analyze voice mood and generate appropriate responses', async () => {
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        container = result.container;
      });

      // Navigate to voice analysis
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const voiceTab = screen.getByRole('tab', { name: /voice/i });
      await user.click(voiceTab);

      // Step 1: Enable mood analysis
      const moodToggle = screen.getByLabelText(/mood.*analysis|voice.*emotion/i);
      await user.click(moodToggle);

      // Step 2: Test mood analysis
      const analyzeMoodButton = screen.getByRole('button', {
        name: /analyze.*mood|test.*emotion/i,
      });
      await user.click(analyzeMoodButton);

      // Mock mood analysis result
      const mockMoodAnalysis: VoiceMoodAnalysis = {
        detectedMood: 'tired',
        confidence: 78,
        energyLevel: 0.3,
        stressLevel: 0.6,
        recommendations: [
          'Consider a gentler alarm tone',
          'Try going to bed earlier tonight',
          'High stress detected - consider relaxation exercises',
        ],
      };

      vi.mocked(voiceBiometricsService.analyzeMood).mockResolvedValue(mockMoodAnalysis);

      const recordButton = screen.getByRole('button', {
        name: /record.*mood|start.*analysis/i,
      });
      await user.click(recordButton);

      // Step 3: Should show analysis results
      await waitFor(() => {
        expect(screen.getByText(/mood.*tired|detected.*tired/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/confidence.*78/i)).toBeInTheDocument();
      expect(screen.getByText(/energy.*30|low.*energy/i)).toBeInTheDocument();
      expect(screen.getByText(/stress.*60|moderate.*stress/i)).toBeInTheDocument();

      // Should show recommendations
      mockMoodAnalysis.recommendations.forEach(recommendation => {
        expect(
          screen.getByText(
            new RegExp(recommendation.split(' ').slice(0, 3).join('.*'), 'i')
          )
        ).toBeInTheDocument();
      });

      // Step 4: Test contextual message adaptation
      const testMessageButton = screen.getByRole('button', {
        name: /test.*message|generate.*message/i,
      });
      await user.click(testMessageButton);

      // Should generate appropriate message for tired mood
      await waitFor(() => {
        expect(screen.getByText(/gentle|soft|easy/i)).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceBiometrics).toHaveBeenCalledWith({
        action: 'mood_analyzed',
        userId: mockUser.id,
        detectedMood: 'tired',
        confidence: 78,
        recommendations: mockMoodAnalysis.recommendations,
      });
    });

    it('should generate contextual wake-up messages with AI enhancement', async () => {
      // Create alarm for testing
      const mockAlarm = createMockAlarm({
        id: 'contextual-test-alarm',
        userId: mockUser.id,
        time: '07:00',
        label: 'Morning Workout',
        voiceMood: 'motivational',
      });

      // Mock context data
      const mockContext = {
        timeOfDay: 7,
        sleepQuality: 75,
        weather: { condition: 'sunny', temperature: 22 },
        dayOfWeek: 1, // Monday
      };

      // Step 1: Test message generation
      const contextualResponse = await voiceAIService.generateContextualMessage(
        mockAlarm,
        mockUser,
        mockContext
      );

      // Verify AI enhancement was called
      expect(voiceAIService.generateContextualMessage).toHaveBeenCalledWith(
        mockAlarm,
        mockUser,
        mockContext
      );

      // Step 2: Verify message quality
      expect(contextualResponse.text).toBeDefined();
      expect(contextualResponse.emotion).toBe('motivational');
      expect(contextualResponse.effectiveness_prediction).toBeGreaterThan(80);
      expect(contextualResponse.personalizations).toContain('Addressed as Test User');

      // Step 3: Test premium TTS generation
      if (mockUser.subscriptionTier === 'premium') {
        expect(contextualResponse.audioUrl).toBeDefined();
        expect(contextualResponse.audioUrl).toMatch(/blob:|mock-tts-audio/);
      }

      expect(analyticsService.trackPremiumFeatureUsage).toHaveBeenCalledWith({
        feature: 'contextual_messages',
        userId: mockUser.id,
        effectiveness: expect.any(Number),
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle voice processing under load', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Step 1: Upload multiple samples rapidly
      const uploadInput = screen.getByLabelText(/upload.*audio/i);
      const uploadPromises = [];

      for (let i = 0; i < 10; i++) {
        const mockFile = new File([`mock audio data ${i}`], `rapid-sample-${i}.wav`, {
          type: 'audio/wav',
        });

        uploadPromises.push(user.upload(uploadInput, mockFile));
      }

      // Process all uploads
      const uploadTime = await measurePerformance(async () => {
        await Promise.all(uploadPromises);
      });

      // Should handle concurrent uploads
      expect(uploadTime).toBeLessThan(5000); // Within 5 seconds

      // Step 2: Verify all samples were processed
      await waitFor(() => {
        for (let i = 0; i < 10; i++) {
          expect(screen.getByText(`rapid-sample-${i}.wav`)).toBeInTheDocument();
        }
      });

      // Step 3: Test batch processing
      const selectAllButton = screen.getByRole('button', {
        name: /select.*all|batch.*process/i,
      });
      if (selectAllButton) {
        await user.click(selectAllButton);

        const batchProcessButton = screen.getByRole('button', {
          name: /process.*batch|batch.*clone/i,
        });
        await user.click(batchProcessButton);

        // Should handle batch processing efficiently
        await waitFor(() => {
          expect(
            screen.getByText(/processing.*batch|batch.*in.*progress/i)
          ).toBeInTheDocument();
        });
      }
    });

    it('should gracefully handle microphone permission denials', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Mock permission denial
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      );

      const recordButton = screen.getByRole('button', { name: /start.*recording/i });
      await user.click(recordButton);

      // Should show permission error
      await waitFor(() => {
        expect(
          screen.getByText(/microphone.*permission|permission.*denied/i)
        ).toBeInTheDocument();
      });

      // Should show alternative options
      expect(screen.getByText(/upload.*file|choose.*file/i)).toBeInTheDocument();

      // Should provide help text
      expect(
        screen.getByText(/enable.*microphone|check.*permissions/i)
      ).toBeInTheDocument();

      expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
        action: 'permission_denied',
        userId: mockUser.id,
        error: 'NotAllowedError',
      });
    });

    it('should handle network failures gracefully', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Add samples
      const uploadInput = screen.getByLabelText(/upload.*audio/i);
      for (let i = 0; i < 3; i++) {
        const mockFile = new File(['mock'], `network-test-${i}.wav`, {
          type: 'audio/wav',
        });
        await user.upload(uploadInput, mockFile);
      }

      // Mock network failure
      vi.mocked(premiumVoiceService.createVoiceClone).mockRejectedValue(
        new Error('Network request failed')
      );

      const cloneButton = screen.getByRole('button', { name: /create.*voice.*clone/i });
      await user.click(cloneButton);

      // Should show network error
      await waitFor(() => {
        expect(
          screen.getByText(/network.*error|connection.*failed/i)
        ).toBeInTheDocument();
      });

      // Should show offline mode option
      const offlineButton = screen.getByRole('button', {
        name: /save.*offline|queue.*processing/i,
      });
      expect(offlineButton).toBeInTheDocument();

      await user.click(offlineButton);

      // Should queue for later processing
      await waitFor(() => {
        expect(
          screen.getByText(/queued.*processing|saved.*offline/i)
        ).toBeInTheDocument();
      });

      expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
        action: 'queued_offline',
        userId: mockUser.id,
        samplesCount: 3,
      });
    });
  });

  describe('Analytics and Performance Validation', () => {
    it('should track comprehensive voice cloning analytics', async () => {
      await act(async () => {
        const result = render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        container = result.container;
      });

      // Complete full voice cloning workflow
      const uploadInput = screen.getByLabelText(/upload.*audio/i);

      // Track sample uploads
      for (let i = 0; i < 3; i++) {
        const mockFile = new File(['mock'], `analytics-sample-${i}.wav`, {
          type: 'audio/wav',
        });
        await user.upload(uploadInput, mockFile);

        expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
          action: 'sample_uploaded',
          userId: mockUser.id,
          fileName: `analytics-sample-${i}.wav`,
        });
      }

      // Track clone creation
      const mockCloneRequest: VoiceCloneRequest = {
        id: 'analytics-clone-123',
        userId: mockUser.id,
        status: 'completed',
        samples: ['sample1.wav', 'sample2.wav', 'sample3.wav'],
        createdAt: new Date(),
        estimatedCompletion: new Date(),
        voiceId: 'voice-analytics-123',
      };

      vi.mocked(premiumVoiceService.createVoiceClone).mockResolvedValue({
        success: true,
        cloneRequest: mockCloneRequest,
      });

      const cloneButton = screen.getByRole('button', { name: /create.*voice.*clone/i });
      await user.click(cloneButton);

      await waitFor(() => {
        expect(analyticsService.trackVoiceCloning).toHaveBeenCalledWith({
          action: 'clone_started',
          userId: mockUser.id,
          samplesCount: 3,
          cloneId: expect.any(String),
        });
      });

      // Track premium feature usage
      expect(analyticsService.trackPremiumFeatureUsage).toHaveBeenCalledWith({
        feature: 'voice_cloning',
        userId: mockUser.id,
        subscriptionTier: 'premium',
      });
    });

    it('should validate performance metrics', async () => {
      const performanceMetrics = {
        componentRender: 0,
        sampleProcessing: 0,
        cloneCreation: 0,
      };

      // Measure component render performance
      performanceMetrics.componentRender = await measurePerformance(async () => {
        await act(async () => {
          render(<VoiceCloning user={mockUser} onClose={() => {}} />);
        });
      });

      // Measure sample processing performance
      performanceMetrics.sampleProcessing = await measurePerformance(async () => {
        const uploadInput = screen.getByLabelText(/upload.*audio/i);
        const mockFile = new File(['performance test'], 'perf-sample.wav', {
          type: 'audio/wav',
        });
        await user.upload(uploadInput, mockFile);

        await waitFor(() => {
          expect(screen.getByText('perf-sample.wav')).toBeInTheDocument();
        });
      });

      // Validate performance thresholds
      expect(performanceMetrics.componentRender).toBeLessThan(1000); // < 1s render
      expect(performanceMetrics.sampleProcessing).toBeLessThan(2000); // < 2s processing

      console.log('Voice cloning performance metrics:', performanceMetrics);
    });
  });
});
