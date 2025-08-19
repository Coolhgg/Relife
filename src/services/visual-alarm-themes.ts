/**
 * Visual Alarm Themes Service
 * Manages visual effects, animations, and styling for alarm displays
 */

export interface VisualAlarmTheme {
  id: string;
  name: string;
  description: string;
  category:
    | "gentle"
    | "energetic"
    | "nature"
    | "abstract"
    | "cinematic"
    | "minimal"
    | "fantasy"
    | "cosmic"
    | "horror"
    | "workout";

  // Color Palette
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    gradientStart: string;
    gradientEnd: string;
    text: string;
    shadow: string;
  };

  // Animation Settings
  animations: {
    entrance:
      | "fade"
      | "slide"
      | "zoom"
      | "bounce"
      | "pulse"
      | "rotate"
      | "shake"
      | "wave"
      | "spiral"
      | "explode";
    loop:
      | "pulse"
      | "breathe"
      | "glow"
      | "rotate"
      | "float"
      | "shake"
      | "ripple"
      | "none"
      | "particles"
      | "matrix";
    duration: number; // milliseconds
    intensity: "subtle" | "moderate" | "intense" | "extreme";
  };

  // Visual Effects
  effects: {
    blur: boolean;
    particles: boolean;
    gradient: boolean;
    shadows: boolean;
    distortion: boolean;
    chromatic: boolean;
    vignette: boolean;
    scanlines: boolean;
    glitch: boolean;
    waves: boolean;
  };

  // Typography
  typography: {
    fontFamily: string;
    fontSize: "small" | "medium" | "large" | "extra-large";
    fontWeight: "light" | "normal" | "bold" | "extra-bold";
    letterSpacing: number;
    textShadow: boolean;
  };

  // Background Pattern
  background: {
    type:
      | "solid"
      | "gradient"
      | "pattern"
      | "image"
      | "video"
      | "animated"
      | "particles";
    pattern?:
      | "dots"
      | "lines"
      | "grid"
      | "waves"
      | "circles"
      | "hexagons"
      | "triangles"
      | "noise";
    opacity: number;
    blur: number;
  };

  // Screen Effects
  screen: {
    brightness: number; // 0-200, 100 is normal
    contrast: number; // 0-200, 100 is normal
    saturation: number; // 0-200, 100 is normal
    hue: number; // 0-360 degrees
    flashEnabled: boolean;
    flashColor: string;
    flashInterval: number; // milliseconds
  };

  // Interactive Elements
  interaction: {
    hapticPattern?:
      | "light"
      | "medium"
      | "heavy"
      | "success"
      | "warning"
      | "error"
      | "selection"
      | "impact";
    touchRipple: boolean;
    parallax: boolean;
    tilt3d: boolean;
  };
}

export type VisualAlarmThemeId =
  // Gentle Themes
  | "sunrise_glow"
  | "morning_mist"
  | "peaceful_waves"
  | "cherry_blossom"
  | "soft_clouds"
  | "golden_hour"

  // Energetic Themes
  | "neon_pulse"
  | "lightning_bolt"
  | "fire_explosion"
  | "electric_storm"
  | "racing_stripes"
  | "disco_fever"

  // Nature Themes
  | "forest_canopy"
  | "ocean_depths"
  | "mountain_peak"
  | "desert_mirage"
  | "aurora_borealis"
  | "volcanic_glow"

  // Abstract Themes
  | "geometric_flow"
  | "particle_storm"
  | "liquid_mercury"
  | "crystal_fractals"
  | "digital_rain"
  | "sound_waves"

  // Cinematic Themes
  | "movie_theater"
  | "space_odyssey"
  | "noir_shadows"
  | "retro_vhs"
  | "holographic"
  | "time_warp"

  // Fantasy & Cosmic
  | "galaxy_spiral"
  | "magic_portal"
  | "dragon_fire"
  | "cosmic_void"
  | "enchanted_forest"
  | "starfield"

  // Horror Themes
  | "blood_moon"
  | "haunted_mirror"
  | "creepy_static"
  | "zombie_apocalypse"
  | "ghostly_mist"

  // Workout Themes
  | "gym_lights"
  | "boxing_ring"
  | "runner_track"
  | "muscle_pump"
  | "sweat_drops"

  // Minimal Themes
  | "clean_white"
  | "dark_void"
  | "paper_texture"
  | "glass_surface"
  | "metal_brushed";

