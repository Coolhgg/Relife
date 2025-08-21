/// <reference lib="dom" />
import { waitFor, act } from "@testing-library/react";

// Audio element mocking
export const _audioMocks = {
  createMockAudio: (src?: string) => {
    const mockAudio = {
      src: src || '',
      volume: 1,
      currentTime: 0,
      duration: 30,
      paused: true,
      ended: false,
      loop: false,
      muted: false,
      playbackRate: 1,
      ready: true,
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      canPlayType: jest.fn().mockReturnValue('maybe'),
      // Audio element specific properties
      crossOrigin: null,
      preload: 'auto',
      autoplay: false,
      controls: false
    };

    // Mock common event listeners
    const eventListeners: { [key: string]: Function[] } = {};
    mockAudio.addEventListener = jest.fn((event: string, callback: Function) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
    });

    mockAudio.removeEventListener = jest.fn((event: string, callback: Function) => {
      if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(callback);
        if (index > -1) {
          eventListeners[event].splice(index, 1);
        }
      }
    });

    mockAudio.dispatchEvent = jest.fn((event: Event) => {
      if (eventListeners[event.type]) {
        eventListeners[event.type].forEach(callback => callback(event));
      }
    });

    return mockAudio;
  },

  mockGlobalAudio: () => {
    const mockAudio = audioMocks.createMockAudio();

    // Mock Audio constructor
    (global as any).Audio = jest.fn().mockImplementation((src?: string) => {
      const instance = audioMocks.createMockAudio(src);
      return instance;
    });

    // Mock HTMLAudioElement
    Object.defineProperty(global, 'HTMLAudioElement', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockAudio)
    });

    return mockAudio;
  },

  simulateAudioEvents: (audio: any) => ({
    loadStart: () => audio.dispatchEvent(new Event('loadstart')),
    canPlay: () => {
      audio.ready = true;
      audio.dispatchEvent(new Event('canplay'));
    },
    canPlayThrough: () => {
      audio.ready = true;
      audio.dispatchEvent(new Event('canplaythrough'));
    },
    play: async () => {
      audio.paused = false;
      audio.dispatchEvent(new Event('play'));
      await new Promise(resolve => setTimeout(resolve, 10));
      audio.dispatchEvent(new Event('playing'));
    },
    pause: () => {
      audio.paused = true;
      audio.dispatchEvent(new Event('pause'));
    },
    end: () => {
      audio.paused = true;
      audio.ended = true;
      audio.currentTime = audio.duration;
      audio.dispatchEvent(new Event('ended'));
    },
    error: (errorCode: number = 4) => {
      const error = new Error('Audio error');
      (error as any).code = errorCode;
      audio.error = error;
      audio.dispatchEvent(new Event('error'));
    },
    timeUpdate: (currentTime: number) => {
      audio.currentTime = currentTime;
      audio.dispatchEvent(new Event('timeupdate'));
    }
  })
};

// Web Audio API mocking
export const _webAudioMocks = {
  mockAudioContext: () => {
    const mockContext = {
      state: 'running' as AudioContextState,
      sampleRate: 44100,
      currentTime: 0,
      destination: {
        channelCount: 2,
        channelCountMode: 'max',
        channelInterpretation: 'speakers'
      },
      listener: {
        positionX: { value: 0 },
        positionY: { value: 0 },
        positionZ: { value: 0 },
        forwardX: { value: 0 },
        forwardY: { value: 0 },
        forwardZ: { value: -1 },
        upX: { value: 0 },
        upY: { value: 1 },
        upZ: { value: 0 }
      },
      createOscillator: jest.fn().mockReturnValue({
        type: 'sine',
        frequency: { value: 440 },
        detune: { value: 0 },
        start: jest.fn(),
        stop: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }),
      createGain: jest.fn().mockReturnValue({
        gain: { value: 1 },
        connect: jest.fn(),
        disconnect: jest.fn()
      }),
      createBuffer: jest.fn(),
      createBufferSource: jest.fn().mockReturnValue({
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: { value: 1 },
        start: jest.fn(),
        stop: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn()
      }),
      createAnalyser: jest.fn().mockReturnValue({
        fftSize: 2048,
        frequencyBinCount: 1024,
        minDecibels: -100,
        maxDecibels: -30,
        smoothingTimeConstant: 0.8,
        getFloatFrequencyData: jest.fn(),
        getByteFrequencyData: jest.fn(),
        getFloatTimeDomainData: jest.fn(),
        getByteTimeDomainData: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn()
      }),
      decodeAudioData: jest.fn().mockResolvedValue({}),
      resume: jest.fn().mockResolvedValue(undefined),
      suspend: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };

    Object.defineProperty(global, 'AudioContext', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockContext)
    });

    Object.defineProperty(global, 'webkitAudioContext', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockContext)
    });

    return mockContext;
  }
};

