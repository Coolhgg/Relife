// Voice Biometrics Service for Relife Smart Alarm
// Advanced voice authentication, training, and biometric analysis

import type { User } from '../types';
import { ErrorHandler } from './error-handler';
import PerformanceMonitor from './performance-monitor';
import { SupabaseService } from './supabase';

export interface VoicePrint {
  userId: string;
  features: {
    fundamentalFrequency: number[];
    formants: number[][];
    spectralCentroid: number[];
    mfcc: number[][]; // Mel-frequency cepstral coefficients
    voiceQuality: {
      jitter: number;
      shimmer: number;
      harmonicsRatio: number;
    };
  };
  confidence: number;
  recordedAt: Date;
  language: string;
  accent: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'tired';
}

export interface VoiceTrainingSession {
  userId: string;
  sessionId: string;
  phrases: string[];
  recordings: AudioBuffer[];
  quality: number;
  duration: number;
  completedAt: Date;
  improvements: string[];
}

export interface VoiceAuthentication {
  userId: string;
  authenticated: boolean;
  confidence: number;
  matchedFeatures: string[];
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface VoiceMoodAnalysis {
  detectedMood: 'happy' | 'sad' | 'angry' | 'excited' | 'tired' | 'neutral';
  confidence: number;
  energyLevel: number;
  stressLevel: number;
  recommendations: string[];
}

class VoiceBiometricsService {
  private static instance: VoiceBiometricsService;
  private performanceMonitor = PerformanceMonitor.getInstance();
  private audioContext: AudioContext | null = null;
  private voicePrints = new Map<string, VoicePrint[]>();
  private trainingData = new Map<string, VoiceTrainingSession[]>();
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;

  private constructor() {
    this.initializeAudioContext();
  }

  static getInstance(): VoiceBiometricsService {
    if (!VoiceBiometricsService.instance) {
      VoiceBiometricsService.instance = new VoiceBiometricsService();
    }
    return VoiceBiometricsService.instance;
  }

  /**
   * Initialize audio context for voice analysis
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Start voice training session for user
   */
  async startVoiceTraining(
    userId: string,
    trainingPhrases: string[] = this.getDefaultTrainingPhrases()
  ): Promise<string> {
    try {
      const sessionId = this.generateSessionId();

      const session: VoiceTrainingSession = {
        userId,
        sessionId,
        phrases: trainingPhrases,
        recordings: [],
        quality: 0,
        duration: 0,
        completedAt: new Date(),
        improvements: []
      };

      // Initialize training session
      const userSessions = this.trainingData.get(userId) || [];
      userSessions.push(session);
      this.trainingData.set(userId, userSessions);

      this.performanceMonitor.trackCustomMetric('voice_training_started', 1);

      return sessionId;
    } catch (error) {
      ErrorHandler.handleError(
        error as Error,
        'Failed to start voice training',
        { userId }
      );
      throw error;
    }
  }