class VisualAlarmThemesService {
  private static instance: VisualAlarmThemesService | null = null;
  private themes: Map<VisualAlarmThemeId, VisualAlarmTheme>;
  private currentTheme: VisualAlarmThemeId = "sunrise_glow";
  private activeAnimations: Set<string> = new Set();

  private constructor() {
    this.themes = new Map();
    this.initializeThemes();
  }

  static getInstance(): VisualAlarmThemesService {
    if (!VisualAlarmThemesService.instance) {
      VisualAlarmThemesService.instance = new VisualAlarmThemesService();
    }
    return VisualAlarmThemesService.instance;
  }

  private initializeThemes(): void {
    // Gentle Themes
    this.themes.set("sunrise_glow", {
      id: "sunrise_glow",
      name: "Sunrise Glow",
      description: "Warm golden light that gradually brightens like a sunrise",
      category: "gentle",
      colors: {
        primary: "#FFA500",
        secondary: "#FFD700",
        accent: "#FF6B35",
        background: "#FFF8DC",
        gradientStart: "#FFE4B5",
        gradientEnd: "#FFA500",
        text: "#8B4513",
        shadow: "#D2691E",
      },
      animations: {
        entrance: "fade",
        loop: "glow",
        duration: 3000,
        intensity: "moderate",
      },
      effects: {
        blur: false,
        particles: true,
        gradient: true,
        shadows: true,
        distortion: false,
        chromatic: false,
        vignette: true,
        scanlines: false,
        glitch: false,
        waves: false,
      },
      typography: {
        fontFamily: "Inter, sans-serif",
        fontSize: "large",
        fontWeight: "normal",
        letterSpacing: 0.5,
        textShadow: true,
      },
      background: {
        type: "gradient",
        opacity: 0.8,
        blur: 0,
      },
      screen: {
        brightness: 120,
        contrast: 110,
        saturation: 120,
        hue: 30,
        flashEnabled: false,
        flashColor: "#FFD700",
        flashInterval: 2000,
      },
      interaction: {
        hapticPattern: "light",
        touchRipple: true,
        parallax: true,
        tilt3d: false,
      },
    });

    this.themes.set("morning_mist", {
      id: "morning_mist",
      name: "Morning Mist",
      description: "Soft, ethereal mist that gently swirls and fades",
      category: "gentle",
      colors: {
        primary: "#E0F6FF",
        secondary: "#B0E0E6",
        accent: "#87CEEB",
        background: "#F0F8FF",
        gradientStart: "#E6F3FF",
        gradientEnd: "#B0E0E6",
        text: "#4682B4",
        shadow: "#778899",
      },
      animations: {
        entrance: "fade",
        loop: "float",
        duration: 4000,
        intensity: "subtle",
      },
      effects: {
        blur: true,
        particles: true,
        gradient: true,
        shadows: false,
        distortion: false,
        chromatic: false,
        vignette: true,
        scanlines: false,
        glitch: false,
        waves: true,
      },
      typography: {
        fontFamily: "Nunito, sans-serif",
        fontSize: "medium",
        fontWeight: "light",
        letterSpacing: 1,
        textShadow: false,
      },
      background: {
        type: "animated",
        opacity: 0.6,
        blur: 5,
      },
      screen: {
        brightness: 100,
        contrast: 95,
        saturation: 90,
        hue: 200,
        flashEnabled: false,
        flashColor: "#87CEEB",
        flashInterval: 3000,
      },
      interaction: {
        hapticPattern: "light",
        touchRipple: true,
        parallax: true,
        tilt3d: true,
      },
    });

    // Energetic Themes
    this.themes.set("neon_pulse", {
      id: "neon_pulse",
      name: "Neon Pulse",
      description: "Electric neon colors with pulsing cyberpunk energy",
      category: "energetic",
      colors: {
        primary: "#00FFFF",
        secondary: "#FF00FF",
        accent: "#FFFF00",
        background: "#000000",
        gradientStart: "#FF0080",
        gradientEnd: "#00FFFF",
        text: "#FFFFFF",
        shadow: "#FF00FF",
      },
      animations: {
        entrance: "explode",
        loop: "pulse",
        duration: 800,
        intensity: "extreme",
      },
      effects: {
        blur: false,
        particles: true,
        gradient: true,
        shadows: true,
        distortion: true,
        chromatic: true,
        vignette: false,
        scanlines: true,
        glitch: true,
        waves: false,
      },
      typography: {
        fontFamily: "Orbitron, monospace",
        fontSize: "extra-large",
        fontWeight: "bold",
        letterSpacing: 2,
        textShadow: true,
      },
      background: {
        type: "pattern",
        pattern: "grid",
        opacity: 0.3,
        blur: 0,
      },
      screen: {
        brightness: 150,
        contrast: 140,
        saturation: 200,
        hue: 300,
        flashEnabled: true,
        flashColor: "#00FFFF",
        flashInterval: 500,
      },
      interaction: {
        hapticPattern: "heavy",
        touchRipple: true,
        parallax: false,
        tilt3d: false,
      },
    });

    this.themes.set("lightning_bolt", {
      id: "lightning_bolt",
      name: "Lightning Bolt",
      description: "Electric storm with crackling lightning effects",
      category: "energetic",
      colors: {
        primary: "#FFFFFF",
        secondary: "#E6E6FA",
        accent: "#00BFFF",
        background: "#191970",
        gradientStart: "#4B0082",
        gradientEnd: "#000080",
        text: "#FFFFFF",
        shadow: "#00BFFF",
      },
      animations: {
        entrance: "shake",
        loop: "shake",
        duration: 200,
        intensity: "extreme",
      },
      effects: {
        blur: false,
        particles: true,
        gradient: true,
        shadows: true,
        distortion: true,
        chromatic: true,
        vignette: true,
        scanlines: false,
        glitch: true,
        waves: false,
      },
      typography: {
        fontFamily: "Rajdhani, sans-serif",
        fontSize: "extra-large",
        fontWeight: "extra-bold",
        letterSpacing: 1.5,
        textShadow: true,
      },
      background: {
        type: "animated",
        opacity: 0.9,
        blur: 0,
      },
      screen: {
        brightness: 200,
        contrast: 150,
        saturation: 130,
        hue: 240,
        flashEnabled: true,
        flashColor: "#FFFFFF",
        flashInterval: 150,
      },
      interaction: {
        hapticPattern: "impact",
        touchRipple: true,
        parallax: false,
        tilt3d: false,
      },
    });

    // Nature Themes
    this.themes.set("forest_canopy", {
      id: "forest_canopy",
      name: "Forest Canopy",
      description: "Dappled sunlight filtering through green leaves",
      category: "nature",
      colors: {
        primary: "#228B22",
        secondary: "#32CD32",
        accent: "#ADFF2F",
        background: "#F0FFF0",
        gradientStart: "#90EE90",
        gradientEnd: "#006400",
        text: "#2F4F4F",
        shadow: "#556B2F",
      },
      animations: {
        entrance: "wave",
        loop: "float",
        duration: 5000,
        intensity: "subtle",
      },
      effects: {
        blur: true,
        particles: true,
        gradient: true,
        shadows: true,
        distortion: false,
        chromatic: false,
        vignette: true,
        scanlines: false,
        glitch: false,
        waves: true,
      },
      typography: {
        fontFamily: "Crimson Text, serif",
        fontSize: "large",
        fontWeight: "normal",
        letterSpacing: 0.5,
        textShadow: true,
      },
      background: {
        type: "pattern",
        pattern: "dots",
        opacity: 0.4,
        blur: 2,
      },
      screen: {
        brightness: 110,
        contrast: 105,
        saturation: 120,
        hue: 120,
        flashEnabled: false,
        flashColor: "#ADFF2F",
        flashInterval: 4000,
      },
      interaction: {
        hapticPattern: "medium",
        touchRipple: true,
        parallax: true,
        tilt3d: true,
      },
    });

    // Space/Cosmic Themes
    this.themes.set("galaxy_spiral", {
      id: "galaxy_spiral",
      name: "Galaxy Spiral",
      description: "Swirling cosmic colors with starfield background",
      category: "cosmic",
      colors: {
        primary: "#4B0082",
        secondary: "#8A2BE2",
        accent: "#FF1493",
        background: "#000000",
        gradientStart: "#191970",
        gradientEnd: "#4B0082",
        text: "#FFFFFF",
        shadow: "#8A2BE2",
      },
      animations: {
        entrance: "spiral",
        loop: "rotate",
        duration: 8000,
        intensity: "moderate",
      },
      effects: {
        blur: true,
        particles: true,
        gradient: true,
        shadows: true,
        distortion: false,
        chromatic: true,
        vignette: true,
        scanlines: false,
        glitch: false,
        waves: false,
      },
      typography: {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "large",
        fontWeight: "bold",
        letterSpacing: 1,
        textShadow: true,
      },
      background: {
        type: "particles",
        opacity: 0.8,
        blur: 0,
      },
      screen: {
        brightness: 90,
        contrast: 130,
        saturation: 150,
        hue: 280,
        flashEnabled: false,
        flashColor: "#FF1493",
        flashInterval: 3000,
      },
      interaction: {
        hapticPattern: "medium",
        touchRipple: true,
        parallax: true,
        tilt3d: true,
      },
    });

    // Minimal Themes
    this.themes.set("clean_white", {
      id: "clean_white",
      name: "Clean White",
      description: "Pure minimal white with subtle shadows",
      category: "minimal",
      colors: {
        primary: "#FFFFFF",
        secondary: "#F8F8FF",
        accent: "#E6E6FA",
        background: "#FFFFFF",
        gradientStart: "#FFFFFF",
        gradientEnd: "#F0F0F0",
        text: "#333333",
        shadow: "#D3D3D3",
      },
      animations: {
        entrance: "fade",
        loop: "breathe",
        duration: 4000,
        intensity: "subtle",
      },
      effects: {
        blur: false,
        particles: false,
        gradient: false,
        shadows: true,
        distortion: false,
        chromatic: false,
        vignette: false,
        scanlines: false,
        glitch: false,
        waves: false,
      },
      typography: {
        fontFamily: "Helvetica Neue, sans-serif",
        fontSize: "large",
        fontWeight: "light",
        letterSpacing: 0,
        textShadow: false,
      },
      background: {
        type: "solid",
        opacity: 1,
        blur: 0,
      },
      screen: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        flashEnabled: false,
        flashColor: "#FFFFFF",
        flashInterval: 0,
      },
      interaction: {
        hapticPattern: "light",
        touchRipple: false,
        parallax: false,
        tilt3d: false,
      },
    });