// Notification sound testing
export const _notificationMocks = {
  mockNotificationSound: () => {
    const mockNotification = {
      title: 'Test Notification',
      body: 'Test Body',
      icon: '/icon.png',
      tag: 'test',
      silent: false,
      sound: '/notification.mp3',
      vibrate: [200, 100, 200],
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    Object.defineProperty(global, 'Notification', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockNotification)
    });

    Object.defineProperty(Notification, 'permission', {
      writable: true,
      value: 'granted'
    });

    Object.defineProperty(Notification, 'requestPermission', {
      writable: true,
      value: jest.fn().mockResolvedValue('granted')
    });

    return mockNotification;
  }
};

// Volume and audio state utilities
export const _volumeUtils = {
  testVolumeControl: async (
    audioElement: HTMLAudioElement,
    targetVolume: number,
  ) => {
    act(() => {
      audioElement.volume = targetVolume;
    });

    expect(audioElement.volume).toBe(targetVolume);

    // Simulate volume change event
    audioElement.dispatchEvent(new Event('volumechange'));

    await waitFor(() => {
      expect(audioElement.volume).toBe(targetVolume);
    });
  },

  testMuteToggle: async (audioElement: HTMLAudioElement) => {
    const originalVolume = audioElement.volume;

    // Test muting
    act(() => {
      audioElement.muted = true;
    });

    expect(audioElement.muted).toBe(true);
    audioElement.dispatchEvent(new Event('volumechange'));

    // Test unmuting
    act(() => {
      audioElement.muted = false;
    });

    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(originalVolume);
    audioElement.dispatchEvent(new Event('volumechange'));
  }
};

