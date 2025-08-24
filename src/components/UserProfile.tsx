import React, { useState } from 'react'; // auto: added missing React import
import {
  User,
  Mail,
  Settings,
  Shield,
  Bell,
  Mic,
  Palette,
  Clock,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import type { User as AppUser, VoiceMood } from '../types';
import { TimeoutHandle } from '../types/timers';

interface UserProfileProps {
  user: AppUser;
  onUpdateProfile: (updates: Partial<AppUser>) => Promise<void>;
  onSignOut: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function UserProfile({
  user,
  onUpdateProfile,
  onSignOut,
  isLoading,
  error,
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    preferences: { ...user.preferences },
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'name') {
      setEditForm(prev => ({ ...prev, name: value }));
    } else {
      setEditForm(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [field]: value },
      }));
    }
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      await onUpdateProfile({
        name: editForm.name,
        preferences: editForm.preferences,
      });
      setIsEditing(false);
      setHasChanges(false);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name || '',
      preferences: { ...user.preferences },
    });
    setIsEditing(false);
    setHasChanges(false);
    setSaveSuccess(false);
  };

  const voiceMoodOptions: { value: VoiceMood; label: string; description: string }[] = [
    {
      value: 'motivational',
      label: 'Motivational',
      description: 'Encouraging and uplifting',
    },
    { value: 'gentle', label: 'Gentle', description: 'Soft and calming' },
    {
      value: 'drill-sergeant',
      label: 'Drill Sergeant',
      description: 'Intense and commanding',
    },
    { value: 'sweet-angel', label: 'Sweet Angel', description: 'Kind and nurturing' },
    { value: 'anime-hero', label: 'Anime Hero', description: 'Energetic and heroic' },
    {
      value: 'savage-roast',
      label: 'Savage Roast',
      description: 'Humorous and teasing',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Success Message */}
      {saveSuccess && (
        <div
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <CheckCircle
              className="w-5 h-5 text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
            <p className="text-green-800 dark:text-green-200 font-medium">
              Profile updated successfully!
            </p>
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" aria-hidden="true" />
          Account
        </h3>

        <div className="space-y-3">
          <button
            onClick={onSignOut}
            className="w-full alarm-button alarm-button-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Sign out of your account"
          >
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
export default UserProfile;
