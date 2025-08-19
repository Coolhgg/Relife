import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WAV file encoder (reused from main script)
function encodeWAV(samples, sampleRate = 44100, numChannels = 1, bitDepth = 16) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  return buffer;
}

// NATURE THEME SOUNDS
const generateNatureClick = (duration = 0.08) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 40);
    // Wood tap sound
    let sample = Math.sin(2 * Math.PI * 800 * time) * envelope * 0.2;
    sample += Math.sin(2 * Math.PI * 1200 * time) * envelope * 0.1;
    // Add slight organic noise
    sample += (Math.random() - 0.5) * 0.05 * envelope;
    samples.push(sample);
  }
  return samples;
};

const generateNatureSuccess = (duration = 0.7) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Wind chime progression
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C major ascending
    let sample = 0;
    for (let j = 0; j < frequencies.length; j++) {
      const delay = j * 0.1;
      if (time >= delay) {
        const adjustedTime = time - delay;
        const envelope = Math.exp(-adjustedTime * 2.5);
        sample += Math.sin(2 * Math.PI * frequencies[j] * adjustedTime) * envelope * 0.15;
        // Add harmonics for bell-like sound
        sample += Math.sin(2 * Math.PI * frequencies[j] * 2 * adjustedTime) * envelope * 0.05;
      }
    }
    samples.push(sample);
  }
  return samples;
};

// ELECTRONIC THEME SOUNDS
const generateElectronicClick = (duration = 0.05) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 80);
    // Sharp digital click
    let sample = Math.sign(Math.sin(2 * Math.PI * 2000 * time)) * envelope * 0.4;
    // Add bit-crush effect
    sample = Math.round(sample * 8) / 8;
    samples.push(sample);
  }
  return samples;
};

const generateElectronicSuccess = (duration = 0.6) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Digital arpeggio with saw waves
    const baseFreq = 440;
    const notes = [1, 1.25, 1.5, 2]; // Ascending intervals
    let sample = 0;
    for (let j = 0; j < notes.length; j++) {
      const noteTime = (time * 8) % 1;
      const noteIndex = Math.floor(time * 8) % notes.length;
      if (j === noteIndex) {
        const freq = baseFreq * notes[j];
        const envelope = Math.max(0, 1 - noteTime) * Math.exp(-time);
        // Saw wave
        sample += ((freq * noteTime) % 1 - 0.5) * envelope * 0.3;
      }
    }
    samples.push(sample);
  }
  return samples;
};

// RETRO THEME SOUNDS
const generateRetroClick = (duration = 0.1) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 25);
    // 8-bit style click
    let sample = Math.sign(Math.sin(2 * Math.PI * 1000 * time)) * envelope * 0.3;
    // Quantize to simulate 8-bit
    sample = Math.round(sample * 32) / 32;
    samples.push(sample);
  }
  return samples;
};

const generateRetroSuccess = (duration = 0.8) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Classic video game power-up sound
    let sample = 0;
    const envelope = Math.exp(-time * 2);
    // Main melody (ascending)
    const freq = 440 * Math.pow(2, time * 2);
    sample += Math.sin(2 * Math.PI * freq * time) * envelope * 0.4;
    // Add square wave harmonics
    for (let h = 3; h <= 7; h += 2) {
      sample += Math.sign(Math.sin(2 * Math.PI * freq * h * time)) * envelope * (0.1 / h);
    }
    // 8-bit quantization
    sample = Math.round(sample * 64) / 64;
    samples.push(sample);
  }
  return samples;
};

// MINIMAL THEME SOUNDS
const generateMinimalClick = (duration = 0.03) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 120);
    // Very subtle sine wave
    let sample = Math.sin(2 * Math.PI * 800 * time) * envelope * 0.1;
    samples.push(sample);
  }
  return samples;
};

const generateMinimalSuccess = (duration = 0.3) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Gentle ascending tone
    const freq = 440 + (time * 200);
    const envelope = Math.exp(-time * 5);
    let sample = Math.sin(2 * Math.PI * freq * time) * envelope * 0.08;
    samples.push(sample);
  }
  return samples;
};

// CYBERPUNK THEME SOUNDS
const generateCyberpunkClick = (duration = 0.08) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 60);
    // Harsh digital glitch
    let sample = Math.sign(Math.sin(2 * Math.PI * 1500 * time)) * envelope * 0.5;
    // Add noise and distortion
    sample += (Math.random() - 0.5) * 0.3 * envelope;
    // Bit crush effect
    sample = Math.round(sample * 4) / 4;
    samples.push(sample);
  }
  return samples;
};

const generateCyberpunkSuccess = (duration = 0.8) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Dark ascending arpeggio
    const frequencies = [130.81, 146.83, 164.81, 196.00]; // C3 to G3
    let sample = 0;
    for (let j = 0; j < frequencies.length; j++) {
      const noteTime = (time * 6) % 1;
      const noteIndex = Math.floor(time * 6) % frequencies.length;
      if (j === noteIndex) {
        const freq = frequencies[j];
        const envelope = Math.exp(-noteTime * 3) * Math.exp(-time * 0.8);
        // Harsh square wave with distortion
        sample += Math.sign(Math.sin(2 * Math.PI * freq * time)) * envelope * 0.4;
        sample += Math.sign(Math.sin(2 * Math.PI * freq * 2 * time)) * envelope * 0.1;
      }
    }
    samples.push(sample);
  }
  return samples;
};

