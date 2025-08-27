/**
 * AI Deployment Routes Configuration
 * Integrates the AI deployment dashboard with the main application routing
 */

import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

// Lazy load the AI deployment components for better performance
const AIDeploymentDashboard = lazy(() => import('../components/AIDeploymentDashboard'));
const EnhancedBehavioralIntelligenceDashboard = lazy(() => import('../components/EnhancedBehavioralIntelligenceDashboard'));

// Loading component for lazy-loaded routes
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading AI Dashboard...</p>
    </div>
  </div>
);

/**
 * AI Deployment route configurations
 * These routes should be included in the main application router
 */
export const aiDeploymentRoutes = [
  // Main AI deployment dashboard
  {
    path: '/admin/ai-deployment',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AIDeploymentDashboard />
      </Suspense>
    ),
    meta: {
      title: 'AI Deployment Dashboard',
      description: 'Monitor and control AI behavior analysis system deployment',
      requiresAuth: true,
      requiresAdmin: true,
    }
  },
  
  // Enhanced behavioral intelligence dashboard (for end users)
  {
    path: '/dashboard/ai-insights',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <EnhancedBehavioralIntelligenceDashboard />
      </Suspense>
    ),
    meta: {
      title: 'AI Insights Dashboard',
      description: 'View your personalized behavioral insights and recommendations',
      requiresAuth: true,
      requiresAdmin: false,
    }
  }
];

/**
 * Navigation menu items for AI deployment features
 */
export const aiDeploymentNavItems = [
  {
    id: 'ai-deployment',
    label: 'AI Deployment',
    path: '/admin/ai-deployment',
    icon: 'rocket', // Lucide icon name
    description: 'Monitor AI deployment status',
    badge: 'ADMIN',
    requiresAdmin: true,
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    path: '/dashboard/ai-insights',
    icon: 'brain', // Lucide icon name
    description: 'View behavioral insights',
    badge: 'NEW',
    requiresAdmin: false,
  }
];

/**
 * Route guard for AI deployment features
 */
export const useAIDeploymentAccess = () => {
  // In a real application, this would check user permissions
  // For now, we'll use environment variables or mock data
  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = process.env.REACT_APP_ENABLE_ADMIN === 'true' || isDev;
  
  return {
    canAccessDeploymentDashboard: isAdmin,
    canAccessInsightsDashboard: true, // Available to all authenticated users
    canControlDeployment: isAdmin,
    canViewMetrics: true,
  };
};

/**
 * AI deployment feature flags
 */
export const aiDeploymentFeatures = {
  deploymentControl: process.env.REACT_APP_AI_DEPLOYMENT_ENABLED === 'true',
  behavioralInsights: process.env.REACT_APP_AI_INSIGHTS_ENABLED === 'true',
  crossPlatformIntegration: process.env.REACT_APP_CROSS_PLATFORM_ENABLED === 'true',
  recommendationEngine: process.env.REACT_APP_RECOMMENDATIONS_ENABLED === 'true',
  advancedAnalytics: process.env.REACT_APP_ADVANCED_ANALYTICS_ENABLED === 'true',
};

/**
 * Default props for AI deployment routes
 */
export const defaultAIRouteProps = {
  className: 'min-h-screen bg-gray-50',
  'data-testid': 'ai-deployment-route'
};

export default {
  routes: aiDeploymentRoutes,
  navItems: aiDeploymentNavItems,
  useAccess: useAIDeploymentAccess,
  features: aiDeploymentFeatures,
  defaultProps: defaultAIRouteProps
};