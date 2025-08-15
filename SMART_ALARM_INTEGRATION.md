# Enhanced Smart Alarm System Integration Guide

This document provides a comprehensive guide for integrating the enhanced smart alarm system into the Relife application.

## Overview

The enhanced smart alarm system provides:

✨ **Real-time adaptation** based on sleep patterns and conditions  
🧠 **Condition-based scheduling** with weather, calendar, and behavior triggers  
📊 **Machine learning** from user feedback  
⚡ **Dynamic wake windows** that adjust based on sleep consistency  
📈 **Advanced analytics** and personalized recommendations  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Smart Alarm System              │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ SmartAlarmDashboard │  │ EnhancedSmartAlarm  │          │
│  │                     │  │ Settings            │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  Services:                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ EnhancedSmartAlarm  │  │ RealTimeSmartAdapter│          │
│  │ Scheduler           │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  Hooks:                                                     │
│  ┌─────────────────────┐                                   │
│  │ useEnhancedSmartAlarms                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

## Files Created/Enhanced

### New Services
- `src/services/enhanced-smart-alarm-scheduler.ts` - Core enhanced smart alarm logic
- `src/services/real-time-smart-adapter.ts` - Real-time monitoring and adaptation

### New Components  
- `src/components/EnhancedSmartAlarmSettings.tsx` - Advanced settings UI
- `src/components/SmartAlarmDashboard.tsx` - Real-time monitoring dashboard

### New Hooks
- `src/hooks/useEnhancedSmartAlarms.ts` - React hook for smart alarm management

## Integration Steps

### Step 1: Update Main Alarm Management Component

```tsx
// src/components/AlarmManagement.tsx
import React, { useState } from 'react';
import { useEnhancedSmartAlarms } from '../hooks/useEnhancedSmartAlarms';
import SmartAlarmDashboard from './SmartAlarmDashboard';
import EnhancedSmartAlarmSettings from './EnhancedSmartAlarmSettings';

export const AlarmManagement: React.FC = () => {
  const {
    alarms,
    loading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    recordFeedback
  } = useEnhancedSmartAlarms();

  const [showSmartSettings, setShowSmartSettings] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState(null);

  // ... existing alarm management logic

  return (
    <div className="space-y-6">
      {/* Existing alarm list */}
      
      {/* Smart Alarm Dashboard */}
      <SmartAlarmDashboard 
        alarms={alarms}
        onEditAlarm={(alarm) => {
          setSelectedAlarm(alarm);
          setShowSmartSettings(true);
        }}
      />

      {/* Enhanced Smart Alarm Settings Modal */}
      <EnhancedSmartAlarmSettings
        isOpen={showSmartSettings}
        onClose={() => setShowSmartSettings(false)}
        alarm={selectedAlarm}
        onSave={async (alarmData) => {
          if (selectedAlarm) {
            await updateAlarm(selectedAlarm.id, alarmData);
          } else {
            await createAlarm(alarmData);
          }
        }}
      />
    </div>
  );
};
```

### Step 2: Initialize Services in App Component

```tsx
// src/App.tsx
import { useEffect } from 'react';
import { RealTimeSmartAdapter } from './services/real-time-smart-adapter';

export const App: React.FC = () => {
  useEffect(() => {
    // Initialize real-time smart adapter
    const initializeSmartAlarms = async () => {
      try {
        await RealTimeSmartAdapter.initialize();
        console.log('Smart alarm system initialized');
      } catch (error) {
        console.error('Failed to initialize smart alarm system:', error);
      }
    };

    initializeSmartAlarms();

    // Cleanup on app unmount
    return () => {
      RealTimeSmartAdapter.shutdown();
    };
  }, []);

  // ... rest of app
};
```

### Step 3: Add Database Schema Updates

The enhanced smart alarm system requires additional database fields:

```sql
-- Add columns to existing alarms table
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS real_time_adaptation BOOLEAN DEFAULT true;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS dynamic_wake_window BOOLEAN DEFAULT true;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS condition_based_adjustments JSONB DEFAULT '[]';
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS sleep_pattern_weight DECIMAL(3,2) DEFAULT 0.70;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS learning_factor DECIMAL(3,2) DEFAULT 0.30;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS wake_up_feedback JSONB DEFAULT '[]';
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS next_optimal_times JSONB DEFAULT '[]';
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS adaptation_history JSONB DEFAULT '[]';

-- Create new table for alarm metrics
CREATE TABLE IF NOT EXISTS alarm_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_id UUID REFERENCES alarms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  average_wake_difficulty DECIMAL(3,2),
  adaptation_success DECIMAL(3,2),
  user_satisfaction DECIMAL(3,2),
  most_effective_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alarm_metrics_alarm_id ON alarm_metrics(alarm_id);
CREATE INDEX IF NOT EXISTS idx_alarm_metrics_user_date ON alarm_metrics(user_id, date);
```

### Step 4: Environment Variables

Add these environment variables for external integrations:

```bash
# .env.local
REACT_APP_WEATHER_API_KEY=your_weather_api_key
REACT_APP_CALENDAR_INTEGRATION_ENABLED=true
REACT_APP_SMART_ALARM_DEBUG=true
```

## Key Features Implemented

### 1. Real-time Adaptation
- Continuously monitors conditions and adjusts alarm times
- Configurable adaptation intervals (default: 15 minutes)
- Maximum daily adaptations limit (default: 5)
- Minimum confidence threshold for adaptations