// FANTASY THEME SOUNDS
const generateFantasyClick = (duration = 0.1) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 20);
    // Magical sparkle effect
    let sample = Math.sin(2 * Math.PI * 1200 * time) * envelope * 0.3;
    sample += Math.sin(2 * Math.PI * 2400 * time) * envelope * 0.15;
    sample += Math.sin(2 * Math.PI * 3600 * time) * envelope * 0.08;
    // Add shimmer with modulation
    sample *= (1 + Math.sin(2 * Math.PI * 15 * time) * 0.2);
    samples.push(sample);
  }
  return samples;
};

const generateFantasySuccess = (duration = 1.0) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Magical ascending sequence
    const frequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major pentatonic
    let sample = 0;
    for (let j = 0; j < frequencies.length; j++) {
      const delay = j * 0.15;
      if (time >= delay) {
        const adjustedTime = time - delay;
        const envelope = Math.exp(-adjustedTime * 1.5);
        // Bell-like harmonic structure
        sample += Math.sin(2 * Math.PI * frequencies[j] * adjustedTime) * envelope * 0.2;
        sample += Math.sin(2 * Math.PI * frequencies[j] * 2.5 * adjustedTime) * envelope * 0.1;
        sample += Math.sin(2 * Math.PI * frequencies[j] * 4 * adjustedTime) * envelope * 0.05;
      }
    }
    // Add ethereal reverb simulation
    sample *= (1 + Math.sin(2 * Math.PI * 3 * time) * 0.1);
    samples.push(sample);
  }
  return samples;
};

// HORROR THEME SOUNDS
const generateHorrorClick = (duration = 0.12) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 15);
    // Dissonant, unsettling tone
    let sample = Math.sin(2 * Math.PI * 666 * time) * envelope * 0.3;
    sample += Math.sin(2 * Math.PI * 667.5 * time) * envelope * 0.3; // Beating effect
    // Add creepy noise
    sample += (Math.random() - 0.5) * 0.2 * envelope;
    samples.push(sample);
  }
  return samples;
};

const generateHorrorSuccess = (duration = 1.2) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Ominous drone with dissonant overtones
    let sample = Math.sin(2 * Math.PI * 110 * time) * 0.3; // Low A
    sample += Math.sin(2 * Math.PI * 116.5 * time) * 0.2; // Slightly detuned
    sample += Math.sin(2 * Math.PI * 220 * time) * 0.1; // Octave
    // Add slow tremolo for unease
    sample *= (1 + Math.sin(2 * Math.PI * 1.5 * time) * 0.3);
    // Slow fade with eerie sustain
    const envelope = Math.exp(-time * 0.8);
    sample *= envelope;
    samples.push(sample);
  }
  return samples;
};

// CLASSICAL THEME SOUNDS
const generateClassicalClick = (duration = 0.06) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 40);
    // Refined harpsichord-like pluck
    let sample = Math.sin(2 * Math.PI * 880 * time) * envelope * 0.3;
    sample += Math.sin(2 * Math.PI * 1760 * time) * envelope * 0.15;
    sample += Math.sin(2 * Math.PI * 2640 * time) * envelope * 0.08;
    samples.push(sample);
  }
  return samples;
};

const generateClassicalSuccess = (duration = 1.5) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Classical cadence progression
    const chord1 = [523.25, 659.25, 783.99]; // C major
    const chord2 = [587.33, 739.99, 880.00]; // D minor
    const chord3 = [659.25, 783.99, 987.77]; // E minor
    const chord4 = [523.25, 659.25, 783.99]; // C major
    
    let sample = 0;
    const chordDuration = 0.375; // Each chord lasts 0.375s
    const chordIndex = Math.floor(time / chordDuration);
    const chordTime = time % chordDuration;
    
    let currentChord;
    if (chordIndex === 0) currentChord = chord1;
    else if (chordIndex === 1) currentChord = chord2;
    else if (chordIndex === 2) currentChord = chord3;
    else currentChord = chord4;
    
    const envelope = Math.exp(-chordTime * 2) * Math.exp(-time * 0.3);
    
    for (const freq of currentChord) {
      sample += Math.sin(2 * Math.PI * freq * time) * envelope * 0.15;
    }
    
    samples.push(sample);
  }
  return samples;
};

// LOFI THEME SOUNDS
const generateLofiClick = (duration = 0.08) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 25);
    // Warm, muffled click
    let sample = Math.sin(2 * Math.PI * 600 * time) * envelope * 0.2;
    sample += Math.sin(2 * Math.PI * 300 * time) * envelope * 0.1;
    // Add vinyl crackle
    sample += (Math.random() - 0.5) * 0.03 * envelope;
    // Low-pass filter simulation (reduce high frequencies)
    if (i > 0) {
      sample = sample * 0.7 + samples[i-1] * 0.3;
    }
    samples.push(sample);
  }
  return samples;
};

