// Web Worker for heavy sleep analysis computations
class SleepAnalysisWorker {
  private worker: Worker | null = null;
  private jobQueue: Map<string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported in this environment');
      return;
    }

    // Create worker from inline script
    const workerScript = `
      // Sleep analysis algorithms
      const analyzeSleepPatterns = (sessions) => {
        const results = {
          averageDuration: 0,
          averageQuality: 0,
          sleepEfficiency: 0,
          chronotype: 'normal',
          consistency: 0,
          recommendations: []
        };

        if (sessions.length === 0) return results;

        // Calculate averages
        const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalQuality = sessions.reduce((sum, s) => sum + s.quality, 0);
        
        results.averageDuration = totalDuration / sessions.length;
        results.averageQuality = totalQuality / sessions.length;

        // Calculate sleep efficiency
        const totalTimeInBed = sessions.reduce((sum, s) => {
          const bedtime = new Date(s.bedtime).getTime();
          const wakeTime = new Date(s.wakeTime).getTime();
          return sum + (wakeTime - bedtime);
        }, 0);
        
        const totalSleepTime = totalDuration * 60 * 1000; // Convert to ms
        results.sleepEfficiency = (totalSleepTime / totalTimeInBed) * 100;

        // Determine chronotype
        const avgBedtimeHour = sessions.reduce((sum, s) => {
          const hour = new Date(s.bedtime).getHours();
          return sum + (hour >= 12 ? hour : hour + 24); // Handle midnight crossover
        }, 0) / sessions.length;

        if (avgBedtimeHour < 21) results.chronotype = 'early';
        else if (avgBedtimeHour > 24) results.chronotype = 'late';
        else results.chronotype = 'normal';

        // Calculate consistency (lower variance = higher consistency)
        const bedtimes = sessions.map(s => new Date(s.bedtime).getHours());
        const waketimes = sessions.map(s => new Date(s.wakeTime).getHours());
        
        const bedtimeVariance = calculateVariance(bedtimes);
        const waketimeVariance = calculateVariance(waketimes);
        const avgVariance = (bedtimeVariance + waketimeVariance) / 2;
        
        results.consistency = Math.max(0, 100 - (avgVariance / 4) * 100);

        // Generate recommendations
        if (results.averageQuality < 6) {
          results.recommendations.push('Consider improving sleep environment');
        }
        if (results.sleepEfficiency < 85) {
          results.recommendations.push('Reduce time in bed when not sleeping');
        }
        if (results.consistency < 70) {
          results.recommendations.push('Try to maintain consistent sleep schedule');
        }

        return results;
      };

      const calculateVariance = (values) => {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
      };

      const predictOptimalWakeTime = (bedtime, sleepCycles = 5) => {
        const bedtimeMs = new Date(bedtime).getTime();
        const cycleLength = 90 * 60 * 1000; // 90 minutes in ms
        
        const optimalTimes = [];
        for (let i = 4; i <= 6; i++) { // 4-6 cycles
          const wakeTime = new Date(bedtimeMs + (i * cycleLength));
          optimalTimes.push({
            time: wakeTime,
            cycles: i,
            quality: i === 5 ? 'optimal' : i === 4 ? 'light' : 'deep'
          });
        }
        
        return optimalTimes;
      };

      const analyzeVoicePatterns = (voiceCommands) => {
        const commandStats = {};
        const confidenceStats = {
          average: 0,
          distribution: { high: 0, medium: 0, low: 0 }
        };
        
        voiceCommands.forEach(cmd => {
          commandStats[cmd.intent] = (commandStats[cmd.intent] || 0) + 1;
          
          if (cmd.confidence > 0.8) confidenceStats.distribution.high++;
          else if (cmd.confidence > 0.6) confidenceStats.distribution.medium++;
          else confidenceStats.distribution.low++;
        });
        
        confidenceStats.average = voiceCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / voiceCommands.length;
        
        return { commandStats, confidenceStats };
      };

      // Worker message handler
      self.onmessage = function(e) {
        const { type, data, jobId } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'analyzeSleep':
              result = analyzeSleepPatterns(data.sessions);
              break;
            case 'predictWakeTime':
              result = predictOptimalWakeTime(data.bedtime, data.cycles);
              break;
            case 'analyzeVoice':
              result = analyzeVoicePatterns(data.commands);
              break;
            default:
              throw new Error('Unknown job type: ' + type);
          }
          
          self.postMessage({
            jobId,
            success: true,
            result
          });
        } catch (error) {
          self.postMessage({
            jobId,
            success: false,
            error: error.message
          });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    
    this.worker.onmessage = (e) => {
      const { jobId, success, result, error } = e.data;
      const job = this.jobQueue.get(jobId);
      
      if (job) {
        this.jobQueue.delete(jobId);
        if (success) {
          job.resolve(result);
        } else {
          job.reject(new Error(error));
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      // Reject all pending jobs
      this.jobQueue.forEach(job => {
        job.reject(new Error('Worker error occurred'));
      });
      this.jobQueue.clear();
    };
  }

  private generateJobId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async analyzeSleepPatterns(sessions: any[]): Promise<any> {
    if (!this.worker) {
      // Fallback to main thread if worker not available
      return this.analyzeSleepPatternsMainThread(sessions);
    }

    const jobId = this.generateJobId();
    
    return new Promise((resolve, reject) => {
      this.jobQueue.set(jobId, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'analyzeSleep',
        data: { sessions },
        jobId
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.jobQueue.has(jobId)) {
          this.jobQueue.delete(jobId);
          reject(new Error('Analysis timeout'));
        }
      }, 30000);
    });
  }

  async predictOptimalWakeTime(bedtime: string, cycles: number = 5): Promise<any> {
    if (!this.worker) {
      return this.predictOptimalWakeTimeMainThread(bedtime, cycles);
    }

    const jobId = this.generateJobId();
    
    return new Promise((resolve, reject) => {
      this.jobQueue.set(jobId, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'predictWakeTime',
        data: { bedtime, cycles },
        jobId
      });
      
      setTimeout(() => {
        if (this.jobQueue.has(jobId)) {
          this.jobQueue.delete(jobId);
          reject(new Error('Prediction timeout'));
        }
      }, 10000);
    });
  }

  async analyzeVoicePatterns(commands: any[]): Promise<any> {
    if (!this.worker) {
      return this.analyzeVoicePatternsMainThread(commands);
    }

    const jobId = this.generateJobId();
    
    return new Promise((resolve, reject) => {
      this.jobQueue.set(jobId, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'analyzeVoice',
        data: { commands },
        jobId
      });
      
      setTimeout(() => {
        if (this.jobQueue.has(jobId)) {
          this.jobQueue.delete(jobId);
          reject(new Error('Voice analysis timeout'));
        }
      }, 15000);
    });
  }

  // Fallback implementations for main thread
  private analyzeSleepPatternsMainThread(sessions: any[]): any {
    console.warn('Running sleep analysis on main thread - performance may be impacted');
    // Simplified main thread implementation
    return {
      averageDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length || 0,
      averageQuality: sessions.reduce((sum, s) => sum + s.quality, 0) / sessions.length || 0,
      sleepEfficiency: 85, // Default value
      chronotype: 'normal',
      consistency: 75,
      recommendations: ['Install Web Worker support for detailed analysis']
    };
  }

  private predictOptimalWakeTimeMainThread(bedtime: string, cycles: number): any {
    console.warn('Running wake time prediction on main thread');
    const bedtimeMs = new Date(bedtime).getTime();
    const cycleLength = 90 * 60 * 1000;
    
    return [{
      time: new Date(bedtimeMs + (cycles * cycleLength)),
      cycles,
      quality: 'optimal'
    }];
  }

  private analyzeVoicePatternsMainThread(commands: any[]): any {
    console.warn('Running voice analysis on main thread');
    return {
      commandStats: {},
      confidenceStats: {
        average: 0.75,
        distribution: { high: 0, medium: 0, low: 0 }
      }
    };
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending jobs
    this.jobQueue.forEach(job => {
      job.reject(new Error('Worker terminated'));
    });
    this.jobQueue.clear();
  }
}

// Singleton instance
let workerInstance: SleepAnalysisWorker | null = null;

export const getAnalysisWorker = (): SleepAnalysisWorker => {
  if (!workerInstance) {
    workerInstance = new SleepAnalysisWorker();
  }
  return workerInstance;
};

export const terminateAnalysisWorker = (): void => {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
};

// React hook for using the analysis worker
import { useEffect, useRef } from 'react';

export const useAnalysisWorker = () => {
  const workerRef = useRef<SleepAnalysisWorker>();

  useEffect(() => {
    workerRef.current = getAnalysisWorker();
    
    return () => {
      // Don't terminate on unmount, keep worker alive for other components
    };
  }, []);

  return workerRef.current!;
};

export default SleepAnalysisWorker;