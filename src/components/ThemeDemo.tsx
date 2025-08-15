import React, { useState } from 'react';
import { 
  Palette, 
  Play, 
  Wand2, 
  Eye, 
  Settings, 
  Download,
  Share2,
  Heart,
  Star,
  Clock,
  Bell,
  Sun,
  Moon,
  Volume2,
  Zap
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ThemeStudio from './ThemeStudio';

interface ThemeDemoProps {
  className?: string;
}

const ThemeDemo: React.FC<ThemeDemoProps> = ({ className = '' }) => {
  const { theme, themeConfig } = useTheme();
  const [showStudio, setShowStudio] = useState(false);
  const [demoMode, setDemoMode] = useState<'preview' | 'interactive'>('preview');

  // Demo alarm data
  const demoAlarms = [
    {
      id: '1',
      time: '07:00',
      label: 'Morning Workout',
      enabled: true,
      days: ['Mon', 'Wed', 'Fri']
    },
    {
      id: '2',
      time: '22:30',
      label: 'Wind Down Time',
      enabled: true,
      days: ['Every Day']
    },
    {
      id: '3',
      time: '12:00',
      label: 'Lunch Break',
      enabled: false,
      days: ['Weekdays']
    }
  ];

  const features = [
    {
      icon: <Palette size={24} />,
      title: 'Visual Theme Creator',
      description: 'Create stunning custom themes with our intuitive color picker and real-time preview system.',
      highlight: 'New!'
    },
    {
      icon: <Eye size={24} />,
      title: 'Live Preview',
      description: 'See exactly how your themes will look across all app components before applying them.',
      highlight: 'Interactive'
    },
    {
      icon: <Wand2 size={24} />,
      title: 'Smart Color Generation',
      description: 'Automatically generate harmonious color palettes with proper contrast ratios and accessibility support.',
      highlight: 'AI-Powered'
    },
    {
      icon: <Share2 size={24} />,
      title: 'Theme Sharing',
      description: 'Share your custom themes with friends or import community-created designs.',
      highlight: 'Community'
    }
  ];

  const themePresets = [
    {
      name: 'Sunrise Energy',
      colors: ['#ff7e5f', '#feb47b', '#ff6a6b', '#fff8e1'],
      description: 'Warm and energizing morning vibes'
    },
    {
      name: 'Ocean Depths', 
      colors: ['#06b6d4', '#0891b2', '#22d3ee', '#ecfeff'],
      description: 'Cool and calming ocean blues'
    },
    {
      name: 'Forest Zen',
      colors: ['#22c55e', '#16a34a', '#4ade80', '#f0fdf4'],
      description: 'Natural greens for tranquility'
    },
    {
      name: 'Cosmic Purple',
      colors: ['#8b5cf6', '#a855f7', '#c084fc', '#faf5ff'],
      description: 'Mystical purples and deep space'
    }
  ];

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex justify-center items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl text-white">
                  <Palette size={32} />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Theme Creator Studio
                </h1>
              </div>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform your Relife experience with powerful visual customization tools. 
                Create, share, and discover beautiful themes that perfectly match your style.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowStudio(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  <Wand2 size={24} />
                  <span>Create Your Theme</span>
                </button>
                <button
                  onClick={() => setDemoMode(demoMode === 'preview' ? 'interactive' : 'preview')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                >
                  <Play size={24} />
                  <span>{demoMode === 'preview' ? 'Try Interactive Demo' : 'View Preview'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Theme Creation Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to create stunning, accessible, and personalized themes for your alarm app
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                  {feature.highlight && (
                    <div className="absolute -top-3 -right-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {feature.highlight}
                      </span>
                    </div>
                  )}
                  <div className="text-blue-600 mb-4 group-hover:text-purple-600 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo App Interface */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See Your Themes in Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Preview how your custom themes will look across the entire Relife alarm app interface
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Mock Phone Interface */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
              <div className="max-w-sm mx-auto bg-black rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '9/19' }}>
                  {/* Status Bar */}
                  <div 
                    className="flex items-center justify-between px-6 py-2 text-sm"
                    style={{ 
                      backgroundColor: themeConfig?.colors?.background?.primary || '#ffffff',
                      color: themeConfig?.colors?.text?.primary || '#000000'
                    }}
                  >
                    <span className="font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-current rounded-sm">
                        <div className="w-3 h-1 bg-current rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* App Header */}
                  <div 
                    className="px-6 py-4"
                    style={{ 
                      backgroundColor: themeConfig?.colors?.background?.primary || '#ffffff'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 
                          className="text-xl font-bold"
                          style={{ color: themeConfig?.colors?.text?.primary || '#000000' }}
                        >
                          Good Morning
                        </h1>
                        <p 
                          className="text-sm opacity-70"
                          style={{ color: themeConfig?.colors?.text?.secondary || '#666666' }}
                        >
                          3 alarms active
                        </p>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: themeConfig?.colors?.primary?.[500] || '#0ea5e9' }}
                      >
                        <Bell size={20} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Alarms List */}
                  <div 
                    className="px-6 space-y-3"
                    style={{ 
                      backgroundColor: themeConfig?.colors?.background?.secondary || '#f8fafc',
                      minHeight: '300px'
                    }}
                  >
                    {demoAlarms.map((alarm, index) => (
                      <div 
                        key={alarm.id}
                        className="p-4 rounded-xl border"
                        style={{ 
                          backgroundColor: themeConfig?.colors?.surface?.elevated || '#ffffff',
                          borderColor: themeConfig?.colors?.border?.primary || '#e2e8f0'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold" style={{ color: themeConfig?.colors?.text?.primary || '#000000' }}>
                              {alarm.time}
                            </div>
                            <div className="text-sm" style={{ color: themeConfig?.colors?.text?.secondary || '#666666' }}>
                              {alarm.label}
                            </div>
                            <div className="text-xs" style={{ color: themeConfig?.colors?.text?.tertiary || '#999999' }}>
                              {alarm.days.join(', ')}
                            </div>
                          </div>
                          <div 
                            className={`w-12 h-6 rounded-full relative transition-colors ${
                              alarm.enabled ? 'bg-current' : 'bg-gray-200'
                            }`}
                            style={{ 
                              color: alarm.enabled 
                                ? themeConfig?.colors?.primary?.[500] || '#0ea5e9'
                                : '#d1d5db'
                            }}
                          >
                            <div 
                              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                                alarm.enabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Navigation */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t"
                    style={{ 
                      backgroundColor: themeConfig?.colors?.surface?.elevated || '#ffffff',
                      borderColor: themeConfig?.colors?.border?.primary || '#e2e8f0'
                    }}
                  >
                    <div className="flex justify-around">
                      {[Clock, Bell, Settings].map((Icon, index) => (
                        <button 
                          key={index}
                          className={`p-3 rounded-xl ${index === 1 ? 'opacity-100' : 'opacity-50'}`}
                          style={{ 
                            color: index === 1 
                              ? themeConfig?.colors?.primary?.[500] || '#0ea5e9'
                              : themeConfig?.colors?.text?.tertiary || '#999999'
                          }}
                        >
                          <Icon size={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Presets Gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Inspiring Theme Presets
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started with these beautiful preset themes, or use them as inspiration for your own creations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {themePresets.map((preset, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                  {/* Color Preview */}
                  <div className="h-24 flex">
                    {preset.colors.map((color, colorIndex) => (
                      <div 
                        key={colorIndex}
                        className="flex-1" 
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {preset.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {preset.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 text-sm">
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1 text-gray-500 hover:text-gray-600 text-sm">
                        <Heart size={14} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Create Your Perfect Theme?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of users who have already customized their Relife experience with our powerful theme creator
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowStudio(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Palette size={24} />
                  <span>Launch Theme Studio</span>
                </button>
                <button className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold text-lg hover:border-white/40 hover:bg-white/10 transition-colors">
                  <Download size={24} />
                  <span>Download Presets</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Studio Modal */}
      {showStudio && (
        <ThemeStudio onClose={() => setShowStudio(false)} />
      )}
    </>
  );
};

export default ThemeDemo;