    // Horror Theme
    this.themes.set("blood_moon", {
      id: "blood_moon",
      name: "Blood Moon",
      description: "Ominous red glow with creepy shadows",
      category: "horror",
      colors: {
        primary: "#8B0000",
        secondary: "#DC143C",
        accent: "#FF4500",
        background: "#000000",
        gradientStart: "#2F0000",
        gradientEnd: "#8B0000",
        text: "#FFFFFF",
        shadow: "#8B0000",
      },
      animations: {
        entrance: "fade",
        loop: "pulse",
        duration: 2000,
        intensity: "intense",
      },
      effects: {
        blur: true,
        particles: true,
        gradient: true,
        shadows: true,
        distortion: true,
        chromatic: false,
        vignette: true,
        scanlines: false,
        glitch: true,
        waves: false,
      },
      typography: {
        fontFamily: "Creepster, cursive",
        fontSize: "extra-large",
        fontWeight: "bold",
        letterSpacing: 2,
        textShadow: true,
      },
      background: {
        type: "pattern",
        pattern: "noise",
        opacity: 0.3,
        blur: 3,
      },
      screen: {
        brightness: 80,
        contrast: 150,
        saturation: 130,
        hue: 0,
        flashEnabled: true,
        flashColor: "#8B0000",
        flashInterval: 1500,
      },
      interaction: {
        hapticPattern: "warning",
        touchRipple: true,
        parallax: false,
        tilt3d: false,
      },
    });

