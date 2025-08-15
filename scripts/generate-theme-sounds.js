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
    }
  ];

  console.log('🎨 Generating themed sound packs...');

  for (const theme of themes) {
    console.log(`\nGenerating ${theme.name} theme:`);
    const themeDir = path.join(soundsDir, theme.name);

    for (const [soundPath, generator] of Object.entries(theme.sounds)) {
      console.log(`  - ${soundPath}`);
      const samples = generator();
      const wavBuffer = encodeWAV(samples);
      const fullPath = path.join(themeDir, soundPath);
      fs.writeFileSync(fullPath, Buffer.from(wavBuffer));
    }
  }

  console.log('\n✅ Theme sound packs generated successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateThemePacks().catch(console.error);
}

export { generateThemePacks };