### 2. Condition-based Adjustments
- **Weather**: Adjusts for rain, snow, extreme temperatures
- **Calendar**: Integration with calendar events
- **Sleep Debt**: Compensation for accumulated sleep deficit
- **User Behavior**: Learning from wake-up feedback patterns
- **Emergency**: Severe weather or traffic conditions

### 3. Dynamic Wake Windows
- Automatically adjusts wake window based on sleep consistency
- Larger windows for consistent sleepers
- Smaller windows for inconsistent patterns
- User feedback influences window size

### 4. Machine Learning Integration
- Learning factor controls adaptation speed (0.1 - 0.5)
- Effectiveness scoring for each condition
- Pattern recognition from user feedback
- Personalized recommendations

### 5. Advanced Analytics
- Wake-up difficulty trends
- Sleep debt monitoring
- Adaptation success rates
- User satisfaction tracking
- Most effective conditions identification

## Usage Examples

### Creating an Enhanced Smart Alarm

```tsx
const smartAlarmData = {
  time: '07:00',
  label: 'Smart Morning Alarm',
  enabled: true,
  days: [1, 2, 3, 4, 5], // Weekdays
  smartEnabled: true,
  realTimeAdaptation: true,
  dynamicWakeWindow: true,
  wakeWindow: 30,
  sleepPatternWeight: 0.7,
  learningFactor: 0.3,
  conditionBasedAdjustments: [
    {
      id: 'weather_rain',
      type: 'weather',
      isEnabled: true,
      priority: 3,
      condition: { operator: 'contains', value: 'rain' },
      adjustment: { timeMinutes: -10, maxAdjustment: 20, reason: 'Extra time for rainy commute' },
      effectivenessScore: 0.8
    }
  ]
};

await createAlarm(smartAlarmData);
```

### Recording User Feedback

```tsx
const feedback = {
  date: new Date(),
  originalTime: '07:00',
  actualWakeTime: '06:55',
  difficulty: 'easy',
  feeling: 'good',
  sleepQuality: 8,
  timeToFullyAwake: 10,
  wouldPreferEarlier: false,
  wouldPreferLater: false,
  notes: 'Woke up naturally before alarm'
};

await recordFeedback(alarmId, feedback);
```

## Configuration Options

### Smart Alarm Settings
- `smartEnabled`: Enable/disable smart features
- `realTimeAdaptation`: Enable continuous monitoring
- `dynamicWakeWindow`: Auto-adjust wake window
- `sleepPatternWeight`: Balance between patterns (70%) and consistency (30%)
- `learningFactor`: How quickly to adapt (30% default)

### Condition Settings
- Each condition has priority (1-5), effectiveness score (0-1)
- Configurable time adjustments and maximum limits
- Enable/disable individual conditions

### Real-time Adapter Settings
- Adaptation interval (15 minutes default)
- Maximum daily adaptations (5 default)
- Minimum confidence threshold (0.6 default)
- Emergency override capability

## Performance Considerations

### Memory Usage
- Real-time adapter maintains lightweight status objects
- Cleanup intervals prevent memory leaks
- Efficient data structures for optimal time calculations

### Battery Optimization
- Configurable check intervals
- Intelligent monitoring that stops for disabled alarms
- Minimal background processing

### Network Usage
- Cached weather and calendar data
- Batch API requests
- Offline-first design with sync when available

## Testing

### Unit Tests
```bash
# Test core smart alarm functionality
npm test enhanced-smart-alarm-scheduler.test.ts

# Test real-time adaptation
npm test real-time-smart-adapter.test.ts

# Test UI components
npm test EnhancedSmartAlarmSettings.test.tsx
```

### Integration Tests
```bash
# Test full smart alarm workflow
npm test smart-alarm-integration.test.ts
```

## Monitoring and Analytics

### Performance Metrics
- Adaptation success rate
- User satisfaction scores
- Feature usage statistics
- Error rates and resolution times

### User Engagement
- Smart alarm adoption rate
- Feature utilization
- Feedback submission frequency
- Retention metrics

## Troubleshooting

### Common Issues

**Smart alarms not adapting:**
1. Check if real-time adaptation is enabled
2. Verify adaptation limits haven't been exceeded
3. Ensure confidence threshold is appropriate
4. Check service initialization status

**Poor recommendations:**
1. Increase learning factor for faster adaptation
2. Add more condition-based adjustments
3. Encourage more user feedback
4. Adjust sleep pattern weight

**Performance issues:**
1. Increase adaptation interval
2. Reduce number of monitored alarms
3. Optimize condition evaluation logic
4. Clear old adaptation history

## Future Enhancements

### Phase 1 (Next Release)
- Integration with wearable devices
- Advanced sleep stage detection
- Social features (family/partner coordination)
- Voice-activated feedback collection

### Phase 2 (Future)
- AI-powered dream integration
- Seasonal Affective Disorder support
- Integration with smart home devices
- Predictive health analytics

## Support

For questions or issues with the enhanced smart alarm system:

1. Check the troubleshooting section above
2. Review error logs in browser console
3. Submit feedback through the app
4. Contact the development team

---

**Note**: This enhanced smart alarm system extends the existing functionality while maintaining backward compatibility. Users can opt-in to advanced features gradually.