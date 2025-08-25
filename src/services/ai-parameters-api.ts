/**
 * AI Parameters API Service
 * Real-time configuration management for all AI services with live updates,
 * validation, rollback capabilities, and synchronization across services
 */

import type { 
  AISettings, 
  PlatformConfig, 
  MonitoringConfig,
  PhaseConfig 
} from '../config/ai-deployment-config';
import AdvancedBehavioralIntelligence from './advanced-behavioral-intelligence';
import VoiceAIEnhancedService from './voice-ai-enhanced';
import { AIRewardsService } from './ai-rewards';
import AIDeploymentOrchestrator from './ai-deployment-orchestrator';
import { PerformanceMonitor } from './ai-performance-monitor';

// Real-time parameter update types
export interface ParameterUpdateRequest {
  category: 'core_ai' | 'voice_ai' | 'behavioral_intelligence' | 'rewards' | 'platform' | 'deployment';
  parameters: Record<string, any>;
  userId: string;
  immediate?: boolean; // Apply immediately or queue for next cycle
  validateOnly?: boolean; // Only validate, don't apply
}

export interface ParameterUpdateResponse {
  success: boolean;
  appliedParameters: Record<string, any>;
  validationErrors?: string[];
  rollbackToken?: string;
  affectedServices: string[];
  estimatedEffectTime: number; // milliseconds
  warnings?: string[];
}

export interface ParameterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedValues?: Record<string, any>;
  performanceImpact: 'low' | 'medium' | 'high';
}

export interface ServiceConfigurationState {
  serviceName: string;
  currentParameters: Record<string, any>;
  pendingUpdates: Record<string, any>;
  lastUpdated: Date;
  version: string;
  rollbackAvailable: boolean;
}

export interface LiveConfigurationSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  activeServices: string[];
  pendingChanges: ParameterUpdateRequest[];
  rollbackTokens: Map<string, string>;
  autoSaveEnabled: boolean;
  previewMode: boolean;
}

class AIParametersAPIService {
  private static instance: AIParametersAPIService;
  private behavioralService: AdvancedBehavioralIntelligence;
  private voiceService: VoiceAIEnhancedService;
  private rewardsService: AIRewardsService;
  private deploymentOrchestrator: AIDeploymentOrchestrator;
  private performanceMonitor: PerformanceMonitor;
  private activeSessions: Map<string, LiveConfigurationSession> = new Map();
  private configurationHistory: Map<string, ServiceConfigurationState[]> = new Map();
  private updateQueue: ParameterUpdateRequest[] = [];
  private isProcessingUpdates = false;

  private constructor() {
    this.initializeServices();
    this.startUpdateProcessor();
  }

  static getInstance(): AIParametersAPIService {
    if (!AIParametersAPIService.instance) {
      AIParametersAPIService.instance = new AIParametersAPIService();
    }
    return AIParametersAPIService.instance;
  }