  /**
   * Record voice sample for training or authentication
   */
  async recordVoiceSample(
    duration: number = 5000,
    phrase?: string
  ): Promise<AudioBuffer> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.audioContext) {
          await this.initializeAudioContext();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          }
        });

        const chunks: Blob[] = [];
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

            stream.getTracks().forEach(track => track.stop());
            resolve(audioBuffer);
          } catch (error) {
            reject(error);
          }
        };

        this.mediaRecorder.start();
        this.isRecording = true;

        // Stop recording after specified duration
        setTimeout(() => {
          if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
          }
        }, duration);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Analyze voice sample and extract biometric features
   */
  async analyzeVoiceSample(audioBuffer: AudioBuffer, userId: string): Promise<VoicePrint> {
    try {
      const startTime = performance.now();

      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Extract voice features
      const fundamentalFrequency = this.extractFundamentalFrequency(audioData, sampleRate);
      const formants = this.extractFormants(audioData, sampleRate);
      const spectralCentroid = this.extractSpectralCentroid(audioData, sampleRate);
      const mfcc = this.extractMFCC(audioData, sampleRate);
      const voiceQuality = this.analyzeVoiceQuality(audioData, sampleRate);

      // Detect language and accent patterns
      const language = await this.detectLanguage(audioData);
      const accent = await this.detectAccent(audioData, language);

      // Analyze emotional state
      const emotion = this.analyzeEmotion(audioData, sampleRate);

      const voicePrint: VoicePrint = {
        userId,
        features: {
          fundamentalFrequency,
          formants,
          spectralCentroid,
          mfcc,
          voiceQuality
        },
        confidence: this.calculateConfidence(audioData),
        recordedAt: new Date(),
        language,
        accent,
        emotion
      };

      // Store voice print
      const userPrints = this.voicePrints.get(userId) || [];
      userPrints.push(voicePrint);

      // Keep only last 10 voice prints
      if (userPrints.length > 10) {
        userPrints.splice(0, userPrints.length - 10);
      }

      this.voicePrints.set(userId, userPrints);

      // Store in database
      await this.storeVoicePrint(voicePrint);

      const duration = performance.now() - startTime;
      this.performanceMonitor.trackCustomMetric('voice_analysis_duration', duration);

      return voicePrint;

    } catch (error) {
      ErrorHandler.handleError(
        error as Error,
        'Voice analysis failed',
        { userId }
      );
      throw error;
    }
  }

  /**
   * Authenticate user using voice biometrics
   */
  async authenticateUser(audioBuffer: AudioBuffer, expectedUserId: string): Promise<VoiceAuthentication> {
    try {
      const voicePrint = await this.analyzeVoiceSample(audioBuffer, expectedUserId);
      const storedPrints = this.voicePrints.get(expectedUserId) || [];

      if (storedPrints.length === 0) {
        return {
          userId: expectedUserId,
          authenticated: false,
          confidence: 0,
          matchedFeatures: [],
          riskLevel: 'high',
          timestamp: new Date()
        };
      }

      // Compare with stored voice prints
      const similarities = storedPrints.map(stored => this.compareVoicePrints(voicePrint, stored));
      const maxSimilarity = Math.max(...similarities);
      const averageSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;

      const matchedFeatures = this.identifyMatchedFeatures(voicePrint, storedPrints);

      // Authentication logic
      const authenticated = maxSimilarity > 0.8 && averageSimilarity > 0.65;
      const confidence = (maxSimilarity * 0.6 + averageSimilarity * 0.4) * 100;

      const riskLevel = this.assessRiskLevel(confidence, matchedFeatures);

      const authentication: VoiceAuthentication = {
        userId: expectedUserId,
        authenticated,
        confidence,
        matchedFeatures,
        riskLevel,
        timestamp: new Date()
      };

      // Log authentication attempt
      await this.logAuthenticationAttempt(authentication);

      this.performanceMonitor.trackCustomMetric('voice_authentication_attempt', 1);

      return authentication;

    } catch (error) {
      ErrorHandler.handleError(
        error as Error,
        'Voice authentication failed',
        { userId: expectedUserId }
      );
      throw error;
    }
  }

  /**
   * Analyze voice for mood detection
   */
  async analyzeMood(audioBuffer: AudioBuffer): Promise<VoiceMoodAnalysis> {
    try {
      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Extract mood-related features
      const energy = this.calculateEnergyLevel(audioData);
      const pitch = this.extractFundamentalFrequency(audioData, sampleRate);
      const spectralFeatures = this.extractSpectralFeatures(audioData, sampleRate);

      // Analyze prosodic features
      const prosody = this.analyzeProsody(audioData, sampleRate);

      // Mood classification
      const detectedMood = this.classifyMood(energy, pitch, spectralFeatures, prosody);
      const confidence = this.calculateMoodConfidence(energy, pitch, spectralFeatures);

      // Calculate stress level
      const stressLevel = this.calculateStressLevel(audioData, sampleRate);

      // Generate recommendations
      const recommendations = this.generateMoodRecommendations(detectedMood, energy, stressLevel);

      return {
        detectedMood,
        confidence,
        energyLevel: energy,
        stressLevel,
        recommendations
      };

    } catch (error) {
      console.error('Mood analysis failed:', error);
      return {
        detectedMood: 'neutral',
        confidence: 0,
        energyLevel: 0.5,
        stressLevel: 0.5,
        recommendations: ['Unable to analyze mood at this time']
      };
    }
  }

  /**
   * Get user's voice training progress
   */
  async getTrainingProgress(userId: string): Promise<{
    sessionsCompleted: number;
    totalSamples: number;
    averageQuality: number;
    improvements: string[];
    nextSteps: string[];
  }> {
    try {
      const sessions = this.trainingData.get(userId) || [];
      const voicePrints = this.voicePrints.get(userId) || [];

      const sessionsCompleted = sessions.length;
      const totalSamples = voicePrints.length;
      const averageQuality = voicePrints.reduce((sum, print) => sum + print.confidence, 0) / totalSamples || 0;

      const allImprovements = sessions.flatMap(session => session.improvements);
      const improvements = [...new Set(allImprovements)];

      const nextSteps = this.generateTrainingNextSteps(sessions, voicePrints);

      return {
        sessionsCompleted,
        totalSamples,
        averageQuality,
        improvements,
        nextSteps
      };

    } catch (error) {
      console.error('Failed to get training progress:', error);
      return {
        sessionsCompleted: 0,
        totalSamples: 0,
        averageQuality: 0,
        improvements: [],
        nextSteps: ['Start voice training to improve accuracy']
      };
    }
  }

  /**
   * Extract fundamental frequency (pitch)
   */
  private extractFundamentalFrequency(audioData: Float32Array, sampleRate: number): number[] {
    const windowSize = 1024;
    const hopSize = 512;
    const frequencies: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const frequency = this.autocorrelationPitch(window, sampleRate);
      if (frequency > 50 && frequency < 800) { // Valid vocal range
        frequencies.push(frequency);
      }
    }

    return frequencies;
  }

  /**
   * Autocorrelation-based pitch detection
   */
  private autocorrelationPitch(buffer: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min

    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;

      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Extract formant frequencies
   */
  private extractFormants(audioData: Float32Array, sampleRate: number): number[][] {
    // Simplified formant extraction using FFT peaks
    const formants: number[][] = [];
    const windowSize = 1024;
    const hopSize = 512;

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const spectrum = this.fft(window);
      const peaks = this.findSpectralPeaks(spectrum, sampleRate);
      formants.push(peaks.slice(0, 4)); // First 4 formants
    }

    return formants;
  }

  /**
   * Extract MFCC features
   */
  private extractMFCC(audioData: Float32Array, sampleRate: number): number[][] {
    const mfccs: number[][] = [];
    const windowSize = 1024;
    const hopSize = 512;
    const numMFCC = 13;

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const mfcc = this.computeMFCC(window, sampleRate, numMFCC);
      mfccs.push(mfcc);
    }

    return mfccs;
  }

  /**
   * Analyze voice quality metrics
   */
  private analyzeVoiceQuality(audioData: Float32Array, sampleRate: number): {
    jitter: number;
    shimmer: number;
    harmonicsRatio: number;
  } {
    const pitch = this.extractFundamentalFrequency(audioData, sampleRate);

    // Calculate jitter (pitch period variation)
    const jitter = pitch.length > 1 ?
      this.calculateStandardDeviation(pitch) / this.calculateMean(pitch) : 0;

    // Calculate shimmer (amplitude variation)
    const amplitudes = this.extractAmplitudeEnvelope(audioData);
    const shimmer = amplitudes.length > 1 ?
      this.calculateStandardDeviation(amplitudes) / this.calculateMean(amplitudes) : 0;

    // Calculate harmonics-to-noise ratio
    const harmonicsRatio = this.calculateHarmonicsRatio(audioData, sampleRate);

    return { jitter, shimmer, harmonicsRatio };
  }

  /**
   * Compare two voice prints for similarity
   */
  private compareVoicePrints(print1: VoicePrint, print2: VoicePrint): number {
    let similarity = 0;
    let weights = 0;

    // Compare fundamental frequency
    if (print1.features.fundamentalFrequency.length > 0 && print2.features.fundamentalFrequency.length > 0) {
      const f1Mean = this.calculateMean(print1.features.fundamentalFrequency);
      const f2Mean = this.calculateMean(print2.features.fundamentalFrequency);
      const freqSimilarity = 1 - Math.abs(f1Mean - f2Mean) / Math.max(f1Mean, f2Mean);
      similarity += freqSimilarity * 0.3;
      weights += 0.3;
    }

    // Compare MFCC features
    if (print1.features.mfcc.length > 0 && print2.features.mfcc.length > 0) {
      const mfccSimilarity = this.compareMFCCFeatures(print1.features.mfcc, print2.features.mfcc);
      similarity += mfccSimilarity * 0.4;
      weights += 0.4;
    }

    // Compare voice quality
    const qualitySimilarity = this.compareVoiceQuality(
      print1.features.voiceQuality,
      print2.features.voiceQuality
    );
    similarity += qualitySimilarity * 0.3;
    weights += 0.3;

    return weights > 0 ? similarity / weights : 0;
  }

  /**
   * Utility methods
   */
  private getDefaultTrainingPhrases(): string[] {
    return [
      "Good morning, this is my voice training session.",
      "My name is unique and this is how I sound.",
      "I am recording my voice for biometric authentication.",
      "The quick brown fox jumps over the lazy dog.",
      "She sells seashells by the seashore.",
      "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
      "Peter Piper picked a peck of pickled peppers.",
      "Red leather, yellow leather, repeat rapidly.",
      "Unique New York, truly rural, toy boat.",
      "I need to wake up on time every morning."
    ];
  }

  private generateSessionId(): string {
    return `voice_training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateConfidence(audioData: Float32Array): number {
    const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    const snr = this.estimateSignalToNoiseRatio(audioData);
    const duration = audioData.length / 44100;

    let confidence = 0.5;

    // Adjust based on signal strength
    if (rms > 0.01) confidence += 0.2;
    if (rms > 0.05) confidence += 0.1;

    // Adjust based on SNR
    if (snr > 10) confidence += 0.15;
    if (snr > 20) confidence += 0.05;

    // Adjust based on duration
    if (duration > 2) confidence += 0.1;
    if (duration > 4) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  private async detectLanguage(audioData: Float32Array): Promise<string> {
    // Simplified language detection based on spectral characteristics
    const spectralFeatures = this.extractSpectralFeatures(audioData, 44100);

    // This would normally use a trained model
    // For now, return English as default
    return 'en-US';
  }

  private async detectAccent(audioData: Float32Array, language: string): Promise<string> {
    // Simplified accent detection
    // In production, this would use ML models
    return 'General American';
  }

  private analyzeEmotion(audioData: Float32Array, sampleRate: number): VoicePrint['emotion'] {
    const energy = this.calculateEnergyLevel(audioData);
    const pitch = this.extractFundamentalFrequency(audioData, sampleRate);
    const pitchMean = pitch.length > 0 ? this.calculateMean(pitch) : 0;

    // Simple emotion classification based on energy and pitch
    if (energy > 0.7 && pitchMean > 200) return 'excited';
    if (energy > 0.6 && pitchMean > 180) return 'happy';
    if (energy < 0.3 && pitchMean < 150) return 'sad';
    if (energy > 0.8 && pitchMean > 220) return 'angry';
    if (energy < 0.4) return 'tired';

    return 'neutral';
  }

  // Additional utility methods would be implemented here...
  private fft(signal: Float32Array): Float32Array {
    // Simplified FFT implementation
    return signal;
  }

  private findSpectralPeaks(spectrum: Float32Array, sampleRate: number): number[] {
    // Find spectral peaks for formant detection
    return [500, 1500, 2500, 3500]; // Placeholder formant values
  }

  private computeMFCC(window: Float32Array, sampleRate: number, numMFCC: number): number[] {
    // Simplified MFCC computation
    return new Array(numMFCC).fill(0).map(() => Math.random() * 0.1 - 0.05);
  }

  private extractAmplitudeEnvelope(audioData: Float32Array): number[] {
    const windowSize = 1024;
    const envelope: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
      envelope.push(rms);
    }

    return envelope;
  }

  private calculateHarmonicsRatio(audioData: Float32Array, sampleRate: number): number {
    // Simplified harmonics-to-noise ratio calculation
    const signal = this.calculateEnergyLevel(audioData);
    const noise = this.estimateNoiseLevel(audioData);
    return signal > 0 ? signal / Math.max(noise, 0.001) : 0;
  }

  private calculateMean(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private estimateSignalToNoiseRatio(audioData: Float32Array): number {
    const signal = this.calculateEnergyLevel(audioData);
    const noise = this.estimateNoiseLevel(audioData);
    return signal > 0 && noise > 0 ? 20 * Math.log10(signal / noise) : 0;
  }

  private calculateEnergyLevel(audioData: Float32Array): number {
    const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    return Math.min(1.0, rms * 10); // Normalized energy level
  }

  private estimateNoiseLevel(audioData: Float32Array): number {
    // Simple noise estimation using minimum energy windows
    const windowSize = 1024;
    const energies: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const energy = window.reduce((sum, sample) => sum + sample * sample, 0) / window.length;
      energies.push(energy);
    }

    energies.sort((a, b) => a - b);
    return Math.sqrt(energies[Math.floor(energies.length * 0.1)]); // 10th percentile as noise estimate
  }

  private extractSpectralFeatures(audioData: Float32Array, sampleRate: number): any {
    return {
      spectralCentroid: this.extractSpectralCentroid(audioData, sampleRate),
      spectralRolloff: this.calculateSpectralRolloff(audioData, sampleRate),
      spectralFlux: this.calculateSpectralFlux(audioData, sampleRate)
    };
  }

  private extractSpectralCentroid(audioData: Float32Array, sampleRate: number): number[] {
    // Simplified spectral centroid calculation
    return [1500, 1600, 1400, 1550]; // Placeholder values
  }

  private calculateSpectralRolloff(audioData: Float32Array, sampleRate: number): number {
    return 3000; // Placeholder value
  }

  private calculateSpectralFlux(audioData: Float32Array, sampleRate: number): number {
    return 0.5; // Placeholder value
  }

  private analyzeProsody(audioData: Float32Array, sampleRate: number): any {
    const pitch = this.extractFundamentalFrequency(audioData, sampleRate);
    const energy = this.extractAmplitudeEnvelope(audioData);

    return {
      pitchVariation: pitch.length > 1 ? this.calculateStandardDeviation(pitch) : 0,
      energyVariation: energy.length > 1 ? this.calculateStandardDeviation(energy) : 0,
      speakingRate: this.estimateSpeakingRate(audioData, sampleRate)
    };
  }

  private classifyMood(energy: number, pitch: number[], spectralFeatures: any, prosody: any): VoiceMoodAnalysis['detectedMood'] {
    const avgPitch = this.calculateMean(pitch);
    const pitchVariation = prosody.pitchVariation;

    if (energy > 0.7 && avgPitch > 200 && pitchVariation > 30) return 'excited';
    if (energy > 0.5 && avgPitch > 180 && pitchVariation > 20) return 'happy';
    if (energy < 0.3 && avgPitch < 150) return 'sad';
    if (energy > 0.8 && pitchVariation > 40) return 'angry';
    if (energy < 0.4 && prosody.speakingRate < 0.5) return 'tired';

    return 'neutral';
  }

  private calculateMoodConfidence(energy: number, pitch: number[], spectralFeatures: any): number {
    // Simple confidence calculation based on feature clarity
    const pitchStability = pitch.length > 1 ? 1 - (this.calculateStandardDeviation(pitch) / this.calculateMean(pitch)) : 0;
    const energyLevel = Math.min(1.0, energy);

    return (pitchStability * 0.5 + energyLevel * 0.5) * 100;
  }

  private calculateStressLevel(audioData: Float32Array, sampleRate: number): number {
    const pitch = this.extractFundamentalFrequency(audioData, sampleRate);
    const energy = this.calculateEnergyLevel(audioData);
    const pitchVariation = pitch.length > 1 ? this.calculateStandardDeviation(pitch) / this.calculateMean(pitch) : 0;

    // Higher pitch variation and energy typically indicate stress
    const stressIndicators = (pitchVariation * 0.6) + (energy * 0.4);
    return Math.min(1.0, stressIndicators);
  }

  private generateMoodRecommendations(mood: VoiceMoodAnalysis['detectedMood'], energy: number, stress: number): string[] {
    const recommendations: string[] = [];

    switch (mood) {
      case 'tired':
        recommendations.push('Consider a gentler alarm tone');
        recommendations.push('Try going to bed earlier tonight');
        break;
      case 'stressed':
      case 'angry':
        recommendations.push('Use calming voice tones');
        recommendations.push('Consider stress reduction techniques');
        break;
      case 'sad':
        recommendations.push('Use encouraging, uplifting messages');
        recommendations.push('Consider motivational alarm content');
        break;
      case 'excited':
      case 'happy':
        recommendations.push('Current settings seem to work well');
        recommendations.push('Maintain current sleep schedule');
        break;
      default:
        recommendations.push('Voice analysis complete');
    }

    if (stress > 0.7) {
      recommendations.push('High stress detected - consider relaxation exercises');
    }

    return recommendations;
  }

  private estimateSpeakingRate(audioData: Float32Array, sampleRate: number): number {
    // Simplified speaking rate estimation
    const duration = audioData.length / sampleRate;
    const energy = this.extractAmplitudeEnvelope(audioData);
    const activeSpeech = energy.filter(e => e > 0.1).length;

    return activeSpeech / duration; // Rough estimate of speech activity per second
  }

  private identifyMatchedFeatures(print1: VoicePrint, storedPrints: VoicePrint[]): string[] {
    const features: string[] = [];

    // This would compare specific features and identify matches
    features.push('fundamental_frequency');
    features.push('voice_quality');

    return features;
  }

  private assessRiskLevel(confidence: number, matchedFeatures: string[]): VoiceAuthentication['riskLevel'] {
    if (confidence > 90 && matchedFeatures.length > 3) return 'low';
    if (confidence > 70 && matchedFeatures.length > 2) return 'medium';
    return 'high';
  }

  private compareMFCCFeatures(mfcc1: number[][], mfcc2: number[][]): number {
    // Simplified MFCC comparison
    return Math.random() * 0.3 + 0.5; // Placeholder similarity
  }

  private compareVoiceQuality(quality1: any, quality2: any): number {
    const jitterSim = 1 - Math.abs(quality1.jitter - quality2.jitter) / Math.max(quality1.jitter, quality2.jitter, 0.01);
    const shimmerSim = 1 - Math.abs(quality1.shimmer - quality2.shimmer) / Math.max(quality1.shimmer, quality2.shimmer, 0.01);
    const harmonicsSim = 1 - Math.abs(quality1.harmonicsRatio - quality2.harmonicsRatio) / Math.max(quality1.harmonicsRatio, quality2.harmonicsRatio, 0.01);

    return (jitterSim + shimmerSim + harmonicsSim) / 3;
  }

  private generateTrainingNextSteps(sessions: VoiceTrainingSession[], prints: VoicePrint[]): string[] {
    const steps: string[] = [];

    if (sessions.length === 0) {
      steps.push('Complete your first voice training session');
    } else if (sessions.length < 3) {
      steps.push('Complete more training sessions for better accuracy');
    } else if (prints.length < 10) {
      steps.push('Record more voice samples in different environments');
    } else {
      steps.push('Voice training is complete - excellent accuracy achieved');
    }

    return steps;
  }

  private async storeVoicePrint(voicePrint: VoicePrint): Promise<void> {
    try {
      const { error } = await SupabaseService.getInstance().client
        .from('voice_prints')
        .insert({
          user_id: voicePrint.userId,
          features: voicePrint.features,
          confidence: voicePrint.confidence,
          language: voicePrint.language,
          accent: voicePrint.accent,
          emotion: voicePrint.emotion,
          recorded_at: voicePrint.recordedAt.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store voice print:', error);
    }
  }

  private async logAuthenticationAttempt(auth: VoiceAuthentication): Promise<void> {
    try {
      const { error } = await SupabaseService.getInstance().client
        .from('voice_authentication_logs')
        .insert({
          user_id: auth.userId,
          authenticated: auth.authenticated,
          confidence: auth.confidence,
          matched_features: auth.matchedFeatures,
          risk_level: auth.riskLevel,
          timestamp: auth.timestamp.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log authentication attempt:', error);
    }
  }
}

export default VoiceBiometricsService;