// User Testing Components
export { default as FeedbackModal } from "./FeedbackModal";
export { default as BugReportModal } from "./BugReportModal";
export { default as FeedbackWidget } from "./FeedbackWidget";
export {
  default as ABTestWrapper,
  useABTest,
  withABTest,
  ABTestProps,
} from "./ABTestWrapper";
export { default as UsabilityAnalyticsDashboard } from "./UsabilityAnalyticsDashboard";

// Re-export types from the service
export type {
  UserTestSession,
  DeviceInfo,
  UserFeedback,
  ABTest,
  ABTestVariant,
  ABTestMetric,
  UsabilityEvent,
  BugReport,
} from "../../services/user-testing";

// Re-export the service
export { default as UserTestingService } from "../../services/user-testing";
