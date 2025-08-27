# Stub Implementation Guide

## Overview
The auto-generated stubs in `src/utils/__auto_stubs.ts` have been replaced with proper implementations. This guide explains what was implemented and what steps you should take next.

## ✅ What Was Implemented

### 1. Web API Types
- **Before**: Throwing error stubs for DOM types
- **After**: Proper type exports from `globalThis`
- **Types**: `AddEventListenerOptions`, `BlobPart`, `BufferSource`, `IDBDatabaseEventMap`, etc.

### 2. IndexedDB Support
- **Before**: Stubbed `openDB` and `IDBPDatabase`
- **After**: Basic IndexedDB wrapper implementation
- **Recommendation**: Install `idb` package for better TypeScript support
```bash
bun add idb
```

### 3. Service Stubs (Avoiding Circular Dependencies)
- **soundEffectsService**: Basic interface with play, preload, setVolume methods
- **analytics**: Basic interface with track, identify, page methods
- **Recommendation**: Use dependency injection to provide actual service instances

### 4. User/Subscription Management
- **getUserTier()**: Returns user's subscription tier
- **setUserTier()**: Updates user's subscription tier
- **currentTier, userTier, newTier**: Aliases for tier functions

### 5. Type Definitions
- **Award Interface**: Achievement/reward system
- **Gift Interface**: Gift/reward system
- **WebSocket Types**: Re-exported from existing types
- **Subscription Types**: Re-exported from existing types

### 6. UI Components
- **Lucide Icons**: Replaced stubs with actual Lucide React imports
- **Component Stubs**: Safe placeholder components for missing React components

### 7. Utility Functions
- **ID Generation**: `generateId()`, `getRippleId()`
- **Configuration**: Environment-aware config object
- **Error Handling**: `AppError` class and error instances
- **Logging**: Structured logging utilities

## ⚠️ Important Notes

### Circular Dependencies
The original services had circular import issues. Current implementation uses:
- **Type-only imports** where possible
- **Stub interfaces** for services to break circular dependencies
- **Dependency injection pattern** recommendations

### Missing Dependencies
Consider installing these packages for better type support:
```bash
# For better IndexedDB types
bun add idb

# If not already installed
bun add @types/web
```

## 🔄 Next Steps

### 1. Replace Service Stubs
Instead of importing from `__auto_stubs.ts`, inject actual service instances:

```typescript
// Instead of this:
import { soundEffectsService } from '../utils/__auto_stubs';

// Do this:
import { SoundEffectsService } from '../services/sound-effects';
const soundEffectsService = SoundEffectsService.getInstance();
```

### 2. Implement Proper Dependency Injection
Create a service container or use React context:

```typescript
// services/ServiceContainer.ts
export class ServiceContainer {
  private static instance: ServiceContainer;
  
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
  
  getSoundEffectsService() {
    return SoundEffectsService.getInstance();
  }
  
  getAnalyticsService() {
    return AnalyticsService.getInstance();
  }
}
```

### 3. Update Service Imports
Remove stub imports from services:

```typescript
// In services/sound-effects.ts, remove:
import { config } from 'src/utils/__auto_stubs';

// Replace with:
import { config } from '../config/environment';
```

### 4. Implement Missing Interfaces
The Award and Gift interfaces are defined but need actual implementation:

```typescript
// services/achievement-service.ts
export class AchievementService {
  async getAwards(userId: string): Promise<Award[]> {
    // Implement award fetching
  }
  
  async grantAward(userId: string, awardId: string): Promise<void> {
    // Implement award granting
  }
}
```

### 5. Context-Specific Variables
Many variables should come from React context or props:

```typescript
// Instead of global variables, use context:
const { userId, currentTier } = useAuth();
const { paymentMethodId } = usePayment();
```

## 📝 Testing
After making changes:

1. **Run TypeScript check**: `bun run type-check`
2. **Run linting**: `bun run lint`
3. **Run tests**: `bun run test`
4. **Check for circular dependencies**: Look for import cycles in build output

## 🎯 Priority Actions

1. **High Priority**: Remove circular imports from services
2. **Medium Priority**: Implement proper dependency injection
3. **Low Priority**: Add comprehensive Award/Gift system

## 📚 Resources
- [Dependency Injection in TypeScript](https://github.com/microsoft/tsyringe)
- [IndexedDB with idb](https://github.com/jakearchibald/idb)
- [React Context for Services](https://reactjs.org/docs/context.html)

---

This implementation provides a solid foundation while avoiding the circular dependency issues that were causing build problems. The next step is to gradually replace these stubs with proper service instances and dependency injection.