// Audio playback testing utilities
export const _playbackUtils = {
  simulateAudioPlayback: async (audio: any, duration: number = 1000) => {
    const events = audioMocks.simulateAudioEvents(audio);

    // Start playback
    await events.play();

    // Simulate time updates
    const intervals = Math.floor(duration / 100);
    for (let i = 0; i <= intervals; i++) {
      const currentTime = (i / intervals) * duration / 1000;
      events.timeUpdate(currentTime);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // End playback
    events.end();
  },

  testAudioLoading: async (audio: any, shouldSucceed: boolean = true) => {
    const events = audioMocks.simulateAudioEvents(audio);

    events.loadStart();
    await new Promise(resolve => setTimeout(resolve, 100));

    if (shouldSucceed) {
      events.canPlay();
      await new Promise(resolve => setTimeout(resolve, 50));
      events.canPlayThrough();
    } else {
      events.error(4); // MEDIA_ELEMENT_ERROR
    }
  }
};

// Audio format and codec testing
export const _codecUtils = {
  mockAudioFormats: () => {
    const formatSupport = {
      'audio/mp3': 'probably',
      'audio/mpeg': 'probably',
      'audio/wav': 'probably',
      'audio/ogg': 'maybe',
      'audio/mp4': 'probably',
      'audio/aac': 'probably',
      'audio/webm': 'maybe'
    };

    const mockCanPlayType = jest.fn((type: string) => {
      return formatSupport[type] || '';
    });

    // Mock on Audio constructor
    if ((global as any).Audio) {
      (global as any).Audio.prototype.canPlayType = mockCanPlayType;
    }

    return { mockCanPlayType, formatSupport };
  },

  testFormatSupport: (audio: HTMLAudioElement, formats: string[]) => {
    const support: { [key: string]: string } = {};
    formats.forEach(format => {
      support[format] = audio.canPlayType(format);
    });
    return support;
  }
};

// Alarm-specific audio utilities
export const _alarmAudioUtils = {
  createAlarmTestSuite: (alarmSound: HTMLAudioElement) => ({
    testAlarmStart: async () => {
      expect(alarmSound.paused).toBe(true);

      // Simulate alarm trigger
      const playPromise = alarmSound.play();
      expect(alarmSound.play).toHaveBeenCalled();

      // Simulate successful play
      audioMocks.simulateAudioEvents(alarmSound).play();

      await waitFor(() => {
        expect(alarmSound.paused).toBe(false);
      });
    },

    testAlarmStop: async () => {
      // Start playing first
      await alarmAudioUtils.createAlarmTestSuite(alarmSound).testAlarmStart();

      // Stop alarm
      alarmSound.pause();
      alarmSound.currentTime = 0;

      expect(alarmSound.paused).toBe(true);
      expect(alarmSound.currentTime).toBe(0);
    },

    testSnoozeFunction: async (snoozeDuration: number = 300000) => {
      // Stop current alarm
      alarmSound.pause();

      // Simulate snooze delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Restart after snooze (simplified for testing)
      const playPromise = alarmSound.play();
      expect(alarmSound.play).toHaveBeenCalled();
    },

    testVolumeGradual: async (startVolume: number = 0.1, endVolume: number = 1, steps: number = 5) => {
      const volumeStep = (endVolume - startVolume) / steps;

      for (let i = 0; i <= steps; i++) {
        const currentVolume = startVolume + (volumeStep * i);
        alarmSound.volume = Math.min(currentVolume, 1);

        await new Promise(resolve => setTimeout(resolve, 10));
        expect(alarmSound.volume).toBeCloseTo(Math.min(currentVolume, 1), 2);
      }
    }
  }),

  mockAlarmSounds: () => {
    const alarmSounds = [
      'gentle-chime.mp3',
      'classic-alarm.mp3',
      'nature-sounds.mp3',
      'progressive-beep.mp3'
    ];

    return alarmSounds.map(sound => ({
      name: sound,
      audio: audioMocks.createMockAudio(`/sounds/${sound}`),
      duration: 30 + Math.random() * 120 // Random duration between 30-150 seconds
    }));
  }
};

// Audio testing helpers
export const _audioHelpers = {
  expectAudioToPlay: async (audio: HTMLAudioElement) => {
    const playPromise = audio.play();
    expect(audio.play).toHaveBeenCalled();
    await expect(playPromise).resolves.toBeUndefined();
  },

  expectAudioToPause: (audio: HTMLAudioElement) => {
    audio.pause();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.paused).toBe(true);
  },

  waitForAudioEvent: async (audio: HTMLAudioElement, eventType: string, timeout: number = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Audio event '${eventType}' did not fire within ${timeout}ms`));
      }, timeout);

      audio.addEventListener(eventType, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  },

  testAudioLoop: async (audio: HTMLAudioElement, cycles: number = 2) => {
    audio.loop = true;
    const events = audioMocks.simulateAudioEvents(audio);

    for (let i = 0; i < cycles; i++) {
      await events.play();
      events.timeUpdate(audio.duration);
      events.end();

      // Loop should restart
      if (i < cycles - 1) {
        events.timeUpdate(0);
        await events.play();
      }
    }
  }
};

// Export all utilities
export default {
  audioMocks,
  webAudioMocks,
  notificationMocks,
  volumeUtils,
  playbackUtils,
  codecUtils,
  alarmAudioUtils,
  audioHelpers
};