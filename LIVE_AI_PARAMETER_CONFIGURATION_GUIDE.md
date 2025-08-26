# Live AI Parameter Configuration System

## Overview

The Live AI Parameter Configuration System enables real-time customization and management of all AI
services in the Relife smart alarm app. This comprehensive system provides live endpoint
connections, parameter validation, rollback capabilities, and performance monitoring.

## Architecture

### Core Components

#### 1. AI Parameters API Service (`src/services/ai-parameters-api.ts`)

- **Purpose**: Central orchestration of parameter updates across all AI services
- **Features**:
  - Real-time parameter validation and application
  - Live configuration sessions with auto-save
  - Rollback capabilities with token-based recovery
  - Performance impact monitoring
  - Queue-based update processing

#### 2. Service Configuration Extensions

- **Behavioral Intelligence** (`src/services/advanced-behavioral-intelligence.ts`)
  - Analysis depth, learning rates, confidence thresholds
  - Psychological profiling controls
  - Pattern recognition sensitivity
- **Voice AI Enhanced** (`src/services/voice-ai-enhanced.ts`)
  - Personality adaptation, response complexity
  - Emotional intelligence, speech patterns
  - Cultural sensitivity, voice cloning
- **AI Rewards System** (`src/services/ai-rewards.ts`)
  - Gamification intensity, reward frequency
  - Personalization levels, motivation styles
  - Category weights, behavioral reinforcement

#### 3. REST API Endpoints (`src/backend/ai-parameters-endpoints.ts`)

- **Session Management**: Start/stop live configuration sessions
- **Parameter Updates**: Validate and apply parameter changes
- **Rollback Operations**: Restore previous configurations
- **Batch Operations**: Update multiple services simultaneously
- **Import/Export**: Configuration backup and restore

#### 4. Live UI Components

- **LiveAIParameterCustomizer**: Real-time parameter interface
- **AIModelParametersCustomizerLive**: Enhanced overview with live capabilities

## API Reference

### Base URL

```
/api/ai-parameters
```

### Authentication

All endpoints require user authentication. Include `userId` in request bodies or URL parameters.

### Core Endpoints

#### Start Live Session

```http
POST /session/start
Content-Type: application/json

{
  "userId": "user123",
  "previewMode": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "session_1703123456_abc123",
    "userId": "user123",
    "startTime": "2024-12-21T10:30:00Z",
    "activeServices": ["behavioral_intelligence", "voice_ai", "rewards"],
    "autoSaveEnabled": true,
    "previewMode": false
  }
}
```

#### Get Current Configuration

```http
GET /configuration/{userId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "behavioral_intelligence": {
      "serviceName": "Behavioral Intelligence",
      "currentParameters": {
        "analysisDepth": "moderate",
        "learningRate": 0.3,
        "confidenceThreshold": 0.75
      },
      "version": "2.1.0",
      "lastUpdated": "2024-12-21T10:25:00Z"
    }
  }
}
```

#### Update Parameters

```http
PUT /update
Content-Type: application/json

{
  "category": "behavioral_intelligence",
  "parameters": {
    "learningRate": 0.5,
    "analysisDepth": "deep"
  },
  "userId": "user123",
  "immediate": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "appliedParameters": {
      "learningRate": 0.5,
      "analysisDepth": "deep"
    },
    "affectedServices": ["behavioral_intelligence"],
    "estimatedEffectTime": 500,
    "rollbackToken": "rollback_1703123456_xyz789"
  }
}
```

#### Validate Parameters

```http
POST /validate
Content-Type: application/json

{
  "category": "voice_ai",
  "parameters": {
    "speechRate": 2.5,
    "emotionalIntelligence": 1.2
  },
  "userId": "user123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isValid": false,
    "errors": [
      "Speech rate must be between 0.5 and 2.0",
      "Emotional intelligence must be between 0 and 1"
    ],
    "warnings": [],
    "performanceImpact": "high"
  }
}
```

