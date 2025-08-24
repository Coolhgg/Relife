// Advanced Loading States for Relife Smart Alarm
// Beautiful loading animations and skeleton components

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================================================================
// ALARM-SPECIFIC LOADING STATES
// ================================================================

export const AlarmCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            {/* Time skeleton */}
            <div className="space-y-2">
              <motion.div
                className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24"
                animate={{
                  backgroundPosition: ['-200px 0', '200px 0'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  backgroundSize: '200px 100%',
                }}
              />
              <motion.div
                className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16"
                animate={{
                  backgroundPosition: ['-200px 0', '200px 0'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.2,
                }}
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  backgroundSize: '200px 100%',
                }}
              />
            </div>

            {/* Toggle skeleton */}
            <motion.div
              className="w-12 h-6 bg-gray-200 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Days skeleton */}
          <div className="flex space-x-2 mt-4">
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <motion.div
                key={dayIndex}
                className="w-8 h-8 bg-gray-200 rounded-full"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: dayIndex * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AlarmRingingLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {/* Pulsing alarm icon */}
        <motion.div
          className="relative mb-8"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Multiple concentric circles for ripple effect */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute inset-0 border-4 border-white/30 rounded-full"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 2, 3], opacity: [1, 0.3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}

          {/* Central alarm clock */}
          <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <motion.div
              className="text-4xl"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🔔
            </motion.div>
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Preparing your wake-up
        </motion.h2>

        {/* Animated dots */}
        <div className="flex items-center justify-center space-x-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ================================================================
// VOICE INTERACTION LOADING
// ================================================================

export const VoiceListeningIndicator: React.FC<{
  isListening: boolean;
  confidence?: number;
}> = ({ isListening, confidence = 0 }) => {
  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-white/20">
            <div className="flex items-center space-x-4">
              {/* Microphone icon with pulse */}
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  🎤
                </div>

                {/* Pulse rings */}
                {[0, 1].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-blue-500 rounded-full"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </motion.div>

              {/* Audio waveform */}
              <div className="flex items-center space-x-1 h-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full"
                    animate={{
                      height: [4, Math.random() * 20 + 10, 4],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>

              {/* Listening text */}
              <div>
                <p className="text-sm font-medium text-gray-800">Listening...</p>
                {confidence > 0 && (
                  <p className="text-xs text-gray-500">
                    Confidence: {Math.round(confidence * 100)}%
                  </p>
                )}
              </div>
            </div>

            {/* Confidence bar */}
            {confidence > 0 && (
              <motion.div
                className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const VoiceProcessingLoader: React.FC<{
  message?: string;
}> = ({ message = 'Processing your command...' }) => {
  return (
    <motion.div
      className="flex items-center space-x-3 p-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* Brain icon with thinking animation */}
      <motion.div
        className="text-2xl"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🧠
      </motion.div>

      {/* Processing text */}
      <div>
        <p className="text-sm font-medium text-gray-800">{message}</p>
        <div className="flex items-center space-x-1 mt-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-blue-500 rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ================================================================
// DASHBOARD LOADING STATES
// ================================================================

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <motion.div
            className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 mb-2"
            animate={{
              backgroundPosition: ['-200px 0', '200px 0'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              backgroundSize: '200px 100%',
            }}
          />
          <motion.div
            className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-96"
            animate={{
              backgroundPosition: ['-200px 0', '200px 0'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.2,
            }}
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              backgroundSize: '200px 100%',
            }}
          />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.div
                    className="h-4 bg-gray-200 rounded w-20 mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                  <motion.div
                    className="h-8 bg-gray-200 rounded w-16"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1 + 0.3,
                    }}
                  />
                </div>
                <motion.div
                  className="w-12 h-12 bg-gray-200 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1 + 0.6,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alarms section */}
          <div className="lg:col-span-2">
            <AlarmCardSkeleton count={3} />
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <motion.div
                key={i}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 + 0.5, duration: 0.3 }}
              >
                <motion.div
                  className="h-6 bg-gray-200 rounded w-32 mb-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <motion.div
                      key={j}
                      className="h-4 bg-gray-200 rounded"
                      style={{ width: `${Math.random() * 40 + 60}%` }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2 + j * 0.1,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// SETTINGS LOADING STATES
// ================================================================

export const SettingsFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <motion.div
          key={sectionIndex}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1, duration: 0.3 }}
        >
          {/* Section title */}
          <motion.div
            className="h-7 bg-gray-200 rounded-lg w-48 mb-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: sectionIndex * 0.2,
            }}
          />

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <motion.div
                  className="h-4 bg-gray-200 rounded w-24"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: sectionIndex * 0.2 + fieldIndex * 0.1,
                  }}
                />
                <motion.div
                  className="h-10 bg-gray-200 rounded-xl w-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: sectionIndex * 0.2 + fieldIndex * 0.1 + 0.3,
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ================================================================
// ANALYTICS LOADING STATES
// ================================================================

export const AnalyticsChartSkeleton: React.FC<{
  height?: string;
}> = ({ height = 'h-64' }) => {
  return (
    <motion.div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 ${height}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Chart title */}
      <motion.div
        className="h-6 bg-gray-200 rounded w-48 mb-6"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Chart area */}
      <div className="relative h-full bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 flex items-end justify-between space-x-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="bg-blue-200 rounded-t-lg w-6"
            style={{ height: `${Math.random() * 80 + 20}%` }}
            initial={{ height: 0 }}
            animate={{ height: `${Math.random() * 80 + 20}%` }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              repeat: Infinity,
              repeatType: 'reverse',
              repeatDelay: 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ================================================================
// UNIVERSAL PAGE LOADER
// ================================================================

export const PageLoader: React.FC<{
  message?: string;
  subMessage?: string;
}> = ({ message = 'Loading your alarms...', subMessage = "This won't take long" }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        {/* Logo with pulse animation */}
        <motion.div
          className="mb-8"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
            ⏰
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.h2
          className="text-2xl font-bold text-gray-800 mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.h2>

        <motion.p
          className="text-gray-600 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {subMessage}
        </motion.p>

        {/* Progress indicator */}
        <motion.div
          className="w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: 256 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            animate={{
              x: ['-100%', '100%', '-100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default {
  AlarmCardSkeleton,
  AlarmRingingLoader,
  VoiceListeningIndicator,
  VoiceProcessingLoader,
  DashboardSkeleton,
  SettingsFormSkeleton,
  AnalyticsChartSkeleton,
  PageLoader,
};
