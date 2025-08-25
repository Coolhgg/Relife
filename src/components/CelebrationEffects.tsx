import React, { useState, useEffect, useCallback } from 'react';
import type { RewardRarity, RewardCategory, GiftType } from '../types/reward-system';

interface CelebrationConfig {
  type: 'confetti' | 'fireworks' | 'sparkles' | 'glow' | 'shake';
  duration: number;
  intensity: 'low' | 'medium' | 'high' | 'epic';
  colors?: string[];
  particleCount?: number;
}

interface CelebrationEffectsProps {
  trigger?: boolean;
  config?: CelebrationConfig;
  onComplete?: () => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'circle' | 'star' | 'heart' | 'diamond';
}

const CelebrationEffects: React.FC<CelebrationEffectsProps> = ({
  trigger = false,
  config = {
    type: 'confetti',
    duration: 3000,
    intensity: 'medium',
    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'],
    particleCount: 50,
  },
  onComplete,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = React.useRef<number>();

  // Default colors for different intensities
  const defaultColors = {
    low: ['#6B7280', '#9CA3AF', '#D1D5DB'],
    medium: ['#3B82F6', '#8B5CF6', '#10B981'],
    high: ['#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    epic: ['#FFD700', '#FF6B35', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
  };

  const getParticleCount = (intensity: string) => {
    switch (intensity) {
      case 'low': return 20;
      case 'medium': return 50;
      case 'high': return 100;
      case 'epic': return 200;
      default: return 50;
    }
  };

  const createParticle = useCallback((index: number): Particle => {
    const colors = config.colors || defaultColors[config.intensity];
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Start particles from center of screen for most effects
    const startX = canvasWidth / 2 + (Math.random() - 0.5) * 100;
    const startY = canvasHeight / 2 + (Math.random() - 0.5) * 100;

    // Different initial velocities based on effect type
    let vx, vy;
    switch (config.type) {
      case 'confetti':
        vx = (Math.random() - 0.5) * 10;
        vy = -Math.random() * 8 - 2;
        break;
      case 'fireworks':
        const angle = (Math.PI * 2 * index) / (config.particleCount || 50);
        const speed = Math.random() * 5 + 3;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      case 'sparkles':
        vx = (Math.random() - 0.5) * 4;
        vy = (Math.random() - 0.5) * 4;
        break;
      default:
        vx = (Math.random() - 0.5) * 6;
        vy = -Math.random() * 6 - 1;
    }

    return {
      id: `particle-${index}-${Date.now()}`,
      x: startX,
      y: startY,
      vx,
      vy,
      life: 1,
      maxLife: Math.random() * 60 + 40, // 40-100 frames
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      type: ['circle', 'star', 'heart', 'diamond'][Math.floor(Math.random() * 4)] as any,
    };
  }, [config]);

  const initializeParticles = useCallback(() => {
    const count = config.particleCount || getParticleCount(config.intensity);
    const newParticles = Array.from({ length: count }, (_, i) => createParticle(i));
    setParticles(newParticles);
  }, [config, createParticle]);

  const updateParticles = useCallback(() => {
    setParticles(prevParticles => 
      prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.3, // gravity
          vx: particle.vx * 0.99, // air resistance
          life: particle.life - (1 / particle.maxLife),
        }))
        .filter(particle => 
          particle.life > 0 && 
          particle.x > -50 && particle.x < window.innerWidth + 50 &&
          particle.y > -50 && particle.y < window.innerHeight + 50
        )
    );
  }, []);

  const animate = useCallback(() => {
    updateParticles();
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles]);

  // Start celebration when triggered
  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      initializeParticles();
      
      // Start animation loop
      animationRef.current = requestAnimationFrame(animate);

      // Auto-stop after duration
      const timeout = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        onComplete?.();
      }, config.duration);

      return () => {
        clearTimeout(timeout);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [trigger, isActive, config.duration, initializeParticles, animate, onComplete]);

  const renderParticle = (particle: Particle) => {
    const opacity = particle.life;
    const transform = `translate(${particle.x}px, ${particle.y}px) scale(${particle.life})`;

    const ParticleShape = () => {
      switch (particle.type) {
        case 'star':
          return (
            <svg width={particle.size} height={particle.size} viewBox="0 0 24 24" fill={particle.color}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        case 'heart':
          return (
            <svg width={particle.size} height={particle.size} viewBox="0 0 24 24" fill={particle.color}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          );
        case 'diamond':
          return (
            <svg width={particle.size} height={particle.size} viewBox="0 0 24 24" fill={particle.color}>
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
            </svg>
          );
        default:
          return (
            <div
              className="rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              }}
            />
          );
      }
    };

    return (
      <div
        key={particle.id}
        className="absolute pointer-events-none"
        style={{
          transform,
          opacity,
          zIndex: 1000,
        }}
      >
        <ParticleShape />
      </div>
    );
  };

  if (!isActive || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Screen Flash for Epic Celebrations */}
      {config.intensity === 'epic' && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-transparent to-purple-400 opacity-20 animate-pulse"
          style={{ animationDuration: '0.5s', animationIterationCount: '3' }}
        />
      )}

      {/* Particles */}
      {particles.map(renderParticle)}

      {/* Glow Effect for High Intensity */}
      {(config.intensity === 'high' || config.intensity === 'epic') && (
        <div className="absolute inset-0 bg-gradient-radial from-blue-400 via-transparent to-transparent opacity-10 animate-pulse" />
      )}
    </div>
  );
};