#### Rollback Parameters

```http
POST /rollback
Content-Type: application/json

{
  "rollbackToken": "rollback_1703123456_xyz789",
  "userId": "user123"
}
```

## Parameter Categories

### 1. Core AI Settings

- **Learning Rate** (0.1-0.9): Rate of algorithm adaptation
- **Confidence Threshold** (0.5-0.95): Minimum confidence for decisions
- **Pattern Recognition Sensitivity**: Low/Medium/High detection sensitivity
- **Background Processing**: Enable/disable background learning

### 2. Voice AI Configuration

- **Personality Adaptation** (0-1): Voice personality flexibility
- **Response Complexity**: Simple/Moderate/Complex/Adaptive responses
- **Emotional Intelligence** (0-1): Emotional awareness level
- **Speech Rate** (0.5-2.0): Voice delivery speed
- **Cultural Sensitivity**: Adapt to cultural context

### 3. Behavioral Intelligence

- **Analysis Depth**: Surface/Moderate/Deep/Comprehensive analysis
- **Psychological Profiling**: Enable advanced personality analysis
- **Contextual Weight** (0-1): Importance of environmental factors
- **Temporal Analysis Window**: Days of historical data to consider
- **Predictive Insights**: Enable future behavior predictions

### 4. Rewards System

- **Gamification Intensity** (0-100): Overall gamification level
- **Reward Frequency**: Minimal/Balanced/Frequent/Abundant
- **Personalization Level** (0-1): Customization depth
- **Streak Multiplier** (1.0-3.0): Consecutive achievement bonus
- **Achievement Threshold**: Easy/Moderate/Challenging/Adaptive

### 5. Platform Integration

- **Health Apps Sync**: Connect to Apple Health, Google Fit, Fitbit
- **Calendar Integration**: Google Calendar, Outlook, Apple Calendar
- **Weather Service**: Real-time weather data integration
- **Privacy Level**: Basic/Enhanced/Comprehensive data protection

### 6. Deployment Configuration

- **Deployment Strategy**: Immediate/Gradual/Canary/Blue-Green
- **Rollback Strategy**: Immediate/Gradual/Manual recovery
- **Auto-Rollback**: Automatic failure recovery
- **Success Threshold** (0.8-1.0): Minimum success rate for deployment
- **Monitoring Depth**: Basic/Standard/Comprehensive/Full observability

## Usage Examples

### JavaScript/TypeScript Client

