// Enhanced Premium UI Components
// Psychology-driven, conversion-optimized components for premium features

export { default as EnhancedUpgradePrompt } from "./EnhancedUpgradePrompt";
export { default as PremiumFeaturePreview } from "./PremiumFeaturePreview";
export { default as PsychologyDrivenCTA } from "./PsychologyDrivenCTA";

// Re-export existing components for convenience
export { default as PricingTable } from "./PricingTable";
export { default as FeatureGate } from "./FeatureGate";
export { default as SubscriptionDashboard } from "./SubscriptionDashboard";
export { default as PaymentFlow } from "./PaymentFlow";

// Component usage examples:
/*

// 1. Enhanced Upgrade Prompt with psychology triggers
<EnhancedUpgradePrompt
  feature="nuclearMode"
  variant="modal"
  onUpgrade={(tier) => handleUpgrade(tier)}
  showSocialProof={true}
  showUrgency={true}
  onDismiss={() => setShowPrompt(false)}
/>

// 2. Interactive Premium Feature Preview
<PremiumFeaturePreview
  feature="premiumPersonalities"
  onUpgrade={() => showUpgradePrompt()}
  compact={false}
/>

// 3. Psychology-driven Call-to-Action
<PsychologyDrivenCTA
  targetTier="pro"
  onUpgrade={(tier) => initiatePayment(tier)}
  trigger="urgency" // scarcity, social_proof, loss_aversion, authority, reciprocity
  variant="gradient" // neon, minimal, bold, premium
  size="large"
  animate={true}
/>

*/
