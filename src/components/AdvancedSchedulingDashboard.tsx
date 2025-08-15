import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Brain, MapPin, TrendingUp, Zap, Settings,
  ChevronRight, AlertCircle, CheckCircle, Target, Sun, Moon,
  BarChart3, Activity, Lightbulb, Bell, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

import MLAlarmOptimizer from '../services/ml-alarm-optimizer';
import EnhancedLocationService from '../services/enhanced-location-service';
import PredictiveAnalyticsService from '../services/predictive-analytics-service';
import type { AdvancedAlarm, User } from '../types/index';

interface AdvancedSchedulingDashboardProps {
  alarms: AdvancedAlarm[];
  user: User;
  onUpdateAlarm: (id: string, updates: Partial<AdvancedAlarm>) => void;
  onCreateAlarm: (alarm: Omit<AdvancedAlarm, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AdvancedSchedulingDashboard({
  alarms,
  user,
  onUpdateAlarm,
  onCreateAlarm
}: AdvancedSchedulingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ml' | 'location' | 'analytics' | 'settings'>('overview');
  const [mlEnabled, setMlEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  
  // ML Optimization State
  const [predictions, setPredictions] = useState<any[]>([]);
  const [mlStats, setMlStats] = useState({ patterns: 0, predictions: 0, accuracy: 0 });
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);

  // Location State
  const [locationPatterns, setLocationPatterns] = useState<any[]>([]);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [locationStats, setLocationStats] = useState({ patterns: 0, geofences: 0, historyPoints: 0, isTracking: false });

  // Analytics State
  const [detectedPatterns, setDetectedPatterns] = useState<any[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<any[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState({ patterns: 0, insights: 0, lastAnalysis: null, isEnabled: false });

  // Loading States
  const [loading, setLoading] = useState({ ml: false, location: false, analytics: false });

  useEffect(() => {
    loadAdvancedSchedulingData();
  }, []);

  const loadAdvancedSchedulingData = useCallback(async () => {
    try {
      // Load ML data
      setMlEnabled(MLAlarmOptimizer.isMLEnabled());
      setMlStats(MLAlarmOptimizer.getMLStats());
      
      // Load location data  
      setLocationEnabled(EnhancedLocationService.isLocationEnabled());
      setLocationPatterns(EnhancedLocationService.getLocationPatterns());
      setGeofences(EnhancedLocationService.getGeofences());
      setLocationStats(EnhancedLocationService.getLocationStats());

      // Load analytics data
      setAnalyticsEnabled(PredictiveAnalyticsService.isAnalyticsEnabled());
      setDetectedPatterns(PredictiveAnalyticsService.getDetectedPatterns());
      setPredictiveInsights(PredictiveAnalyticsService.getRecentInsights(7));
      setAnalyticsStats(PredictiveAnalyticsService.getAnalyticsStats());

      // Load optimization suggestions
      if (MLAlarmOptimizer.isMLEnabled()) {
        const suggestions = await MLAlarmOptimizer.getOptimizationSuggestions(user.id);
        setOptimizationSuggestions(suggestions);
      }

    } catch (error) {
      console.error('Error loading advanced scheduling data:', error);
    }
  }, [user.id]);

  const handleMLToggle = async (enabled: boolean) => {
    setLoading(prev => ({ ...prev, ml: true }));
    try {
      await MLAlarmOptimizer.enableMLOptimization(enabled);
      setMlEnabled(enabled);
      if (enabled) {
        await loadAdvancedSchedulingData();
      }
    } catch (error) {
      console.error('Error toggling ML optimization:', error);
    } finally {
      setLoading(prev => ({ ...prev, ml: false }));
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    setLoading(prev => ({ ...prev, location: true }));
    try {
      await EnhancedLocationService.enableLocationServices(enabled);
      setLocationEnabled(enabled);
      if (enabled) {
        await loadAdvancedSchedulingData();
      }
    } catch (error) {
      console.error('Error toggling location services:', error);
    } finally {
      setLoading(prev => ({ ...prev, location: false }));
    }
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    setLoading(prev => ({ ...prev, analytics: true }));
    try {
      await PredictiveAnalyticsService.enablePredictiveAnalytics(enabled);
      setAnalyticsEnabled(enabled);
      if (enabled) {
        await loadAdvancedSchedulingData();
      }
    } catch (error) {
      console.error('Error toggling predictive analytics:', error);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  const generatePrediction = async (alarm: AdvancedAlarm) => {
    if (!mlEnabled) return;
    
    try {
      const prediction = await MLAlarmOptimizer.predictOptimalWakeTime(user.id, alarm, new Date());
      setPredictions(prev => [...prev.filter(p => p.alarmId !== alarm.id), { 
        alarmId: alarm.id,
        ...prediction
      }]);
    } catch (error) {
      console.error('Error generating prediction:', error);
    }
  };

  const applyOptimization = async (alarmId: string, optimizedTime: string) => {
    try {
      onUpdateAlarm(alarmId, { time: optimizedTime });
      // Record that user applied ML suggestion
      await MLAlarmOptimizer.recordUserBehavior(user.id, 'wake_time', {
        appliedOptimization: true,
        originalTime: alarms.find(a => a.id === alarmId)?.time,
        optimizedTime
      });
    } catch (error) {
      console.error('Error applying optimization:', error);
    }
  };

  const OverviewPanel = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Optimization</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{mlStats.accuracy}%</div>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <Badge variant={mlEnabled ? "default" : "secondary"}>
                {mlEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Progress value={mlStats.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location Services</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{locationStats.patterns}</div>
                <p className="text-xs text-muted-foreground">Patterns</p>
              </div>
              <Badge variant={locationEnabled ? "default" : "secondary"}>
                {locationEnabled ? "Tracking" : "Disabled"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locationStats.geofences} geofences active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictive Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analyticsStats.patterns}</div>
                <p className="text-xs text-muted-foreground">Patterns</p>
              </div>
              <Badge variant={analyticsEnabled ? "default" : "secondary"}>
                {analyticsEnabled ? "Learning" : "Disabled"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {predictiveInsights.length} new insights
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Optimizations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {optimizationSuggestions.slice(0, 3).map((suggestion, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{suggestion.suggestion}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}% confidence • {suggestion.impact} impact
                </div>
              </div>
              <Button size="sm">Apply</Button>
            </div>
          ))}
          
          {optimizationSuggestions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2" />
              <p>No optimization suggestions available</p>
              <p className="text-sm">Enable services to start collecting data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Insights */}
      {predictiveInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {predictiveInsights.slice(0, 5).map((insight) => (
              <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`p-1 rounded-full ${
                  insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{insight.title}</div>
                  <div className="text-sm text-muted-foreground">{insight.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.category.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const MLPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Machine Learning Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable ML Optimization</div>
              <div className="text-sm text-muted-foreground">
                Use AI to predict optimal wake times based on your patterns
              </div>
            </div>
            <Switch
              checked={mlEnabled}
              onCheckedChange={handleMLToggle}
              disabled={loading.ml}
            />
          </div>

          {mlEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{mlStats.patterns}</div>
                  <div className="text-sm text-muted-foreground">Behavior Patterns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{mlStats.predictions}</div>
                  <div className="text-sm text-muted-foreground">Predictions Made</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{mlStats.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Alarm Predictions</h4>
                {alarms.filter(a => a.enabled).map((alarm) => {
                  const prediction = predictions.find(p => p.alarmId === alarm.id);
                  
                  return (
                    <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{alarm.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {alarm.time}
                          {prediction && (
                            <> • Optimal: {prediction.optimalWakeTime}</>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {prediction && prediction.adjustmentMinutes !== 0 && (
                          <Badge variant={prediction.adjustmentMinutes > 0 ? "destructive" : "default"}>
                            {prediction.adjustmentMinutes > 0 ? '+' : ''}{prediction.adjustmentMinutes}min
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generatePrediction(alarm)}
                        >
                          Predict
                        </Button>
                        {prediction && prediction.adjustmentMinutes !== 0 && (
                          <Button 
                            size="sm"
                            onClick={() => applyOptimization(alarm.id, prediction.optimalWakeTime)}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const LocationPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location-Based Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Location Services</div>
              <div className="text-sm text-muted-foreground">
                Automatically adjust alarms based on your location
              </div>
            </div>
            <Switch
              checked={locationEnabled}
              onCheckedChange={handleLocationToggle}
              disabled={loading.location}
            />
          </div>

          {locationEnabled && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{locationStats.patterns}</div>
                  <div className="text-sm text-muted-foreground">Patterns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{locationStats.geofences}</div>
                  <div className="text-sm text-muted-foreground">Geofences</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{locationStats.historyPoints}</div>
                  <div className="text-sm text-muted-foreground">History Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {locationStats.isTracking ? '●' : '○'}
                  </div>
                  <div className="text-sm text-muted-foreground">Tracking</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Location Patterns</h4>
                {locationPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{pattern.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pattern.type} • {pattern.visits} visits • {Math.round(pattern.confidence * 100)}% confidence
                      </div>
                    </div>
                    <Badge variant="outline">{pattern.type}</Badge>
                  </div>
                ))}
                
                {locationPatterns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>No location patterns detected yet</p>
                    <p className="text-sm">Keep location services enabled to build patterns</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const AnalyticsPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Predictive Analytics</div>
              <div className="text-sm text-muted-foreground">
                Analyze patterns and predict optimal alarm settings
              </div>
            </div>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={handleAnalyticsToggle}
              disabled={loading.analytics}
            />
          </div>

          {analyticsEnabled && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsStats.patterns}</div>
                  <div className="text-sm text-muted-foreground">Patterns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsStats.insights}</div>
                  <div className="text-sm text-muted-foreground">Insights</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {analyticsStats.lastAnalysis ? '✓' : '○'}
                  </div>
                  <div className="text-sm text-muted-foreground">Analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{predictiveInsights.length}</div>
                  <div className="text-sm text-muted-foreground">Recent</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Detected Patterns</h4>
                {detectedPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{pattern.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pattern.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(pattern.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant={
                          pattern.trend === 'improving' ? 'default' :
                          pattern.trend === 'declining' ? 'destructive' : 'secondary'
                        } className="text-xs">
                          {pattern.trend}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{pattern.frequency}</div>
                      <div className="text-xs text-muted-foreground">occurrences</div>
                    </div>
                  </div>
                ))}
                
                {detectedPatterns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>No patterns detected yet</p>
                    <p className="text-sm">Use alarms regularly to build pattern data</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const SettingsPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Scheduling Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Service Status</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>ML Optimization</span>
                  <Badge variant={mlEnabled ? "default" : "secondary"}>
                    {mlEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleMLToggle(!mlEnabled)}>
                  {mlEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Location Services</span>
                  <Badge variant={locationEnabled ? "default" : "secondary"}>
                    {locationEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleLocationToggle(!locationEnabled)}>
                  {locationEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Predictive Analytics</span>
                  <Badge variant={analyticsEnabled ? "default" : "secondary"}>
                    {analyticsEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleAnalyticsToggle(!analyticsEnabled)}>
                  {analyticsEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Quick Actions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" onClick={loadAdvancedSchedulingData}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Test Notifications
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Scheduling</h1>
          <p className="text-muted-foreground">
            AI-powered alarm optimization with location awareness and predictive analytics
          </p>
        </div>
        <Button onClick={loadAdvancedSchedulingData}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ml" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ML Optimization
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel />
        </TabsContent>

        <TabsContent value="ml">
          <MLPanel />
        </TabsContent>

        <TabsContent value="location">
          <LocationPanel />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedSchedulingDashboard;