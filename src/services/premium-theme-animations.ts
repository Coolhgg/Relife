/**
 * Premium Theme Animation Service
 * Advanced animation features for premium themes
 */

export interface ThemeAnimationConfig {
  enabled: boolean;
  type: 'fade' | 'slide' | 'scale' | 'flip' | 'wave' | 'particle' | 'morphing' | 'glow';
  duration: number;
  easing: string;
  intensity: 'subtle' | 'moderate' | 'dynamic' | 'dramatic';
  triggers: ('hover' | 'focus' | 'click' | 'scroll' | 'time')[];
}

export interface PremiumAnimationEffects {
  // Background animations
  backgroundWave?: boolean;
  backgroundParticles?: boolean;
  backgroundMorphing?: boolean;

  // UI element animations
  cardFloating?: boolean;
  buttonPulse?: boolean;
  iconRotation?: boolean;
  textShimmer?: boolean;

  // Advanced effects
  colorShifting?: boolean;
  lightRay?: boolean;
  galaxyBackground?: boolean;
  liquidMotion?: boolean;

  // Interactive effects
  hoverRipple?: boolean;
  clickWave?: boolean;
  scrollParallax?: boolean;
  mouseGlow?: boolean;
}

class PremiumThemeAnimationService {
  private static instance: PremiumThemeAnimationService;
  private animationElements: Map<string, HTMLElement> = new Map();
  private activeAnimations: Map<string, Animation> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();
  private animationFrame: number | null = null;

  static getInstance(): PremiumThemeAnimationService {
    if (!PremiumThemeAnimationService.instance) {
      PremiumThemeAnimationService.instance = new PremiumThemeAnimationService();
    }
    return PremiumThemeAnimationService.instance;
  }

  /**
   * Initialize premium animations for a theme
   */
  initializePremiumAnimations(theme: string, effects: PremiumAnimationEffects): void {
    this.cleanup();

    if (theme === 'ocean-breeze') {
      this.initializeOceanAnimations(effects);
    } else if (theme === 'sunset-glow') {
      this.initializeSunsetAnimations(effects);
    } else if (theme === 'forest-dream') {
      this.initializeForestAnimations(effects);
    } else if (theme === 'midnight-cosmos') {
      this.initializeCosmosAnimations(effects);
    }
  }

  /**
   * Ocean Breeze theme animations
   */
  private initializeOceanAnimations(effects: PremiumAnimationEffects): void {
    if (effects.backgroundWave) {
      this.createWaveBackground();
    }

    if (effects.cardFloating) {
      this.createFloatingCards();
    }

    if (effects.hoverRipple) {
      this.createRippleEffect();
    }

    if (effects.scrollParallax) {
      this.createParallaxEffect();
    }
  }

  /**
   * Sunset Glow theme animations
   */
  private initializeSunsetAnimations(effects: PremiumAnimationEffects): void {
    if (effects.colorShifting) {
      this.createColorShiftEffect();
    }

    if (effects.lightRay) {
      this.createLightRayEffect();
    }

    if (effects.buttonPulse) {
      this.createPulsingButtons();
    }

    if (effects.textShimmer) {
      this.createShimmerText();
    }
  }

  /**
   * Forest Dream theme animations
   */
  private initializeForestAnimations(effects: PremiumAnimationEffects): void {
    if (effects.backgroundParticles) {
      this.createParticleSystem('leaves');
    }

    if (effects.iconRotation) {
      this.createRotatingIcons();
    }

    if (effects.liquidMotion) {
      this.createLiquidMotionBackground();
    }

    if (effects.mouseGlow) {
      this.createMouseGlowEffect();
    }
  }

  /**
   * Midnight Cosmos theme animations
   */
  private initializeCosmosAnimations(effects: PremiumAnimationEffects): void {
    if (effects.galaxyBackground) {
      this.createGalaxyBackground();
    }

    if (effects.backgroundParticles) {
      this.createParticleSystem('stars');
    }

    if (effects.backgroundMorphing) {
      this.createMorphingBackground();
    }

    if (effects.clickWave) {
      this.createClickWaveEffect();
    }
  }

  /**
   * Wave background animation
   */
  private createWaveBackground(): void {
    const waveContainer = document.createElement('div');
    waveContainer.className = 'ocean-wave-background';
    waveContainer.innerHTML = `
      <svg class="ocean-waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="wave-shape-fill"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="wave-shape-fill"></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="wave-shape-fill"></path>
      </svg>
    `;

    this.injectStyles(`
      .ocean-wave-background {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 120px;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
      }

      .ocean-waves {
        position: relative;
        width: 100%;
        height: 120px;
        margin-bottom: -7px;
      }

      .wave-shape-fill {
        fill: var(--color-primary-100);
        animation: oceanWave 8s ease-in-out infinite;
        transform-origin: 50% 50%;
      }

      @keyframes oceanWave {
        0%, 100% { transform: translateX(0) scaleY(1); }
        25% { transform: translateX(-10px) scaleY(0.95); }
        50% { transform: translateX(5px) scaleY(1.05); }
        75% { transform: translateX(-5px) scaleY(0.98); }
      }
    `);

    document.body.appendChild(waveContainer);
    this.animationElements.set('ocean-wave', waveContainer);
  }

  /**
   * Floating cards animation
   */
  private createFloatingCards(): void {
    const cards = document.querySelectorAll('.card, .alarm-card, [class*="card"]');

    cards.forEach((card, index) => {
      const element = card as HTMLElement;
      element.style.animation = `cardFloat ${3 + index * 0.5}s ease-in-out infinite`;
      element.style.animationDelay = `${index * 0.2}s`;
    });

    this.injectStyles(`
      @keyframes cardFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-5px) rotate(0.5deg); }
      }
    `);
  }