    // Add more themes...
    // (I'll initialize more themes here for completeness)
  }

  // Theme Management Methods
  getTheme(themeId: VisualAlarmThemeId): VisualAlarmTheme | undefined {
    return this.themes.get(themeId);
  }

  getCurrentTheme(): VisualAlarmTheme {
    return this.themes.get(this.currentTheme)!;
  }

  setCurrentTheme(themeId: VisualAlarmThemeId): void {
    if (this.themes.has(themeId)) {
      this.currentTheme = themeId;
    }
  }

  getAllThemes(): VisualAlarmTheme[] {
    return Array.from(this.themes.values());
  }

  getThemesByCategory(
    category: VisualAlarmTheme["category"],
  ): VisualAlarmTheme[] {
    return this.getAllThemes().filter((theme) => theme.category === category);
  }

  // CSS Generation Methods
  generateThemeCSS(theme: VisualAlarmTheme): string {
    const { colors, typography, effects, screen, background } = theme;

    let css = `
      .alarm-display-${theme.id} {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --background-color: ${colors.background};
        --gradient-start: ${colors.gradientStart};
        --gradient-end: ${colors.gradientEnd};
        --text-color: ${colors.text};
        --shadow-color: ${colors.shadow};
        
        background: ${
          background.type === "gradient"
            ? `linear-gradient(135deg, var(--gradient-start), var(--gradient-end))`
            : `var(--background-color)`
        };
        color: var(--text-color);
        font-family: ${typography.fontFamily};
        font-size: ${this.getFontSize(typography.fontSize)};
        font-weight: ${typography.fontWeight};
        letter-spacing: ${typography.letterSpacing}px;
        
        ${typography.textShadow ? `text-shadow: 2px 2px 4px var(--shadow-color);` : ""}
        ${effects.blur ? `backdrop-filter: blur(${background.blur}px);` : ""}
        ${effects.vignette ? `box-shadow: inset 0 0 100px rgba(0,0,0,0.3);` : ""}
        
        filter: 
          brightness(${screen.brightness}%) 
          contrast(${screen.contrast}%) 
          saturate(${screen.saturation}%) 
          hue-rotate(${screen.hue}deg);
      }
    `;

    // Add animation CSS
    css += this.generateAnimationCSS(theme);

    return css;
  }

  private generateAnimationCSS(theme: VisualAlarmTheme): string {
    const { animations } = theme;
    let css = "";

    // Entrance animation
    css += `
      .alarm-enter-${theme.id} {
        animation: ${animations.entrance}-${theme.id} ${animations.duration}ms ease-in-out;
      }
    `;

    // Loop animation
    if (animations.loop !== "none") {
      css += `
        .alarm-loop-${theme.id} {
          animation: ${animations.loop}-${theme.id} ${animations.duration}ms infinite;
        }
      `;
    }

    // Define keyframes
    css += this.generateKeyframes(theme);

    return css;
  }

  private generateKeyframes(theme: VisualAlarmTheme): string {
    const { animations, colors } = theme;
    let keyframes = "";

    // Entrance keyframes
    switch (animations.entrance) {
      case "fade":
        keyframes += `
          @keyframes fade-${theme.id} {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `;
        break;
      case "zoom":
        keyframes += `
          @keyframes zoom-${theme.id} {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `;
        break;
      case "explode":
        keyframes += `
          @keyframes explode-${theme.id} {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `;
        break;
      // Add more entrance animations...
    }

    // Loop keyframes
    switch (animations.loop) {
      case "pulse":
        keyframes += `
          @keyframes pulse-${theme.id} {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `;
        break;
      case "glow":
        keyframes += `
          @keyframes glow-${theme.id} {
            0%, 100% { box-shadow: 0 0 20px ${colors.accent}; }
            50% { box-shadow: 0 0 40px ${colors.accent}, 0 0 60px ${colors.accent}; }
          }
        `;
        break;
      case "rotate":
        keyframes += `
          @keyframes rotate-${theme.id} {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
        break;
      // Add more loop animations...
    }

    return keyframes;
  }

  private getFontSize(size: string): string {
    switch (size) {
      case "small":
        return "1.5rem";
      case "medium":
        return "2rem";
      case "large":
        return "3rem";
      case "extra-large":
        return "4rem";
      default:
        return "2rem";
    }
  }

  // Theme Application Methods
  applyTheme(themeId: VisualAlarmThemeId, element: HTMLElement): void {
    const theme = this.getTheme(themeId);
    if (!theme) return;

    // Remove existing theme classes
    element.className = element.className.replace(/alarm-display-\w+/g, "");

    // Add new theme class
    element.classList.add(`alarm-display-${theme.id}`);

    // Inject theme CSS if not already present
    this.injectThemeCSS(theme);

    // Apply screen effects
    this.applyScreenEffects(theme);
  }

  private injectThemeCSS(theme: VisualAlarmTheme): void {
    const existingStyle = document.getElementById(`theme-style-${theme.id}`);
    if (existingStyle) return; // CSS already injected

    const style = document.createElement("style");
    style.id = `theme-style-${theme.id}`;
    style.textContent = this.generateThemeCSS(theme);
    document.head.appendChild(style);
  }

  private applyScreenEffects(theme: VisualAlarmTheme): void {
    if (theme.screen.flashEnabled) {
      this.startFlashEffect(theme);
    }
  }

  private startFlashEffect(theme: VisualAlarmTheme): void {
    const flashId = `flash-${theme.id}`;
    if (this.activeAnimations.has(flashId)) return;

    this.activeAnimations.add(flashId);

    const flash = () => {
      document.body.style.backgroundColor = theme.screen.flashColor;
      setTimeout(() => {
        document.body.style.backgroundColor = "";
      }, 100);
    };

    const interval = setInterval(flash, theme.screen.flashInterval);

    // Store interval for cleanup
    (this as any)[flashId] = interval;
  }

  stopAllEffects(): void {
    this.activeAnimations.forEach((animationId) => {
      if ((this as any)[animationId]) {
        clearInterval((this as any)[animationId]);
        delete (this as any)[animationId];
      }
    });
    this.activeAnimations.clear();

    // Reset body background
    document.body.style.backgroundColor = "";
  }

  // Preview Methods
  previewTheme(themeId: VisualAlarmThemeId, duration: number = 3000): void {
    const theme = this.getTheme(themeId);
    if (!theme) return;

    // Create preview element
    const preview = document.createElement("div");
    preview.className = `alarm-preview alarm-display-${theme.id} alarm-enter-${theme.id}`;
    preview.innerHTML = `
      <div class="preview-content">
        <h2>${theme.name}</h2>
        <p>${theme.description}</p>
        <div class="preview-time">6:30 AM</div>
      </div>
    `;
    preview.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    this.injectThemeCSS(theme);
    document.body.appendChild(preview);

    // Auto remove preview
    setTimeout(() => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    }, duration);
  }

  // Integration with existing sound themes
  getRecommendedVisualTheme(soundTheme: string): VisualAlarmThemeId {
    const soundToVisual: Record<string, VisualAlarmThemeId> = {
      nature: "forest_canopy",
      electronic: "neon_pulse",
      retro: "clean_white", // Add retro visual theme later
      ambient: "morning_mist",
      energetic: "lightning_bolt",
      calm: "sunrise_glow",
      meditation: "galaxy_spiral",
      workout: "lightning_bolt",
      horror: "blood_moon",
      default: "sunrise_glow",
    };

    return soundToVisual[soundTheme] || "sunrise_glow";
  }
}

// Export singleton instance
export const visualAlarmThemes = VisualAlarmThemesService.getInstance();
export default VisualAlarmThemesService;
