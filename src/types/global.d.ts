// Global utility types for better type safety in backend utilities

// Safe alternative to { [key: string]: any }
type UnknownRecord = Record<string, unknown>;

// For JSON-like data structures
interface JsonObject {
  [key: string]: string | number | boolean | null | JsonObject | JsonArray;
}

type JsonArray = JsonObject[];

// For functions that might return multiple result types
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// For service worker message types
interface ServiceWorkerMessageData {
  alarm?: {
    id: string;
    time: string;
    label?: string;
  };
  sync?: {
    timestamp: string;
    alarmsCount: number;
  };
  status?: {
    isHealthy: boolean;
    uptime: number;
  };
}

// For translation validation data structures
interface TranslationData {
  [key: string]: string | TranslationData | TranslationData[];
}

// For component state changes (screen reader)
interface ComponentState {
  [key: string]: string | number | boolean | ComponentState;
}

// For analysis worker data structures
interface SleepSession {
  startTime: string;
  endTime: string;
  duration: number;
  quality: number;
  interruptions: number;
}

interface VoiceCommand {
  timestamp: string;
  command: string;
  confidence: number;
  processed: boolean;
}

interface AnalysisResult {
  accuracy: number;
  patterns: string[];
  recommendations: string[];
  confidence: number;
}

// For premium testing structures
interface SubscriptionAccessResult {
  hasAccess: boolean;
  tier: string;
  features: string[];
  limitations?: string[];
}

interface UsageLimitsResult {
  current: number;
  limit: number;
  resetDate: string;
  percentUsed: number;
}

interface VoiceGenerationResult {
  available: boolean;
  voicesCount: number;
  quality: "basic" | "premium" | "pro";
  languages: string[];
}

interface UpgradeRecommendation {
  suggestedTier: string;
  benefits: string[];
  estimatedSavings?: number;
  reason: string;
}