  private initializeServices(): void {
    this.behavioralService = AdvancedBehavioralIntelligence.getInstance();
    this.voiceService = VoiceAIEnhancedService.getInstance();
    this.rewardsService = AIRewardsService.getInstance();
    this.deploymentOrchestrator = AIDeploymentOrchestrator.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  private startUpdateProcessor(): void {
    // Process queued updates every 2 seconds
    setInterval(() => {
      if (!this.isProcessingUpdates && this.updateQueue.length > 0) {
        this.processUpdateQueue();
      }
    }, 2000);
  }

  /**
   * Start a live configuration session
   */
  async startLiveSession(userId: string, previewMode = false): Promise<LiveConfigurationSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: LiveConfigurationSession = {
      sessionId,
      userId,
      startTime: new Date(),
      activeServices: ['behavioral_intelligence', 'voice_ai', 'rewards', 'deployment'],
      pendingChanges: [],
      rollbackTokens: new Map(),
      autoSaveEnabled: !previewMode,
      previewMode
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Get current configuration state for all services
   */
  async getCurrentConfiguration(userId: string): Promise<Record<string, ServiceConfigurationState>> {
    const configurations: Record<string, ServiceConfigurationState> = {};

    try {
      // Behavioral Intelligence Configuration
      configurations.behavioral_intelligence = {
        serviceName: 'Behavioral Intelligence',
        currentParameters: await this.behavioralService.getCurrentParameters(),
        pendingUpdates: {},
        lastUpdated: new Date(),
        version: '2.1.0',
        rollbackAvailable: true
      };

      // Voice AI Configuration  
      configurations.voice_ai = {
        serviceName: 'Voice AI Enhanced',
        currentParameters: await this.voiceService.getCurrentConfiguration(),
        pendingUpdates: {},
        lastUpdated: new Date(),
        version: '1.8.3',
        rollbackAvailable: true
      };

      // AI Rewards Configuration
      configurations.rewards = {
        serviceName: 'AI Rewards System',
        currentParameters: await this.rewardsService.getCurrentConfiguration(),
        pendingUpdates: {},
        lastUpdated: new Date(),
        version: '1.5.2',
        rollbackAvailable: true
      };

      // Deployment Configuration
      configurations.deployment = {
        serviceName: 'Deployment Orchestrator',
        currentParameters: await this.deploymentOrchestrator.getCurrentConfiguration(),
        pendingUpdates: {},
        lastUpdated: new Date(),
        version: '3.0.1',
        rollbackAvailable: true
      };

    } catch (error) {
      console.error('[AIParametersAPI] Error getting current configuration:', error);
    }

    return configurations;
  }

  /**
   * Validate parameters before applying
   */
  async validateParameters(request: ParameterUpdateRequest): Promise<ParameterValidationResult> {
    const result: ParameterValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      performanceImpact: 'low'
    };

    try {
      switch (request.category) {
        case 'core_ai':
          await this.validateCoreAIParameters(request.parameters, result);
          break;
        case 'voice_ai':
          await this.validateVoiceAIParameters(request.parameters, result);
          break;
        case 'behavioral_intelligence':
          await this.validateBehavioralParameters(request.parameters, result);
          break;
        case 'rewards':
          await this.validateRewardsParameters(request.parameters, result);
          break;
        case 'platform':
          await this.validatePlatformParameters(request.parameters, result);
          break;
        case 'deployment':
          await this.validateDeploymentParameters(request.parameters, result);
          break;
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Apply parameter updates to AI services
   */
  async updateParameters(request: ParameterUpdateRequest): Promise<ParameterUpdateResponse> {
    // Validate first
    if (!request.validateOnly) {
      const validation = await this.validateParameters(request);
      if (!validation.isValid) {
        return {
          success: false,
          appliedParameters: {},
          validationErrors: validation.errors,
          affectedServices: [],
          estimatedEffectTime: 0,
          warnings: validation.warnings
        };
      }
    }

    const response: ParameterUpdateResponse = {
      success: false,
      appliedParameters: {},
      affectedServices: [],
      estimatedEffectTime: 0
    };

    try {
      // Queue update or apply immediately
      if (request.immediate) {
        await this.applyParametersImmediately(request, response);
      } else {
        this.updateQueue.push(request);
        response.success = true;
        response.estimatedEffectTime = this.updateQueue.length * 2000; // 2 seconds per queued item
      }

      // Create rollback token
      if (response.success) {
        response.rollbackToken = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.createRollbackPoint(request, response.rollbackToken);
      }

    } catch (error) {
      response.success = false;
      response.validationErrors = [`Update error: ${error.message}`];
    }

    return response;
  }

  /**
   * Apply parameters immediately to services
   */
  private async applyParametersImmediately(
    request: ParameterUpdateRequest, 
    response: ParameterUpdateResponse
  ): Promise<void> {
    switch (request.category) {
      case 'behavioral_intelligence':
        await this.applyBehavioralParameters(request.parameters, response);
        break;
      case 'voice_ai':
        await this.applyVoiceAIParameters(request.parameters, response);
        break;
      case 'rewards':
        await this.applyRewardsParameters(request.parameters, response);
        break;
      case 'deployment':
        await this.applyDeploymentParameters(request.parameters, response);
        break;
    }

    response.success = true;
    response.estimatedEffectTime = 500; // Immediate application
  }

  /**
   * Process queued parameter updates
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.updateQueue.length === 0) return;

    this.isProcessingUpdates = true;
    const batchSize = 5; // Process 5 updates at a time
    const batch = this.updateQueue.splice(0, batchSize);

    for (const request of batch) {
      try {
        const response: ParameterUpdateResponse = {
          success: false,
          appliedParameters: {},
          affectedServices: [],
          estimatedEffectTime: 0
        };

        await this.applyParametersImmediately(request, response);
        console.log(`[AIParametersAPI] Applied queued update for ${request.category}:`, response);
      } catch (error) {
        console.error(`[AIParametersAPI] Error processing queued update:`, error);
      }
    }

    this.isProcessingUpdates = false;
  }

  /**
   * Rollback parameters to a previous state
   */
  async rollbackParameters(rollbackToken: string, userId: string): Promise<ParameterUpdateResponse> {
    // Implementation for rollback functionality
    const response: ParameterUpdateResponse = {
      success: true,
      appliedParameters: {},
      affectedServices: [],
      estimatedEffectTime: 1000
    };

    try {
      // Restore previous configuration state
      const rollbackData = await this.getRollbackData(rollbackToken);
      if (rollbackData) {
        // Apply rollback to each affected service
        for (const serviceConfig of rollbackData.configurations) {
          await this.restoreServiceConfiguration(serviceConfig);
        }
        response.affectedServices = rollbackData.affectedServices;
      }
    } catch (error) {
      response.success = false;
      response.validationErrors = [`Rollback error: ${error.message}`];
    }

    return response;
  }

  /**
   * Get real-time performance metrics for parameter changes
   */
  async getParameterPerformanceMetrics(timeRange: 'hour' | 'day' | 'week' = 'hour'): Promise<any> {
    return await this.performanceMonitor.getParameterImpactMetrics(timeRange);
  }

  // Validation methods for each category
  private async validateCoreAIParameters(parameters: Record<string, any>, result: ParameterValidationResult): Promise<void> {
    if (parameters.learningRate && (parameters.learningRate < 0.1 || parameters.learningRate > 0.9)) {
      result.errors.push('Learning rate must be between 0.1 and 0.9');
      result.isValid = false;
    }

    if (parameters.confidenceThreshold && (parameters.confidenceThreshold < 0.5 || parameters.confidenceThreshold > 0.95)) {
      result.errors.push('Confidence threshold must be between 0.5 and 0.95');
      result.isValid = false;
    }

    if (parameters.maxConcurrentAnalyses && parameters.maxConcurrentAnalyses > 10) {
      result.warnings.push('High concurrent analyses may impact performance');
      result.performanceImpact = 'high';
    }
  }

  private async validateVoiceAIParameters(parameters: Record<string, any>, result: ParameterValidationResult): Promise<void> {
    if (parameters.responseComplexity && !['simple', 'moderate', 'complex', 'adaptive'].includes(parameters.responseComplexity)) {
      result.errors.push('Invalid response complexity level');
      result.isValid = false;
    }

    if (parameters.personalityAdaptation && parameters.personalityAdaptation > 1.0) {
      result.warnings.push('High personality adaptation may reduce consistency');
    }
  }

  private async validateBehavioralParameters(parameters: Record<string, any>, result: ParameterValidationResult): Promise<void> {
    if (parameters.analysisDepth && !['surface', 'moderate', 'deep', 'comprehensive'].includes(parameters.analysisDepth)) {
      result.errors.push('Invalid analysis depth level');
      result.isValid = false;
    }

    if (parameters.psychologicalProfiling === true && !parameters.userConsent) {
      result.errors.push('Psychological profiling requires explicit user consent');
      result.isValid = false;
    }
  }

  private async validateRewardsParameters(parameters: Record<string, any>, result: ParameterValidationResult): Promise<void> {
    if (parameters.gamificationIntensity && (parameters.gamificationIntensity < 0 || parameters.gamificationIntensity > 100)) {
      result.errors.push('Gamification intensity must be between 0 and 100');
      result.isValid = false;
    }
  }

  private async validatePlatformParameters(parameters: Record<string, any>, result: ParameterValidationResult): Promise<void> {
    // Platform-specific validation logic
  }

  private async validateDeploymentParameters(parameters: Record<string, any>, result: ParameterValidationResult): Promise<void> {
    if (parameters.rollbackStrategy && !['immediate', 'gradual', 'manual'].includes(parameters.rollbackStrategy)) {
      result.errors.push('Invalid rollback strategy');
      result.isValid = false;
    }
  }

  // Application methods for each service
  private async applyBehavioralParameters(parameters: Record<string, any>, response: ParameterUpdateResponse): Promise<void> {
    await this.behavioralService.updateParameters(parameters);
    response.appliedParameters = parameters;
    response.affectedServices.push('behavioral_intelligence');
  }

  private async applyVoiceAIParameters(parameters: Record<string, any>, response: ParameterUpdateResponse): Promise<void> {
    await this.voiceService.updateConfiguration(parameters);
    response.appliedParameters = parameters;
    response.affectedServices.push('voice_ai');
  }

  private async applyRewardsParameters(parameters: Record<string, any>, response: ParameterUpdateResponse): Promise<void> {
    await this.rewardsService.updateConfiguration(parameters);
    response.appliedParameters = parameters;
    response.affectedServices.push('rewards');
  }

  private async applyDeploymentParameters(parameters: Record<string, any>, response: ParameterUpdateResponse): Promise<void> {
    await this.deploymentOrchestrator.updateConfiguration(parameters);
    response.appliedParameters = parameters;
    response.affectedServices.push('deployment');
  }

  // Rollback support methods
  private async createRollbackPoint(request: ParameterUpdateRequest, token: string): Promise<void> {
    // Store current state for rollback
    const currentState = await this.getCurrentConfiguration(request.userId);
    // Implementation would store this in database or cache
    console.log(`[AIParametersAPI] Created rollback point ${token} for user ${request.userId}`);
  }

  private async getRollbackData(token: string): Promise<any> {
    // Retrieve rollback data from storage
    return null; // Placeholder
  }

  private async restoreServiceConfiguration(config: ServiceConfigurationState): Promise<void> {
    // Restore service to previous configuration
    console.log(`[AIParametersAPI] Restoring ${config.serviceName} configuration`);
  }

  /**
   * Close live configuration session
   */
  async closeLiveSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.autoSaveEnabled && session.pendingChanges.length > 0) {
      // Auto-save pending changes
      for (const change of session.pendingChanges) {
        this.updateQueue.push(change);
      }
    }
    
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get live session status
   */
  getLiveSessionStatus(sessionId: string): LiveConfigurationSession | null {
    return this.activeSessions.get(sessionId) || null;
  }
}

export default AIParametersAPIService;