  /**
   * Ripple effect on hover
   */
  private createRippleEffect(): void {
    const addRipple = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      target.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 1000);
    };

    const interactiveElements = document.querySelectorAll(
      'button, .clickable, [role="button"]'
    );
    interactiveElements.forEach(element => {
      element.addEventListener('click', addRipple);
    });

    this.injectStyles(`
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: translate(-50%, -50%) scale(0);
        animation: rippleAnimation 0.6s linear;
        pointer-events: none;
      }

      @keyframes rippleAnimation {
        to {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }
    `);
  }

  /**
   * Color shifting animation for sunset theme
   */
  private createColorShiftEffect(): void {
    const root = document.documentElement;

    this.injectStyles(`
      :root {
        --color-shift-animation: 8s ease-in-out infinite;
      }

      .theme-sunset-glow {
        animation: sunsetColorShift var(--color-shift-animation);
      }

      @keyframes sunsetColorShift {
        0%, 100% { filter: hue-rotate(0deg) saturate(1); }
        25% { filter: hue-rotate(10deg) saturate(1.1); }
        50% { filter: hue-rotate(-5deg) saturate(0.9); }
        75% { filter: hue-rotate(5deg) saturate(1.05); }
      }
    `);
  }

  /**
   * Light ray effect
   */
  private createLightRayEffect(): void {
    const lightRayContainer = document.createElement('div');
    lightRayContainer.className = 'light-ray-container';
    lightRayContainer.innerHTML = `
      <div class="light-ray light-ray-1"></div>
      <div class="light-ray light-ray-2"></div>
      <div class="light-ray light-ray-3"></div>
    `;

    this.injectStyles(`
      .light-ray-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
      }

      .light-ray {
        position: absolute;
        background: linear-gradient(45deg, transparent, rgba(255, 200, 100, 0.1), transparent);
        width: 2px;
        height: 100vh;
        animation: lightRayMove 12s linear infinite;
      }

      .light-ray-1 {
        left: 20%;
        animation-delay: 0s;
      }

      .light-ray-2 {
        left: 60%;
        animation-delay: 4s;
      }

      .light-ray-3 {
        left: 80%;
        animation-delay: 8s;
      }

      @keyframes lightRayMove {
        0% {
          transform: translateX(-100px) rotate(45deg);
          opacity: 0;
        }
        10%, 90% {
          opacity: 1;
        }
        100% {
          transform: translateX(100px) rotate(45deg);
          opacity: 0;
        }
      }
    `);

    document.body.appendChild(lightRayContainer);
    this.animationElements.set('light-rays', lightRayContainer);
  }

  /**
   * Particle system for different themes
   */
  private createParticleSystem(type: 'stars' | 'leaves'): void {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-system';

    const particleCount = type === 'stars' ? 50 : 30;
    const particleClass = type === 'stars' ? 'star-particle' : 'leaf-particle';

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = particleClass;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particle.style.animationDuration = `${8 + Math.random() * 4}s`;
      particleContainer.appendChild(particle);
    }

    if (type === 'stars') {
      this.injectStyles(`
        .particle-system {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }

        .star-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #ffffff;
          border-radius: 50%;
          animation: starTwinkle 8s ease-in-out infinite;
          box-shadow: 0 0 6px #ffffff;
        }

        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `);
    } else {
      this.injectStyles(`
        .particle-system {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
          overflow: hidden;
        }

        .leaf-particle {
          position: absolute;
          width: 8px;
          height: 12px;
          background: radial-gradient(ellipse at center, #22c55e 0%, #15803d 100%);
          border-radius: 0 100% 0 100%;
          animation: leafFall 12s linear infinite;
          opacity: 0.7;
        }

        @keyframes leafFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `);
    }

    document.body.appendChild(particleContainer);
    this.animationElements.set(`particles-${type}`, particleContainer);
  }

  /**
   * Galaxy background for cosmos theme
   */
  private createGalaxyBackground(): void {
    const galaxyContainer = document.createElement('div');
    galaxyContainer.className = 'galaxy-background';
    galaxyContainer.innerHTML = `
      <div class="galaxy-spiral"></div>
      <div class="galaxy-core"></div>
    `;

    this.injectStyles(`
      .galaxy-background {
        position: fixed;
        top: 50%;
        left: 50%;
        width: 200%;
        height: 200%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: -2;
        opacity: 0.3;
      }

      .galaxy-spiral {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.1), transparent, rgba(139, 92, 246, 0.1), transparent);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: galaxyRotate 60s linear infinite;
      }

      .galaxy-core {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: galaxyPulse 4s ease-in-out infinite;
      }

      @keyframes galaxyRotate {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      @keyframes galaxyPulse {
        0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
      }
    `);

    document.body.appendChild(galaxyContainer);
    this.animationElements.set('galaxy', galaxyContainer);
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(css: string): void {
    const styleId = 'premium-theme-animations';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent += css;
  }

  /**
   * Clean up all animations
   */
  cleanup(): void {
    // Remove animation elements
    this.animationElements.forEach(element => {
      element.remove();
    });
    this.animationElements.clear();

    // Cancel active animations
    this.activeAnimations.forEach(animation => {
      animation.cancel();
    });
    this.activeAnimations.clear();

    // Disconnect observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Remove injected styles
    const styleElement = document.getElementById('premium-theme-animations');
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Enable/disable animations based on user preference
   */
  setAnimationsEnabled(enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.style.removeProperty('--animation-duration-multiplier');
    } else {
      root.style.setProperty('--animation-duration-multiplier', '0');
    }
  }

  /**
   * Apply animation intensity
   */
  setAnimationIntensity(
    intensity: 'subtle' | 'moderate' | 'dynamic' | 'dramatic'
  ): void {
    const root = document.documentElement;
    const intensityMap = {
      subtle: '0.5',
      moderate: '1',
      dynamic: '1.5',
      dramatic: '2',
    };

    root.style.setProperty('--animation-intensity', intensityMap[intensity]);
  }

  /**
   * Get default animation effects for each premium theme
   */
  static getDefaultEffects(theme: string): PremiumAnimationEffects {
    switch (theme) {
      case 'ocean-breeze':
        return {
          backgroundWave: true,
          cardFloating: true,
          hoverRipple: true,
          scrollParallax: true,
          buttonPulse: false,
          iconRotation: false,
          textShimmer: false,
          colorShifting: false,
          lightRay: false,
          galaxyBackground: false,
          backgroundParticles: false,
          backgroundMorphing: false,
          liquidMotion: false,
          clickWave: false,
          mouseGlow: false,
        };

      case 'sunset-glow':
        return {
          colorShifting: true,
          lightRay: true,
          buttonPulse: true,
          textShimmer: true,
          backgroundWave: false,
          cardFloating: false,
          hoverRipple: true,
          scrollParallax: false,
          iconRotation: false,
          galaxyBackground: false,
          backgroundParticles: false,
          backgroundMorphing: false,
          liquidMotion: false,
          clickWave: false,
          mouseGlow: false,
        };

      case 'forest-dream':
        return {
          backgroundParticles: true,
          iconRotation: true,
          liquidMotion: true,
          mouseGlow: true,
          cardFloating: true,
          hoverRipple: false,
          backgroundWave: false,
          buttonPulse: false,
          textShimmer: false,
          colorShifting: false,
          lightRay: false,
          galaxyBackground: false,
          backgroundMorphing: false,
          scrollParallax: false,
          clickWave: false,
        };

      case 'midnight-cosmos':
        return {
          galaxyBackground: true,
          backgroundParticles: true,
          backgroundMorphing: true,
          clickWave: true,
          buttonPulse: true,
          cardFloating: false,
          hoverRipple: false,
          backgroundWave: false,
          iconRotation: false,
          textShimmer: false,
          colorShifting: false,
          lightRay: false,
          liquidMotion: false,
          scrollParallax: false,
          mouseGlow: false,
        };

      default:
        return {};
    }
  }
}

export default PremiumThemeAnimationService;
