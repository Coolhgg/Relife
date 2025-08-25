/**
 * Enhanced API Service using new TypeScript interfaces
 * Demonstrates improved type safety and standardized error handling
 */

import {
  ApiResponse,
  HttpClient,
  HealthCheckResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatsResponse,
  CreateAlarmRequest,
  UpdateAlarmRequest,
  AlarmFilters,
  CreateBattleRequest,
  JoinBattleRequest,
  BattleWakeRequest,
  TournamentFilters,
  PerformanceMetric,
  WebVitalsData,
  ErrorReportData,
  PerformanceDashboardResponse,
  PaginatedResponse,
} from '../types';
import { httpClient } from '../utils/http-client';

/**
 * Main API service with comprehensive type safety
 */
export class ApiService {
  constructor(private client: HttpClient = httpClient) {}

  // =============================================================================
  // Health & System Endpoints
  // =============================================================================

  /**
   * Check API health status
   */
  async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    return this.client.get<HealthCheckResponse>('/api/health');
  }

  /**
   * Echo endpoint for testing
   */
  async echo(message: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.post<{ message: string }>('/api/echo', { message });
  }

  // =============================================================================
  // User Management
  // =============================================================================

  /**
   * Get all users with pagination
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/api/users', { params });
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<ApiResponse<any>> {
    return this.client.get(`/api/users/${userId}`);
  }

  /**
   * Create new user
   */
  async createUser(request: CreateUserRequest): Promise<ApiResponse<any>> {
    return this.client.post('/api/users', request);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    request: UpdateUserRequest
  ): Promise<ApiResponse<any>> {
    return this.client.put(`/api/users/${userId}`, request);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ApiResponse<UserStatsResponse>> {
    return this.client.get<UserStatsResponse>(`/api/users/${userId}/stats`);
  }

  // =============================================================================
  // Alarm Operations
  // =============================================================================

  /**
   * Get alarms with filtering
   */
  async getAlarms(
    filters?: AlarmFilters
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/api/alarms', { params: filters });
  }

  /**
   * Create new alarm
   */
  async createAlarm(request: CreateAlarmRequest): Promise<ApiResponse<any>> {
    return this.client.post('/api/alarms', request);
  }

  /**
   * Update alarm
   */
  async updateAlarm(request: UpdateAlarmRequest): Promise<ApiResponse<any>> {
    return this.client.put(`/api/alarms/${request.id}`, request);
  }

  /**
   * Delete alarm
   */
  async deleteAlarm(alarmId: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/api/alarms/${alarmId}`);
  }

  // =============================================================================
  // Battle System
  // =============================================================================

  /**
   * Get battles with filtering
   */
  async getBattles(params?: {
    type?: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/api/battles', { params });
  }

  /**
   * Create new battle
   */
  async createBattle(request: CreateBattleRequest): Promise<ApiResponse<any>> {
    return this.client.post('/api/battles', request);
  }

  /**
   * Get battle details
   */
  async getBattle(battleId: string): Promise<ApiResponse<any>> {
    return this.client.get(`/api/battles/${battleId}`);
  }

  /**
   * Join a battle
   */
  async joinBattle(
    battleId: string,
    request: JoinBattleRequest
  ): Promise<ApiResponse<any>> {
    return this.client.post(`/api/battles/${battleId}/join`, request);
  }

  /**
   * Submit wake proof for battle
   */
  async submitBattleWake(
    battleId: string,
    request: BattleWakeRequest
  ): Promise<ApiResponse<any>> {
    return this.client.post(`/api/battles/${battleId}/wake`, request);
  }

  // =============================================================================
  // Tournament System
  // =============================================================================

  /**
   * Get tournaments with filtering
   */
  async getTournaments(
    filters?: TournamentFilters
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/api/tournaments', { params: filters });
  }

  // =============================================================================
  // Performance Monitoring
  // =============================================================================

  /**
   * Submit performance metrics
   */
  async submitPerformanceMetrics(
    metrics: PerformanceMetric[]
  ): Promise<ApiResponse<void>> {
    return this.client.post('/api/performance/metrics', { metrics });
  }

  /**
   * Submit web vitals data
   */
  async submitWebVitals(data: WebVitalsData): Promise<ApiResponse<void>> {
    return this.client.post('/api/performance/web-vitals', data);
  }

  /**
   * Report error
   */
  async reportError(_error: ErrorReportData): Promise<ApiResponse<void>> {
    return this.client.post('/api/performance/errors', _error);
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard(): Promise<ApiResponse<PerformanceDashboardResponse>> {
    return this.client.get<PerformanceDashboardResponse>('/api/performance/dashboard');
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(params?: {
    period?: string;
    metric?: string;
  }): Promise<ApiResponse<any>> {
    return this.client.get('/api/performance/trends', { params });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