```typescript
class AIParameterClient {
  private baseUrl = '/api/ai-parameters';

  async startSession(userId: string, previewMode = false) {
    const response = await fetch(`${this.baseUrl}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, previewMode }),
    });
    return await response.json();
  }

  async updateParameter(category: string, parameters: Record<string, any>, userId: string) {
    const response = await fetch(`${this.baseUrl}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        parameters,
        userId,
        immediate: true,
      }),
    });
    return await response.json();
  }

  async getCurrentConfig(userId: string) {
    const response = await fetch(`${this.baseUrl}/configuration/${userId}`);
    return await response.json();
  }
}

// Usage
const client = new AIParameterClient();

// Start a live session
const session = await client.startSession('user123');

// Update voice AI parameters
await client.updateParameter(
  'voice_ai',
  {
    personalityAdaptation: 0.8,
    responseComplexity: 'complex',
    emotionalIntelligence: 0.9,
  },
  'user123'
);

// Get current configuration
const config = await client.getCurrentConfig('user123');
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface UseAIParameters {
  configurations: Record<string, any>;
  updateParameter: (category: string, params: Record<string, any>) => Promise<void>;
  rollback: (token: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useAIParameters = (userId: string): UseAIParameters => {
  const [configurations, setConfigurations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateParameter = async (category: string, params: Record<string, any>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-parameters/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          parameters: params,
          userId,
          immediate: true
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setConfigurations(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            currentParameters: {
              ...prev[category]?.currentParameters,
              ...result.data.appliedParameters
            }
          }
        }));
      } else {
        setError(result.error || 'Update failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const rollback = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-parameters/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollbackToken: token, userId })
      });

      if (response.ok) {
        // Refresh configurations
        loadConfigurations();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigurations = async () => {
    try {
      const response = await fetch(`/api/ai-parameters/configuration/${userId}`);
      const result = await response.json();
      if (result.success) {
        setConfigurations(result.data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadConfigurations();
  }, [userId]);

  return {
    configurations,
    updateParameter,
    rollback,
    isLoading,
    error
  };
};

// Component usage
const MyComponent = () => {
  const { configurations, updateParameter, isLoading } = useAIParameters('user123');

  const handleSliderChange = async (value: number) => {
    await updateParameter('behavioral_intelligence', {
      learningRate: value / 100
    });
  };

  return (
    <div>
      <Slider
        value={configurations.behavioral_intelligence?.currentParameters?.learningRate * 100 || 30}
        onValueChange={handleSliderChange}
        disabled={isLoading}
      />
    </div>
  );
};
```

## Best Practices

### 1. Parameter Validation

Always validate parameters before applying:

```typescript
// Validate before update
const validation = await fetch('/api/ai-parameters/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'voice_ai',
    parameters: { speechRate: newRate },
    userId,
  }),
});

const validationResult = await validation.json();
if (validationResult.data.isValid) {
  // Safe to apply
  await updateParameter('voice_ai', { speechRate: newRate });
} else {
  // Show validation errors
  console.error(validationResult.data.errors);
}
```

### 2. Batch Updates

For multiple parameter changes, use batch updates for consistency:

```typescript
const batchUpdate = await fetch('/api/ai-parameters/batch-update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    updates: [
      {
        category: 'behavioral_intelligence',
        parameters: { learningRate: 0.6, analysisDepth: 'deep' },
        userId: 'user123',
      },
      {
        category: 'voice_ai',
        parameters: { personalityAdaptation: 0.8 },
        userId: 'user123',
      },
    ],
  }),
});
```

### 3. Performance Monitoring

Monitor the impact of parameter changes:

```typescript
// Get performance metrics
const metrics = await fetch('/api/ai-parameters/metrics/day');
const metricsData = await metrics.json();

// Check for performance degradation
if (metricsData.data.avgResponseTime > 1000) {
  console.warn('Performance degradation detected');
  // Consider rollback or parameter adjustment
}
```

### 4. Error Handling

Implement comprehensive error handling:

```typescript
try {
  const result = await updateParameter('rewards', { gamificationIntensity: 85 });

  if (result.warnings?.length > 0) {
    // Show warnings to user
    showWarnings(result.warnings);
  }
} catch (error) {
  if (error.message.includes('validation')) {
    showValidationErrors(error.details);
  } else if (error.message.includes('connection')) {
    showConnectionError();
    // Maybe retry or switch to offline mode
  } else {
    showGenericError(error.message);
  }
}
```

### 5. User Experience

Provide clear feedback and control:

```typescript
const ParameterSlider = ({ category, parameter, min, max, step }) => {
  const [value, setValue] = useState(currentValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = useCallback(
    debounce(async (newValue) => {
      setIsUpdating(true);
      setError(null);

      try {
        await updateParameter(category, { [parameter]: newValue });
      } catch (err) {
        setError(err.message);
        setValue(currentValue); // Revert on error
      } finally {
        setIsUpdating(false);
      }
    }, 1000),
    [category, parameter]
  );

  return (
    <div className=\"space-y-2\">
      <Slider
        value={value}
        onValueChange={setValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={isUpdating}
      />
      {isUpdating && <Spinner />}
      {error && <ErrorMessage error={error} />}
    </div>
  );
};
```

## Security Considerations

### 1. Authentication

All endpoints require proper user authentication:

```typescript
// Middleware example
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = getUserIdFromToken(token);
  next();
};
```

### 2. Parameter Validation

Server-side validation prevents malicious parameter injection:

```typescript
const validateParameters = (category: string, parameters: Record<string, any>) => {
  const rules = getValidationRules(category);

  for (const [key, value] of Object.entries(parameters)) {
    const rule = rules[key];
    if (!rule || !rule.validate(value)) {
      throw new ValidationError(`Invalid parameter: ${key}`);
    }
  }
};
```

### 3. Rate Limiting

Prevent parameter update abuse:

```typescript
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 updates per minute
  message: 'Too many parameter updates',
});

app.use('/api/ai-parameters', rateLimiter);
```

### 4. Audit Logging

Track all parameter changes:

```typescript
const logParameterChange = (userId: string, category: string, parameters: any) => {
  auditLogger.info({
    event: 'parameter_update',
    userId,
    category,
    parameters,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
};
```

## Monitoring and Observability

### 1. Performance Metrics

Track key performance indicators:

- **Response Time**: API endpoint response times
- **Success Rate**: Percentage of successful updates
- **Error Rate**: Failed update attempts
- **Parameter Impact**: Effect on AI service performance

### 2. Health Checks

Implement comprehensive health monitoring:

```typescript
const healthCheck = async () => {
  const services = ['behavioral_intelligence', 'voice_ai', 'rewards'];
  const health = {};

  for (const service of services) {
    try {
      const response = await pingService(service);
      health[service] = response.ok ? 1.0 : 0.5;
    } catch (error) {
      health[service] = 0.0;
    }
  }

  return health;
};
```

### 3. Alerting

Set up alerts for critical issues:

```typescript
const checkParameterImpact = async (category: string, parameters: any) => {
  const impact = await assessPerformanceImpact(category, parameters);

  if (impact.performanceScore < 0.8) {
    await sendAlert({
      severity: 'warning',
      message: `Parameter update may impact ${category} performance`,
      details: impact,
    });
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Connection Failures

```
Error: Unable to connect to AI parameter services
```

**Solutions:**

- Check service health endpoints
- Verify network connectivity
- Review authentication tokens
- Check rate limiting

#### 2. Validation Errors

```
Error: Learning rate must be between 0.1 and 0.9
```

**Solutions:**

- Review parameter constraints
- Check input sanitization
- Validate data types
- Test edge cases

#### 3. Performance Degradation

```
Warning: Average response time exceeded threshold
```

**Solutions:**

- Review recent parameter changes
- Check system resource usage
- Consider parameter rollback
- Optimize configuration

#### 4. Rollback Failures

```
Error: Rollback token not found or expired
```

**Solutions:**

- Check token expiration settings
- Verify rollback data integrity
- Use manual parameter reset
- Review backup procedures

### Debug Tools

#### 1. Parameter Inspector

```typescript
const inspectParameters = async (userId: string) => {
  const config = await getCurrentConfiguration(userId);
  const validation = await validateAllParameters(config);
  const impact = await assessPerformanceImpact(config);

  return {
    configuration: config,
    validation,
    impact,
    recommendations: generateRecommendations(config, validation, impact),
  };
};
```

#### 2. Health Dashboard

```typescript
const getSystemHealth = async () => {
  const services = await Promise.all([
    checkServiceHealth('behavioral_intelligence'),
    checkServiceHealth('voice_ai'),
    checkServiceHealth('rewards'),
    checkServiceHealth('deployment'),
  ]);

  return {
    overall: services.every((s) => s.healthy),
    services: services.map((s) => ({
      name: s.name,
      status: s.healthy ? 'healthy' : 'unhealthy',
      responseTime: s.responseTime,
      lastCheck: s.lastCheck,
    })),
  };
};
```

This live AI parameter configuration system provides comprehensive control over all AI services
while maintaining safety, performance, and user experience standards.