const generateLofiSuccess = (duration = 0.9) => {
  const samples = [];
  const sampleRate = 44100;
  const totalSamples = Math.floor(duration * sampleRate);
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    // Chill jazz chord progression
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major 7th arpeggio
    let sample = 0;
    
    for (let j = 0; j < frequencies.length; j++) {
      const delay = j * 0.15;
      if (time >= delay) {
        const adjustedTime = time - delay;
        const envelope = Math.exp(-adjustedTime * 1.8);
        // Warm sine waves
        sample += Math.sin(2 * Math.PI * frequencies[j] * adjustedTime) * envelope * 0.2;
      }
    }
    
    // Add tape saturation and vinyl noise
    sample = Math.tanh(sample * 1.5); // Soft saturation
    sample += (Math.random() - 0.5) * 0.02; // Vinyl noise
    
    // Low-pass filter for warmth
    if (i > 0) {
      sample = sample * 0.8 + samples[i-1] * 0.2;
    }
    
    samples.push(sample);
  }
  return samples;
};

// Generate all theme packs
async function generateThemePacks() {
  const soundsDir = path.join(__dirname, '..', 'public', 'sounds', 'themes');
  
  const themes = [
    {
      name: 'nature',
      sounds: {
        'ui/click.wav': generateNatureClick,
        'ui/success.wav': generateNatureSuccess,
        'ui/hover.wav': () => generateNatureClick(0.05),
        'ui/error.wav': () => generateNatureClick(0.3)
      }
    },
    {
      name: 'electronic', 
      sounds: {
        'ui/click.wav': generateElectronicClick,
        'ui/success.wav': generateElectronicSuccess,
        'ui/hover.wav': () => generateElectronicClick(0.03),
        'ui/error.wav': () => generateElectronicClick(0.4)
      }
    },
    {
      name: 'retro',
      sounds: {
        'ui/click.wav': generateRetroClick,
        'ui/success.wav': generateRetroSuccess,
        'ui/hover.wav': () => generateRetroClick(0.08),
        'ui/error.wav': () => generateRetroClick(0.35)
      }
    },
    {
      name: 'minimal',
      sounds: {
        'ui/click.wav': generateMinimalClick,
        'ui/success.wav': generateMinimalSuccess,
        'ui/hover.wav': () => generateMinimalClick(0.02),
        'ui/error.wav': () => generateMinimalClick(0.15)
      }
    },
    {
      name: 'cyberpunk',
      sounds: {
        'ui/click.wav': generateCyberpunkClick,
        'ui/success.wav': generateCyberpunkSuccess,
        'ui/hover.wav': () => generateCyberpunkClick(0.05),
        'ui/error.wav': () => generateCyberpunkClick(0.25)
      }
    },
    {
      name: 'fantasy',
      sounds: {
        'ui/click.wav': generateFantasyClick,
        'ui/success.wav': generateFantasySuccess,
        'ui/hover.wav': () => generateFantasyClick(0.08),
        'ui/error.wav': () => generateFantasyClick(0.2)
      }
    },
    {
      name: 'horror',
      sounds: {
        'ui/click.wav': generateHorrorClick,
        'ui/success.wav': generateHorrorSuccess,
        'ui/hover.wav': () => generateHorrorClick(0.08),
        'ui/error.wav': () => generateHorrorClick(0.3)
      }
    },
    {
      name: 'classical',
      sounds: {
        'ui/click.wav': generateClassicalClick,
        'ui/success.wav': generateClassicalSuccess,
        'ui/hover.wav': () => generateClassicalClick(0.04),
        'ui/error.wav': () => generateClassicalClick(0.2)
      }
    },
    {
      name: 'lofi',
      sounds: {
        'ui/click.wav': generateLofiClick,
        'ui/success.wav': generateLofiSuccess,
        'ui/hover.wav': () => generateLofiClick(0.06),
        'ui/error.wav': () => generateLofiClick(0.25)
      }
    }
  ];

  console.log('🎨 Generating themed sound packs...');

  for (const theme of themes) {
    console.log(`Generating ${theme.name} theme:`);
    const themeDir = path.join(soundsDir, theme.name);

    for (const [soundPath, generator] of Object.entries(theme.sounds)) {
      console.log(`  - ${soundPath}`);
      const samples = generator();
      const wavBuffer = encodeWAV(samples);
      const fullPath = path.join(themeDir, soundPath);
      fs.writeFileSync(fullPath, Buffer.from(wavBuffer));
    }
  }

  console.log('\n✅ All theme sound packs generated successfully!');
  console.log('\n🎵 Available themes:');
  themes.forEach(theme => {
    console.log(`  - ${theme.name}`);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateThemePacks().catch(console.error);
}

export { generateThemePacks };