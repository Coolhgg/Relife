/**
 * Premium Theme Showcase
 * Interactive demo of all premium theme features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import ThemeCustomizationStudio from './ThemeCustomizationStudio';
import PremiumThemeAnimationService from '../services/premium-theme-animations';

interface ThemeCardProps {
  themeId: Theme;
  name: string;
  description: string;
  preview: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  isActive: boolean;
  onSelect: (theme: Theme) => void;
  isPremium: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  themeId,
  name,
  description,
  preview,
  isActive,
  onSelect,
  isPremium
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      onSelect(themeId);
      setIsAnimating(false);
    }, 300);
  }, [themeId, onSelect]);

  return (
    <div 
      className={`theme-card ${isActive ? 'active' : ''} ${isAnimating ? 'animating' : ''} ${isPremium ? 'premium' : ''}`}
      onClick={handleSelect}
    >
      {isPremium && (
        <div className="premium-badge">
          <span className="premium-icon">✨</span>
          <span>Premium</span>
        </div>
      )}
      
      <div 
        className="theme-preview"
        style={{
          background: `linear-gradient(135deg, ${preview.backgroundColor} 0%, ${preview.primaryColor} 100%)`,
          color: preview.textColor
        }}
      >
        <div className="preview-header">
          <div className="preview-title">{name}</div>
          <div 
            className="preview-accent"
            style={{ backgroundColor: preview.accentColor }}
          ></div>
        </div>
        
        <div className="preview-content">
          <div className="preview-element primary" style={{ backgroundColor: preview.primaryColor }}></div>
          <div className="preview-element secondary" style={{ backgroundColor: preview.accentColor }}></div>
          <div className="preview-element tertiary" style={{ borderColor: preview.primaryColor }}></div>
        </div>
      </div>
      
      <div className="theme-info">
        <h3 className="theme-name">{name}</h3>
        <p className="theme-description">{description}</p>
        
        {isPremium && (
          <div className="premium-features">
            <span className="feature-tag">✨ Animations</span>
            <span className="feature-tag">🎨 Advanced Colors</span>
            <span className="feature-tag">🔧 Customizable</span>
          </div>
        )}
      </div>
    </div>
  );
};

const PremiumThemeShowcase: React.FC = () => {
  const { 
    theme, 
    availableThemes, 
    setTheme, 
    initializePremiumAnimations, 
    setAnimationIntensity,
    getDefaultAnimationEffects 
  } = useTheme();
  const [showStudio, setShowStudio] = useState(false);
  const [animationIntensity, setAnimationIntensityState] = useState<'subtle' | 'moderate' | 'dynamic' | 'dramatic'>('moderate');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'premium' | 'system'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const premiumThemes = availableThemes.filter(t => t.isPremium);
  const systemThemes = availableThemes.filter(t => !t.isPremium);

  const filteredThemes = availableThemes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'premium' && theme.isPremium) ||
                           (selectedCategory === 'system' && !theme.isPremium);
    return matchesSearch && matchesCategory;
  });

  const handleThemeSelect = useCallback((selectedTheme: Theme) => {
    setTheme(selectedTheme);
    
    // Initialize animations for premium themes
    const selectedThemeData = availableThemes.find(t => t.theme === selectedTheme);
    if (selectedThemeData?.isPremium) {
      setTimeout(() => {
        initializePremiumAnimations();
      }, 100);
    }
  }, [setTheme, availableThemes, initializePremiumAnimations]);

  const handleAnimationIntensityChange = useCallback((intensity: 'subtle' | 'moderate' | 'dynamic' | 'dramatic') => {
    setAnimationIntensityState(intensity);
    setAnimationIntensity(intensity);
  }, [setAnimationIntensity]);

  useEffect(() => {
    // Initialize animations when component mounts
    const currentThemeData = availableThemes.find(t => t.theme === theme);
    if (currentThemeData?.isPremium) {
      initializePremiumAnimations();
    }
  }, [theme, availableThemes, initializePremiumAnimations]);

  return (
    <div className="premium-theme-showcase">
      <div className="showcase-header">
        <div className="header-content">
          <h1>Premium Theme Showcase</h1>
          <p>Discover beautiful, animated themes with advanced customization options</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="studio-button"
            onClick={() => setShowStudio(!showStudio)}
          >
            <span className="studio-icon">🛠️</span>
            {showStudio ? 'Hide Studio' : 'Open Studio'}
          </button>
        </div>
      </div>

      {showStudio && (
        <div className="studio-container">
          <ThemeCustomizationStudio />
        </div>
      )}

      <div className="showcase-controls">
        <div className="search-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="category-filters">
            {[
              { key: 'all', label: 'All Themes', count: availableThemes.length },
              { key: 'premium', label: 'Premium', count: premiumThemes.length },
              { key: 'system', label: 'System', count: systemThemes.length }
            ].map(category => (
              <button
                key={category.key}
                className={`category-button ${selectedCategory === category.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.key as any)}
              >
                {category.label}
                <span className="category-count">{category.count}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="animation-controls">
          <label className="control-label">Animation Intensity</label>
          <div className="intensity-selector">
            {[
              { key: 'subtle', label: 'Subtle', icon: '🌸' },
              { key: 'moderate', label: 'Moderate', icon: '🌟' },
              { key: 'dynamic', label: 'Dynamic', icon: '⚡' },
              { key: 'dramatic', label: 'Dramatic', icon: '💥' }
            ].map(intensity => (
              <button
                key={intensity.key}
                className={`intensity-button ${animationIntensity === intensity.key ? 'active' : ''}`}
                onClick={() => handleAnimationIntensityChange(intensity.key as any)}
              >
                <span className="intensity-icon">{intensity.icon}</span>
                <span className="intensity-label">{intensity.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="theme-stats">
        <div className="stat-item">
          <span className="stat-number">{premiumThemes.length}</span>
          <span className="stat-label">Premium Themes</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{systemThemes.length}</span>
          <span className="stat-label">System Themes</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredThemes.filter(t => t.isPremium).length}</span>
          <span className="stat-label">Animated Themes</span>
        </div>
      </div>

      <div className="themes-grid">
        {filteredThemes.length === 0 ? (
          <div className="no-themes">
            <span className="no-themes-icon">🔍</span>
            <h3>No themes found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredThemes.map(themeData => (
            <ThemeCard
              key={themeData.id}
              themeId={themeData.theme}
              name={themeData.name}
              description={themeData.description}
              preview={themeData.preview}
              isActive={theme === themeData.theme}
              onSelect={handleThemeSelect}
              isPremium={themeData.isPremium}
            />
          ))
        )}
      </div>

      {/* Current Theme Info Panel */}
      <div className="current-theme-panel">
        <div className="panel-header">
          <h3>Current Theme: {availableThemes.find(t => t.theme === theme)?.name}</h3>
        </div>
        
        <div className="panel-content">
          <div className="theme-features">
            <h4>Features</h4>
            <div className="features-list">
              {availableThemes.find(t => t.theme === theme)?.isPremium && (
                <>
                  <div className="feature-item">✨ Premium Animations</div>
                  <div className="feature-item">🎨 Advanced Color Schemes</div>
                  <div className="feature-item">🔧 Full Customization</div>
                  <div className="feature-item">📱 Mobile Optimized</div>
                </>
              )}
              <div className="feature-item">♿ Accessibility Ready</div>
              <div className="feature-item">🌙 Dark/Light Support</div>
              <div className="feature-item">⚡ Performance Optimized</div>
            </div>
          </div>
          
          {availableThemes.find(t => t.theme === theme)?.isPremium && (
            <div className="animation-info">
              <h4>Animation Effects</h4>
              <div className="effects-list">
                {Object.entries(getDefaultAnimationEffects()).map(([effect, enabled]) => (
                  enabled && (
                    <div key={effect} className="effect-item">
                      <span className="effect-dot"></span>
                      {effect.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .premium-theme-showcase {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .showcase-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding: 30px;
          background: var(--color-background-secondary);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
        }

        .header-content h1 {
          color: var(--color-text-primary);
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .header-content p {
          color: var(--color-text-secondary);
          margin: 0;
          font-size: 1.1rem;
        }

        .studio-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .studio-button:hover {
          background: var(--color-primary-600);
          transform: translateY(-2px);
        }

        .studio-container {
          margin-bottom: 40px;
        }

        .showcase-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: var(--color-background-secondary);
          border-radius: 12px;
        }

        .search-filters {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          min-width: 300px;
        }

        .search-input {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 1px solid var(--color-border-primary);
          border-radius: 8px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
          font-size: 1rem;
        }

        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
        }

        .category-filters {
          display: flex;
          gap: 8px;
        }

        .category-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-primary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--color-text-primary);
        }

        .category-button:hover {
          background: var(--color-background-tertiary);
        }

        .category-button.active {
          background: var(--color-primary-500);
          color: white;
          border-color: var(--color-primary-600);
        }

        .category-count {
          background: rgba(0, 0, 0, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .animation-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .control-label {
          color: var(--color-text-primary);
          font-weight: 600;
        }

        .intensity-selector {
          display: flex;
          gap: 8px;
        }

        .intensity-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--color-text-primary);
          min-width: 80px;
        }

        .intensity-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .intensity-button.active {
          background: var(--color-primary-500);
          color: white;
          border-color: var(--color-primary-600);
        }

        .theme-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          justify-content: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: var(--color-background-secondary);
          border-radius: 12px;
          min-width: 120px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-primary-500);
        }

        .stat-label {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
        }

        .themes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .theme-card {
          position: relative;
          background: var(--color-background-secondary);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .theme-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
        }

        .theme-card.active {
          border-color: var(--color-primary-500);
          box-shadow: var(--shadow-xl);
        }

        .theme-card.premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1);
          animation: premiumShimmer 3s ease-in-out infinite;
        }

        @keyframes premiumShimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .premium-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(255, 215, 0, 0.9);
          color: #000;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          z-index: 2;
        }

        .theme-preview {
          height: 180px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-title {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .preview-accent {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .preview-content {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .preview-element {
          border-radius: 4px;
        }

        .preview-element.primary {
          width: 40px;
          height: 24px;
        }

        .preview-element.secondary {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .preview-element.tertiary {
          width: 32px;
          height: 24px;
          background: transparent;
          border: 2px solid;
        }

        .theme-info {
          padding: 20px;
        }

        .theme-name {
          color: var(--color-text-primary);
          margin: 0 0 8px 0;
          font-size: 1.2rem;
        }

        .theme-description {
          color: var(--color-text-secondary);
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .premium-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .feature-tag {
          padding: 4px 8px;
          background: var(--color-primary-100);
          color: var(--color-primary-700);
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .no-themes {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 20px;
          text-align: center;
        }

        .no-themes-icon {
          font-size: 4rem;
          opacity: 0.5;
        }

        .no-themes h3 {
          color: var(--color-text-primary);
          margin: 0;
        }

        .no-themes p {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .current-theme-panel {
          background: var(--color-background-secondary);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--shadow-lg);
        }

        .panel-header h3 {
          color: var(--color-text-primary);
          margin: 0 0 20px 0;
        }

        .panel-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .theme-features h4,
        .animation-info h4 {
          color: var(--color-text-primary);
          margin: 0 0 12px 0;
        }

        .features-list,
        .effects-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feature-item,
        .effect-item {
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .effect-dot {
          width: 6px;
          height: 6px;
          background: var(--color-primary-500);
          border-radius: 50%;
        }

        @media (max-width: 768px) {
          .showcase-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .search-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            min-width: 100%;
          }

          .category-filters {
            justify-content: center;
          }

          .themes-grid {
            grid-template-columns: 1fr;
          }

          .theme-stats {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PremiumThemeShowcase;