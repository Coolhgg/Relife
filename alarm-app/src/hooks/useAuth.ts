import { useState, useEffect } from 'react';
import { SupabaseService, supabase } from '../services/supabase';
import type { User } from '../types';
import { ErrorHandler } from '../services/error-handler';
import AnalyticsService from '../services/analytics';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  forgotPasswordSuccess: boolean;
}

interface AuthHook extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

function useAuth(): AuthHook {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    forgotPasswordSuccess: false
  });

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await SupabaseService.getCurrentUser();
        setAuthState(prev => ({
          ...prev,
          user,
          isInitialized: true
        }));

        if (user) {
          const analytics = AnalyticsService.getInstance();
          analytics.trackFeatureUsage('user_session_restored', undefined, { userId: user.id });
        }
      } catch (error) {
        ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to initialize authentication',
          { context: 'auth_initialization' }
        );
        setAuthState(prev => ({
          ...prev,
          isInitialized: true,
          error: 'Failed to initialize authentication'
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await SupabaseService.getCurrentUser();
          setAuthState(prev => ({
            ...prev,
            user: userProfile,
            error: null
          }));
          
          const analytics = AnalyticsService.getInstance();
          analytics.trackFeatureUsage('user_signed_in', undefined, { userId: session.user.id });
        } else if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({
            ...prev,
            user: null,
            error: null
          }));
          
          const analytics = AnalyticsService.getInstance();
          analytics.trackFeatureUsage('user_signed_out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      forgotPasswordSuccess: false 
    }));

    try {
      const analytics = AnalyticsService.getInstance();
      const startTime = performance.now();
      
      const { user, error } = await SupabaseService.signIn(email, password);
      
      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        analytics.trackError(new Error(error), 'sign_in_failed');
        return;
      }

      if (user) {
        setAuthState(prev => ({ 
          ...prev, 
          user, 
          isLoading: false, 
          error: null 
        }));
        
        const duration = performance.now() - startTime;
        analytics.trackFeatureUsage('user_sign_in_success', duration, { 
          userId: user.id,
          method: 'email_password' 
        });
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Sign in failed. Please try again.' 
        }));
      }
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'sign_in_error');
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Sign in failed',
        { context: 'sign_in', metadata: { email } }
      );
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }));
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      forgotPasswordSuccess: false 
    }));

    try {
      const analytics = AnalyticsService.getInstance();
      const startTime = performance.now();
      
      const { user, error } = await SupabaseService.signUp(email, password, name);
      
      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        analytics.trackError(new Error(error), 'sign_up_failed');
        return;
      }

      if (user) {
        setAuthState(prev => ({ 
          ...prev, 
          user, 
          isLoading: false, 
          error: null 
        }));
        
        const duration = performance.now() - startTime;
        analytics.trackFeatureUsage('user_sign_up_success', duration, { 
          userId: user.id,
          method: 'email_password' 
        });
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Account creation failed. Please try again.' 
        }));
      }
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'sign_up_error');
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Sign up failed',
        { context: 'sign_up', metadata: { email, name } }
      );
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }));
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const analytics = AnalyticsService.getInstance();
      const userId = authState.user?.id;
      
      const { error } = await SupabaseService.signOut();
      
      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return;
      }

      setAuthState(prev => ({ 
        ...prev, 
        user: null, 
        isLoading: false, 
        error: null 
      }));
      
      analytics.trackFeatureUsage('user_sign_out_success', undefined, { userId });
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'sign_out_error');
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Sign out failed',
        { context: 'sign_out' }
      );
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to sign out. Please try again.' 
      }));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      forgotPasswordSuccess: false 
    }));

    try {
      const analytics = AnalyticsService.getInstance();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
        analytics.trackError(new Error(error.message), 'password_reset_failed');
        return;
      }

      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null,
        forgotPasswordSuccess: true 
      }));
      
      analytics.trackFeatureUsage('password_reset_requested', undefined, { email });
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'password_reset_error');
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Password reset failed',
        { context: 'password_reset', metadata: { email } }
      );
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to send reset email. Please try again.' 
      }));
    }
  };

  const clearError = (): void => {
    setAuthState(prev => ({ ...prev, error: null, forgotPasswordSuccess: false }));
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    if (!authState.user) {
      throw new Error('No user logged in');
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const analytics = AnalyticsService.getInstance();
      
      // Update user profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          preferences: updates.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', authState.user.id);

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      // Update local state
      const updatedUser: User = {
        ...authState.user,
        ...updates
      };

      setAuthState(prev => ({ 
        ...prev, 
        user: updatedUser, 
        isLoading: false, 
        error: null 
      }));
      
      analytics.trackFeatureUsage('user_profile_updated', undefined, { 
        userId: authState.user.id,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      const analytics = AnalyticsService.getInstance();
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), 'profile_update_error');
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to update profile',
        { context: 'profile_update', metadata: { userId: authState.user.id, updates } }
      );
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to update profile. Please try again.' 
      }));
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    updateUserProfile
  };
}

export default useAuth;