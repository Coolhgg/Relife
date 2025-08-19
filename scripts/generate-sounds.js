#!/usr/bin/env node

/**
 * Sound Generator Script
 * Generates built-in alarm sounds and UI effects using Web Audio API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WAV file encoder utility
function encodeWAV(samples, sampleRate = 44100, numChannels = 1, bitDepth = 16) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
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
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}

// Sound generation functions
function generateGentleBells(duration = 5, sampleRate = 44100) {
  const samples = [];
  const totalSamples = duration * sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;

    // Multiple bell frequencies with decay envelope
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

    for (const freq of frequencies) {
      const envelope = Math.exp(-time * 0.8); // Gentle decay
      sample += Math.sin(2 * Math.PI * freq * time) * envelope * 0.2;

      // Add harmonics for realistic bell sound
      sample += Math.sin(2 * Math.PI * freq * 2 * time) * envelope * 0.1;
      sample += Math.sin(2 * Math.PI * freq * 3 * time) * envelope * 0.05;
    }

    // Subtle vibrato
    sample *= 1 + 0.1 * Math.sin(2 * Math.PI * 5 * time);

    // Fade in/out
    if (time < 0.5) sample *= time / 0.5;
    if (time > duration - 0.5) sample *= (duration - time) / 0.5;

    samples.push(sample);
  }

  return samples;
}

function generateMorningBirds(duration = 8, sampleRate = 44100) {
  const samples = new Array(duration * sampleRate).fill(0);
  const totalSamples = samples.length;

  // Generate multiple bird chirps
  const birdSounds = [
    { freq: 2000, duration: 0.3, interval: 2.0 },
    { freq: 1500, duration: 0.2, interval: 3.5 },
    { freq: 2500, duration: 0.25, interval: 1.8 },
    { freq: 1800, duration: 0.4, interval: 4.0 },
  ];

  for (const bird of birdSounds) {
    let currentTime = Math.random() * 1; // Random start time

    while (currentTime < duration) {
      const startSample = Math.floor(currentTime * sampleRate);
      const chirpDuration = bird.duration + (Math.random() - 0.5) * 0.1;
      const chirpSamples = Math.floor(chirpDuration * sampleRate);

      for (let i = 0; i < chirpSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin(Math.PI * t / chirpDuration);

        // Frequency modulation for realistic chirp
        const freqMod = bird.freq * (1 + 0.3 * Math.sin(2 * Math.PI * 20 * t));

        const sample = Math.sin(2 * Math.PI * freqMod * t) * envelope * 0.15;
        samples[startSample + i] += sample;
      }

      currentTime += bird.interval + (Math.random() - 0.5) * 1;
    }
  }

  // Add subtle background ambiance
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const ambiance = (Math.random() - 0.5) * 0.02; // Gentle noise
    samples[i] += ambiance;

    // Apply overall fade
    if (time < 1) samples[i] *= time;
    if (time > duration - 1) samples[i] *= (duration - time);
  }

  return samples;
}

function generateClassicBeep(duration = 3, sampleRate = 44100) {
  const samples = [];
  const totalSamples = duration * sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;

    // Classic alarm frequency pattern
    const beepFreq = 800;
    const beepDuration = 0.3;
    const gapDuration = 0.4;
    const cycleLength = beepDuration + gapDuration;

    const cycleTime = time % cycleLength;

    if (cycleTime < beepDuration) {
      // Square wave for harsh alarm sound
      sample = Math.sign(Math.sin(2 * Math.PI * beepFreq * time)) * 0.6;

      // Envelope to prevent clicks
      const envelopeTime = cycleTime;
      if (envelopeTime < 0.01) sample *= envelopeTime / 0.01;
      if (envelopeTime > beepDuration - 0.01) {
        sample *= (beepDuration - envelopeTime) / 0.01;
      }
    }

    samples.push(sample);
  }

  return samples;
}

function generateOceanWaves(duration = 10, sampleRate = 44100) {
  const samples = [];
  const totalSamples = duration * sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;

    // Multiple wave frequencies for realistic ocean sound
    const waveFreqs = [0.5, 0.7, 1.1, 1.8];

    for (const freq of waveFreqs) {
      const amplitude = 1 / (freq + 1); // Lower frequencies louder
      sample += Math.sin(2 * Math.PI * freq * time) * amplitude * 0.3;
    }

    // Add filtered noise for foam/splash sounds
    const noise = (Math.random() - 0.5) * 0.1;
    const filteredNoise = noise * Math.sin(2 * Math.PI * 8 * time);
    sample += filteredNoise;

    // Gradual intensity increase
    const intensity = Math.min(1, time / 3);
    sample *= intensity;

    samples.push(sample);
  }

  return samples;
}

function generateEnergeticBeep(duration = 4, sampleRate = 44100) {
  const samples = [];
  const totalSamples = duration * sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;

    // Energetic ascending pattern
    const baseFreq = 400;
    const beepPattern = [1, 1.25, 1.5, 1.75, 2]; // Ascending frequencies
    const beepDuration = 0.15;
    const totalCycleDuration = beepPattern.length * 0.2;

    const cycleTime = time % totalCycleDuration;
    const beepIndex = Math.floor(cycleTime / 0.2);
    const beepTime = cycleTime % 0.2;

    if (beepTime < beepDuration && beepIndex < beepPattern.length) {
      const freq = baseFreq * beepPattern[beepIndex];
      sample = Math.sin(2 * Math.PI * freq * time) * 0.5;

      // Add harmonics for richness
      sample += Math.sin(2 * Math.PI * freq * 2 * time) * 0.2;

      // Envelope
      const env = Math.sin(Math.PI * beepTime / beepDuration);
      sample *= env;
    }

    samples.push(sample);
  }

  return samples;
}

// UI Sound Effects
function generateClickSound(duration = 0.1, sampleRate = 44100) {
  const samples = [];
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 50); // Quick decay

    // Sharp click sound
    let sample = Math.sin(2 * Math.PI * 1200 * time) * envelope * 0.3;
    sample += Math.sin(2 * Math.PI * 2400 * time) * envelope * 0.15;

    samples.push(sample);
  }

  return samples;
}

function generateHoverSound(duration = 0.05, sampleRate = 44100) {
  const samples = [];
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 30);

    // Subtle hover sound
    const sample = Math.sin(2 * Math.PI * 800 * time) * envelope * 0.15;

    samples.push(sample);
  }

  return samples;
}

function generateSuccessSound(duration = 0.5, sampleRate = 44100) {
  const samples = [];
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;

    // Success chord progression
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    let sample = 0;

    for (const freq of frequencies) {
      const envelope = Math.exp(-time * 3);
      sample += Math.sin(2 * Math.PI * freq * time) * envelope * 0.2;
    }

    samples.push(sample);
  }

  return samples;
}

function generateErrorSound(duration = 0.3, sampleRate = 44100) {
  const samples = [];
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const envelope = Math.exp(-time * 8);

    // Dissonant error sound
    let sample = Math.sin(2 * Math.PI * 200 * time) * envelope * 0.4;
    sample += Math.sin(2 * Math.PI * 150 * time) * envelope * 0.3;

    samples.push(sample);
  }

  return samples;
}

function generateNotificationSound(duration = 0.8, sampleRate = 44100) {
  const samples = [];
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;

    // Gentle notification chime
    const frequencies = [880, 1320]; // A5, E6
    let sample = 0;

    for (let j = 0; j < frequencies.length; j++) {
      const delay = j * 0.1;
      if (time >= delay) {
        const adjustedTime = time - delay;
        const envelope = Math.exp(-adjustedTime * 4);
        sample += Math.sin(2 * Math.PI * frequencies[j] * adjustedTime) * envelope * 0.3;
      }
    }

    samples.push(sample);
  }

  return samples;
}

// Main generation function
async function generateAllSounds() {
  const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
  const alarmsDir = path.join(soundsDir, 'alarms');
  const uiDir = path.join(soundsDir, 'ui');
  const notificationsDir = path.join(soundsDir, 'notifications');

  console.log('🔊 Generating sound effects...');

  // Alarm sounds
  const alarmSounds = [
    { name: 'gentle_bells.wav', generator: generateGentleBells, duration: 5 },
    { name: 'morning_birds.wav', generator: generateMorningBirds, duration: 8 },
    { name: 'classic_beep.wav', generator: generateClassicBeep, duration: 3 },
    { name: 'ocean_waves.wav', generator: generateOceanWaves, duration: 10 },
    { name: 'energetic_beep.wav', generator: generateEnergeticBeep, duration: 4 },
  ];

  console.log('Generating alarm sounds...');
  for (const sound of alarmSounds) {
    console.log(`  - ${sound.name}`);
    const samples = sound.generator(sound.duration);
    const wavBuffer = encodeWAV(samples);
    fs.writeFileSync(path.join(alarmsDir, sound.name), Buffer.from(wavBuffer));
  }

  // UI sounds
  const uiSounds = [
    { name: 'click.wav', generator: generateClickSound, duration: 0.1 },
    { name: 'hover.wav', generator: generateHoverSound, duration: 0.05 },
    { name: 'success.wav', generator: generateSuccessSound, duration: 0.5 },
    { name: 'error.wav', generator: generateErrorSound, duration: 0.3 },
  ];

  console.log('Generating UI sounds...');
  for (const sound of uiSounds) {
    console.log(`  - ${sound.name}`);
    const samples = sound.generator(sound.duration);
    const wavBuffer = encodeWAV(samples);
    fs.writeFileSync(path.join(uiDir, sound.name), Buffer.from(wavBuffer));
  }

  // Notification sounds
  const notificationSounds = [
    { name: 'notification.wav', generator: generateNotificationSound, duration: 0.8 },
    { name: 'alarm.wav', generator: () => generateClassicBeep(1), duration: 1 },
    { name: 'beep.wav', generator: () => generateClickSound(0.2), duration: 0.2 },
  ];

  console.log('Generating notification sounds...');
  for (const sound of notificationSounds) {
    console.log(`  - ${sound.name}`);
    const samples = sound.generator(sound.duration);
    const wavBuffer = encodeWAV(samples);
    fs.writeFileSync(path.join(notificationsDir, sound.name), Buffer.from(wavBuffer));
  }

  console.log('✅ All sound effects generated successfully!');
  console.log(`Generated ${alarmSounds.length + uiSounds.length + notificationSounds.length} sound files`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllSounds().catch(console.error);
}

export {
  generateAllSounds,
  encodeWAV,
  generateGentleBells,
  generateMorningBirds,
  generateClassicBeep,
  generateOceanWaves,
  generateEnergeticBeep,
  generateClickSound,
  generateHoverSound,
  generateSuccessSound,
  generateErrorSound,
  generateNotificationSound,
};