// Hook for using celebration effects
export const useCelebrationEffects = () => {
  const [activeEffect, setActiveEffect] = useState<CelebrationConfig | null>(null);
  const [trigger, setTrigger] = useState(false);

  const celebrate = useCallback((
    type: 'reward' | 'gift' | 'milestone' | 'streak' | 'level_up',
    rarity?: RewardRarity,
    category?: RewardCategory | GiftType
  ) => {
    let config: CelebrationConfig;

    // Configure celebration based on type and rarity
    if (rarity === 'legendary') {
      config = {
        type: 'fireworks',
        duration: 5000,
        intensity: 'epic',
        colors: ['#FFD700', '#FF6B35', '#8B5CF6', '#06B6D4'],
        particleCount: 200,
      };
    } else if (rarity === 'epic') {
      config = {
        type: 'confetti',
        duration: 4000,
        intensity: 'high',
        colors: ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981'],
        particleCount: 100,
      };
    } else if (rarity === 'rare') {
      config = {
        type: 'sparkles',
        duration: 3000,
        intensity: 'medium',
        colors: ['#3B82F6', '#8B5CF6', '#10B981'],
        particleCount: 50,
      };
    } else {
      // Common or no rarity
      config = {
        type: 'confetti',
        duration: 2000,
        intensity: 'low',
        colors: ['#6B7280', '#9CA3AF', '#3B82F6'],
        particleCount: 20,
      };
    }

    // Special configurations for specific types
    if (type === 'streak') {
      config.type = 'fireworks';
      config.colors = ['#F59E0B', '#EF4444', '#FF6B35'];
    } else if (type === 'level_up') {
      config.type = 'fireworks';
      config.intensity = 'high';
      config.colors = ['#FFD700', '#F59E0B', '#8B5CF6'];
    }

    setActiveEffect(config);
    setTrigger(prev => !prev); // Toggle to trigger effect
  }, []);

  const stopCelebration = useCallback(() => {
    setActiveEffect(null);
    setTrigger(false);
  }, []);

  return {
    CelebrationEffects: () => (
      <CelebrationEffects
        trigger={trigger && activeEffect !== null}
        config={activeEffect || undefined}
        onComplete={stopCelebration}
      />
    ),
    celebrate,
    stopCelebration,
    isActive: activeEffect !== null,
  };
};

export default CelebrationEffects;