import React, { useState, useRef, useCallback } from 'react';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Trash2,
  Crown,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
  Star,
} from 'lucide-react';
import type { User, VoiceCloneRequest } from '../types';
import { PremiumVoiceService } from '../services/premium-voice';
import { PremiumService } from '../services/premium';

interface VoiceCloningProps {
  user: User;
  onClose: () => void;
}

interface AudioSample {
  id: string;
  blob: Blob;
  duration: number;
  name: string;
  url: string;
}

const VoiceCloning: React.FC<VoiceCloningProps> = ({ user, onClose }) => {
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cloneRequest, setCloneRequest] = useState<VoiceCloneRequest | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Check access on mount
  React.useEffect(() => {
    checkAccess();
  }, [user.id]);

  const checkAccess = async () => {
    try {
      const access = await PremiumService.getInstance().hasFeatureAccess(
        user.id,
        'voice_cloning'
      );
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking voice cloning access:', error);
      setHasAccess(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = event => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const sampleId = `sample_${Date.now()}`;
        const url = URL.createObjectURL(blob);

        const newSample: AudioSample = {
          id: sampleId,
          blob,
          duration: recordingTime,
          name: `Recording ${samples.length + 1}`,
          url,
        };

        setSamples(prev => [...prev, newSample]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const sampleId = `upload_${Date.now()}_${Math.random()}`;
        const url = URL.createObjectURL(file);

        const newSample: AudioSample = {
          id: sampleId,
          blob: file,
          duration: 0, // Would need to calculate from audio
          name: file.name,
          url,
        };

        setSamples(prev => [...prev, newSample]);
      }
    });

    // Reset input
    event.target.value = '';
  }, []);

  const playAudio = (sampleId: string) => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return;

    // Stop any currently playing audio
    if (playingId) {
      const currentAudio = audioRefs.current.get(playingId);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Create or get audio element
    let audio = audioRefs.current.get(sampleId);
    if (!audio) {
      audio = new Audio(sample.url);
      audioRefs.current.set(sampleId, audio);
    }

    audio.onended = () => setPlayingId(null);
    audio.onpause = () => setPlayingId(null);

    setPlayingId(sampleId);
    audio.play().catch(console.error);
  };

  const stopAudio = (sampleId: string) => {
    const audio = audioRefs.current.get(sampleId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingId(null);
  };

  const removeSample = (sampleId: string) => {
    setSamples(prev => prev.filter(s => s.id !== sampleId));

    // Clean up audio and URL
    const audio = audioRefs.current.get(sampleId);
    if (audio) {
      audio.pause();
      audioRefs.current.delete(sampleId);
    }

    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      URL.revokeObjectURL(sample.url);
    }

    if (playingId === sampleId) {
      setPlayingId(null);
    }
  };

  const createVoiceClone = async () => {
    if (samples.length < 3) {
      alert('Please provide at least 3 voice samples for better quality.');
      return;
    }

    try {
      setIsProcessing(true);
      const audioBlobs = samples.map(sample => sample.blob);
      const request = await PremiumVoiceService.createVoiceClone(user.id, audioBlobs);
      setCloneRequest(request);
    } catch (error) {
      console.error('Error creating voice clone:', error);
      alert('Failed to create voice clone. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasAccess === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-md mx-4 p-6">
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ultimate Required</h2>
            <p className="text-gray-600 mb-6">
              Voice cloning is an exclusive feature for Ultimate subscribers. Upgrade to
              create your personalized AI voice.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real app, this would open the upgrade flow
                  alert('Redirecting to upgrade page...');
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Star className="h-4 w-4" />
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cloneRequest) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-lg mx-4 p-6">
          <div className="text-center">
            {cloneRequest.status === 'processing' && (
              <>
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Creating Your Voice Clone
                </h2>
                <p className="text-gray-600 mb-4">
                  Our AI is analyzing your voice samples and training your custom model.
                  This typically takes 12-24 hours.
                </p>
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated completion:</span>
                    <span className="font-medium text-gray-900">
                      {cloneRequest.estimatedCompletion?.toLocaleDateString()} at{' '}
                      {cloneRequest.estimatedCompletion?.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {cloneRequest.status === 'completed' && (
              <>
                <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Voice Clone Ready!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your custom voice has been successfully created. You can now select
                  "Custom Voice" in your alarm settings.
                </p>
              </>
            )}

            {cloneRequest.status === 'failed' && (
              <>
                <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Voice Clone Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  We couldn't create your voice clone. This might be due to audio
                  quality issues. Please try again with clearer recordings.
                </p>
              </>
            )}

            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              {cloneRequest.status === 'completed' ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Voice Cloning</h2>
              <p className="text-purple-100">Create your personalized AI voice</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Voice Cloning Tips:
                </h3>
                <ul className="text-blue-800 space-y-1">
                  <li>• Provide 3-10 voice samples for best results</li>
                  <li>• Each sample should be 10-30 seconds long</li>
                  <li>• Speak clearly in a quiet environment</li>
                  <li>• Use varied sentences and emotions</li>
                  <li>• Processing takes 12-24 hours</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recording controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Record Voice Samples
              </h3>
              <div className="text-sm text-gray-600">{samples.length}/10 samples</div>
            </div>

            <div className="flex gap-3 mb-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Mic className="h-5 w-5" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 animate-pulse"
                >
                  <Pause className="h-5 w-5" />
                  Stop Recording ({formatTime(recordingTime)})
                </button>
              )}

              <label className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                Upload Audio
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Voice samples list */}
          {samples.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Voice Samples
              </h3>
              <div className="space-y-3">
                {samples.map(sample => (
                  <div
                    key={sample.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center gap-3"
                  >
                    <button
                      onClick={() =>
                        playingId === sample.id
                          ? stopAudio(sample.id)
                          : playAudio(sample.id)
                      }
                      className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                    >
                      {playingId === sample.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{sample.name}</div>
                      <div className="text-sm text-gray-600">
                        Duration: {formatTime(sample.duration)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeSample(sample.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress requirements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            <div className="space-y-2">
              <div
                className={`flex items-center gap-2 ${samples.length >= 3 ? 'text-green-600' : 'text-gray-400'}`}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  At least 3 voice samples (recommended: 5-10)
                </span>
              </div>
              <div
                className={`flex items-center gap-2 ${samples.some(s => s.duration >= 10) ? 'text-green-600' : 'text-gray-400'}`}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Samples should be 10+ seconds each</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createVoiceClone}
              disabled={samples.length < 3 || isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Create Voice Clone
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloning;
