// Audio file mock for sound assets in tests

/**
 * Mock for audio file imports (mp3, wav, ogg, etc.)
 * Provides a mock Audio element with all necessary methods and properties
 */

class MockAudio {
  src: string = '';
  currentTime: number = 0;
  duration: number = 30; // Mock 30 second duration
  volume: number = 1;
  muted: boolean = false;
  paused: boolean = true;
  ended: boolean = false;
  loop: boolean = false;
  autoplay: boolean = false;
  preload: string = 'metadata';
  playbackRate: number = 1;
  readyState: number = 4; // HAVE_ENOUGH_DATA

  // Event handlers
  onplay: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onpause: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onended: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onloadstart: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onloadeddata: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onloadedmetadata: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  oncanplay: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  oncanplaythrough: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onerror: ((this: HTMLAudioElement, ev: ErrorEvent
) => any) | null = null;
  ontimeupdate: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;
  onvolumechange: ((this: HTMLAudioElement, ev: Event
) => any) | null = null;

  constructor(src?: string) {
    if (src) {
      this.src = src;
    }

    // Simulate loading
    setTimeout((
) => {
      this.dispatchEvent(new Event('loadstart'));
      this.dispatchEvent(new Event('loadedmetadata'));
      this.dispatchEvent(new Event('loadeddata'));
      this.dispatchEvent(new Event('canplay'));
      this.dispatchEvent(new Event('canplaythrough'));
    }, 10);
  }

  play(): Promise<void> {
    this.paused = false;
    this.ended = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  load(): void {
    this.currentTime = 0;
    this.ended = false;
    this.dispatchEvent(new Event('loadstart'));
  }

  // Event system
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null
  ): void {
    if (listener && typeof listener === 'function') {
      (this as any)[`on${type}`] = listener;
    }
  }

  removeEventListener(
    type: string,
    listener?: EventListenerOrEventListenerObject | null
  ): void {
    (this as any)[`on${type}`] = null;
  }

  dispatchEvent(event: Event): boolean {
    const handler = (this as any)[`on${event.type}`];
    if (handler) {
      handler.call(this, event);
    }
    return true;
  }

  // Additional methods for testing
  canPlayType(type: string): string {
    if (type.includes('audio/mpeg') || type.includes('audio/mp3')) {
      return 'probably';
    }
    if (type.includes('audio/wav') || type.includes('audio/ogg')) {
      return 'maybe';
    }
    return '';
  }

  fastSeek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
  }
}

// Create mock audio file URL
const audioMock = 'test-audio-file.mp3';

// Attach MockAudio to global for direct audio testing
(global as any).MockAudio = MockAudio;

// Override HTML Audio constructor for comprehensive audio testing
if (typeof global !== 'undefined') {
  (global as any).Audio = MockAudio;
}

if (typeof window !== 'undefined') {
  (window as any).Audio = MockAudio;
}

export default audioMock;
export { MockAudio };
