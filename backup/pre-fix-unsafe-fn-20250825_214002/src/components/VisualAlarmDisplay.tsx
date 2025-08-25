/**
 * Visual Alarm Display Component
 * Renders alarms with themed visual effects, animations, and interactions
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  visualAlarmThemes,
  VisualAlarmThemeId,
  VisualAlarmTheme,
} from '../services/visual-alarm-themes';
import { Alarm } from '../types';

interface VisualAlarmDisplayProps {
  alarm: Alarm;
  themeId?: VisualAlarmThemeId;
  isActive: boolean;
  onDismiss: () => void;
  onSnooze: () => void;
  className?: string;
}

interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const VisualAlarmDisplay: React.FC<VisualAlarmDisplayProps> = ({
  alarm,
  themeId = 'sunrise_glow',
  isActive,
  onDismiss,
  onSnooze,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<TimeoutHandle>();
  const [theme, setTheme] = useState<VisualAlarmTheme>();
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [showControls, setShowControls] = useState(false);

  // Load theme
  useEffect(() => {
    const loadedTheme = visualAlarmThemes.getTheme(themeId);
    if (loadedTheme) {
      setTheme(loadedTheme);
    }
  }, [themeId]);

  // Apply theme to container
  useEffect(() => {
    if (theme && containerRef.current && isActive) {
      visualAlarmThemes.applyTheme(themeId, containerRef.current);
    }
  }, [theme, themeId, isActive]);

  // Initialize particle effects
  useEffect(() => {
    if (theme?.effects.particles && isActive) {
      initializeParticles();
      startParticleAnimation();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      visualAlarmThemes.stopAllEffects();
    };
  }, [theme, isActive, initializeParticles, startParticleAnimation]);

  const initializeParticles = useCallback(() => {
    if (!theme) return;

    const particleCount =
      theme.animations.intensity === 'extreme'
        ? 100
        : theme.animations.intensity === 'intense'
          ? 60
          : theme.animations.intensity === 'moderate'
            ? 30
            : 15;

    const newParticles: ParticleEffect[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(i));
    }

    setParticles(newParticles);
  }, [theme]);

  const createParticle = (id: number): ParticleEffect => {
    if (!theme) {
      return {
        id,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 100,
        color: '#ffffff',
        size: 2,
      };
    }

    const canvas = canvasRef.current;
    const width = canvas?.width || window.innerWidth;
    const height = canvas?.height || window.innerHeight;

    return {
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 100,
      color: Math.random() > 0.5 ? theme.colors.primary : theme.colors.accent,
      size: Math.random() * 4 + 1,
    };
  };

  const updateParticles = useCallback(() => {
    setParticles((prevParticles: any) =>
      prevParticles.map((particle: any) => {
        const newParticle = { ...particle };

        // Update position
        newParticle.x += newParticle.vx;
        newParticle.y += newParticle.vy;

        // Update life
        newParticle.life += 1;

        // Bounce off edges
        const canvas = canvasRef.current;
        if (canvas) {
          if (newParticle.x < 0 || newParticle.x > canvas.width) {
            newParticle.vx *= -1;
          }
          if (newParticle.y < 0 || newParticle.y > canvas.height) {
            newParticle.vy *= -1;
          }
        }

        // Reset particle if life exceeded
        if (newParticle.life > newParticle.maxLife) {
          return createParticle(newParticle.id);
        }

        return newParticle;
      })
    );
  }, [theme, createParticle]);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !theme) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particles.forEach((particle: any) => {
      const alpha = 1 - particle.life / particle.maxLife;
      ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [particles, theme]);

  const startParticleAnimation = useCallback(() => {
    const animate = () => {
      updateParticles();
      drawParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [updateParticles, drawParticles]);

  // Format alarm time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle screen interactions
  const handleScreenTap = () => {
    setShowControls(!showControls);
  };

  const handleDismiss = () => {
    onDismiss();
    visualAlarmThemes.stopAllEffects();
  };

  const handleSnooze = () => {
    onSnooze();
    visualAlarmThemes.stopAllEffects();
  };

  if (!theme || !isActive) {
    return null;
  }

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: theme.animations.entrance === 'zoom' ? 0.5 : 1,
      rotate: theme.animations.entrance === 'rotate' ? -180 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: theme.animations.duration / 1000,
        ease: 'easeInOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 },
    },
  };

  const loopVariants =
    theme.animations.loop === 'pulse'
      ? {
          animate: {
            scale: [1, 1.05, 1],
            transition: {
              duration: theme.animations.duration / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          },
        }
      : theme.animations.loop === 'rotate'
        ? {
            animate: {
              rotate: [0, 360],
              transition: {
                duration: theme.animations.duration / 1000,
                repeat: Infinity,
                ease: 'linear',
              },
            },
          }
        : {};

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className={`visual-alarm-display ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate={['visible', loopVariants.animate ? 'animate' : '']}
        exit="exit"
        onClick={handleScreenTap}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Background Canvas for Particles */}
        {theme.effects.particles && (
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
        )}

        {/* Background Pattern/Effects */}
        {theme.background.type === 'pattern' && (
          <div
            className="background-pattern"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: theme.background.opacity,
              backgroundImage: getPatternCSS(theme.background.pattern),
              backgroundSize: '50px 50px',
              zIndex: -1,
            }}
          />
        )}

        {/* Main Alarm Content */}
        <motion.div
          className="alarm-content"
          style={{
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '1rem',
            backdropFilter: theme.effects.blur ? 'blur(10px)' : 'none',
            background: theme.effects.blur ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: theme.effects.blur ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
          }}
        >
          {/* Alarm Name */}
          <motion.h1
            style={{
              fontSize: theme.typography.fontSize === 'extra-large' ? '4rem' : '3rem',
              fontWeight: theme.typography.fontWeight,
              marginBottom: '1rem',
              letterSpacing: `${theme.typography.letterSpacing}px`,
            }}
            animate={
              theme.effects.glitch
                ? {
                    x: [0, -2, 2, 0],
                    transition: {
                      duration: 0.1,
                      repeat: Infinity,
                      repeatType: 'mirror',
                    },
                  }
                : {}
            }
          >
            {alarm.name}
          </motion.h1>

          {/* Alarm Time */}
          <motion.div
            style={{
              fontSize: '5rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
              textShadow: theme.typography.textShadow
                ? '4px 4px 8px rgba(0,0,0,0.3)'
                : 'none',
            }}
            animate={
              theme.animations.loop === 'glow'
                ? {
                    textShadow: [
                      `0 0 20px ${theme.colors.accent}`,
                      `0 0 40px ${theme.colors.accent}`,
                      `0 0 20px ${theme.colors.accent}`,
                    ],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
                : {}
            }
          >
            {formatTime(alarm.time)}
          </motion.div>

          {/* Voice Mood Indicator */}
          {alarm.voiceMood && (
            <motion.div
              style={{
                fontSize: '1.2rem',
                opacity: 0.8,
                marginBottom: '2rem',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Voice: {alarm.voiceMood}
            </motion.div>
          )}
        </motion.div>

        {/* Control Buttons */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="alarm-controls"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                position: 'absolute',
                bottom: '4rem',
                display: 'flex',
                gap: '2rem',
                zIndex: 10,
              }}
            >
              <motion.button
                onClick={handleSnooze}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  border: `2px solid ${theme.colors.secondary}`,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: theme.colors.text,
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                }}
              >
                Snooze
              </motion.button>

              <motion.button
                onClick={handleDismiss}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  border: `2px solid ${theme.colors.primary}`,
                  background: theme.colors.primary,
                  color: theme.colors.background,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Name Indicator (for preview) */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            fontSize: '0.8rem',
            opacity: 0.5,
            color: theme.colors.text,
          }}
        >
          {theme.name}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to generate pattern CSS
const getPatternCSS = (pattern?: string): string => {
  switch (pattern) {
    case 'dots':
      return 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)';
    case 'lines':
      return 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)';
    case 'grid':
      return `
        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
      `;
    case 'waves':
      return 'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0px, transparent 20px)';
    case 'hexagons':
      return `
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 2px, transparent 2px)
      `;
    case 'triangles':
      return 'conic-gradient(from 0deg, rgba(255,255,255,0.05) 120deg, transparent 120deg)';
    case 'noise':
      return `
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 1px, transparent 1px),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 1px, transparent 1px)
      `;
    default:
      return 'none';
  }
};

export default VisualAlarmDisplay;
