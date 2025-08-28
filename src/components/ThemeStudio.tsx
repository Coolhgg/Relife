import React, { useState } from 'react';
import {
  Palette,
  Images,
  Plus,
  ArrowLeft,
  Settings,
  Sparkles,
  Eye,
  Save,
  Download,
  Upload,
} from 'lucide-react';
import ThemeCreator from './ThemeCreator';
import ThemeGallery from './ThemeGallery';
import { useTheme } from '../hooks/useTheme';
import type { CustomThemeConfig } from '../types';

interface ThemeStudioProps {
  className?: string;
  onClose?: () => void;
}

type StudioView = 'gallery' | 'creator' | 'editor';

const ThemeStudio: React.FC<ThemeStudioProps> = ({ className = '', onClose }) => {
  const { theme, themeConfig } = useTheme();
  const [currentView, setCurrentView] = useState<StudioView>('gallery');
  const [editingTheme, setEditingTheme] = useState<CustomThemeConfig | null>(null);

  const handleCreateNew = () => {
    setEditingTheme(null);
    setCurrentView('creator');
  };

  const handleEditTheme = (themeConfig: CustomThemeConfig) => {
    setEditingTheme(themeConfig);
    setCurrentView('editor');
  };

  const handleBackToGallery = () => {
    setCurrentView('gallery');
    setEditingTheme(null);
  };

  const renderHeader = () => {
    switch (currentView) {
      case 'creator':
        return (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToGallery}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Gallery</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Palette className="text-blue-600" size={24} />
                <h1 className="text-xl font-bold text-gray-900">Create New Theme</h1>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        );

      case 'editor':
        return (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToGallery}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Gallery</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Settings className="text-purple-600" size={24} />
                <h1 className="text-xl font-bold text-gray-900">
                  Edit {editingTheme?.displayName || 'Theme'}
                </h1>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        );

      default: // gallery
        return (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <Images className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">Theme Studio</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>Create Theme</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'creator':
      case 'editor':
        return <ThemeCreator onClose={handleBackToGallery} className="flex-1" />;

      default: // gallery
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <ThemeGallery
                onCreateNew={handleCreateNew}
                onEditTheme={handleEditTheme}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`${className}`}>
      {currentView === 'gallery' ? (
        // Gallery view - regular layout
        <div className="min-h-screen bg-gray-50">
          {renderHeader()}
          {renderContent()}
        </div>
      ) : (
        // Creator/Editor view - full screen overlay
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
            {renderHeader()}
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeStudio;
