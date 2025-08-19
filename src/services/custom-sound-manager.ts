import type { CustomSound, SoundCategory } from "../types";
import { AudioManager } from "./audio-manager";
import { supabase } from "./supabase";
import { ErrorHandler } from "./error-handler";

export interface SoundUploadResult {
  success: boolean;
  customSound?: CustomSound;
  error?: string;
}

export interface SoundUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: "validating" | "uploading" | "processing" | "caching" | "complete";
}

export interface SoundValidationResult {
  valid: boolean;
  error?: string;
  metadata?: {
    duration: number;
    format: string;
    size: number;
    sampleRate?: number;
    channels?: number;
  };
}

export class CustomSoundManager {
  private static instance: CustomSoundManager | null = null;
  private audioManager: AudioManager;

  // Supported audio formats
  private static readonly SUPPORTED_FORMATS = [
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
  ];

  // File size limits (in bytes)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_FILE_SIZE = 1024; // 1KB

  // Duration limits (in seconds)
  private static readonly MAX_DURATION = 300; // 5 minutes
  private static readonly MIN_DURATION = 1; // 1 second

  private constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  static getInstance(): CustomSoundManager {
    if (!CustomSoundManager.instance) {
      CustomSoundManager.instance = new CustomSoundManager();
    }
    return CustomSoundManager.instance;
  }

  /**
   * Upload and process a custom sound file
   */
  async uploadCustomSound(
    file: File,
    metadata: {
      name: string;
      description?: string;
      category: SoundCategory;
      tags?: string[];
    },
    userId: string,
    onProgress?: (progress: SoundUploadProgress) => void,
  ): Promise<SoundUploadResult> {
    try {
      // Stage 1: Validation
      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 0,
        stage: "validating",
      });

      const validation = await this.validateAudioFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Stage 2: Upload to storage
      onProgress?.({
        loaded: 25,
        total: 100,
        percentage: 25,
        stage: "uploading",
      });

      const fileName = `custom-sounds/${userId}/${Date.now()}-${this.sanitizeFileName(file.name)}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-files")
        .upload(fileName, file, {
          cacheControl: "31536000", // 1 year
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Stage 3: Processing and metadata creation
      onProgress?.({
        loaded: 50,
        total: 100,
        percentage: 50,
        stage: "processing",
      });

      const { data: urlData } = supabase.storage
        .from("audio-files")
        .getPublicUrl(fileName);

      const customSound: CustomSound = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: metadata.name,
        description: metadata.description,
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        duration: validation.metadata!.duration,
        category: metadata.category,
        tags: metadata.tags || [],
        isCustom: true,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        downloads: 0,
        rating: 0,
      };

      // Stage 4: Save metadata to database
      const { error: dbError } = await supabase
        .from("custom_sounds")
        .insert([customSound]);

      if (dbError) {
        // Clean up uploaded file if database save fails
        await supabase.storage.from("audio-files").remove([fileName]);
        throw new Error(`Database save failed: ${dbError.message}`);
      }

      // Stage 5: Cache locally
      onProgress?.({
        loaded: 75,
        total: 100,
        percentage: 75,
        stage: "caching",
      });

      try {
        await this.audioManager.preloadCustomSoundFile(customSound);
      } catch (cacheError) {
        console.warn("Failed to cache custom sound:", cacheError);
        // Non-fatal error, don't fail the upload
      }

      onProgress?.({
        loaded: 100,
        total: 100,
        percentage: 100,
        stage: "complete",
      });

      return { success: true, customSound };
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        error,
        "CustomSoundManager.uploadCustomSound",
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Validate an audio file before upload
   */
  async validateAudioFile(file: File): Promise<SoundValidationResult> {
    try {
      // Check file type
      if (!CustomSoundManager.SUPPORTED_FORMATS.includes(file.type)) {
        return {
          valid: false,
          error: `Unsupported format. Please use: ${CustomSoundManager.SUPPORTED_FORMATS.join(", ")}`,
        };
      }

      // Check file size
      if (file.size > CustomSoundManager.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File too large. Maximum size is ${this.formatFileSize(CustomSoundManager.MAX_FILE_SIZE)}`,
        };
      }

      if (file.size < CustomSoundManager.MIN_FILE_SIZE) {
        return {
          valid: false,
          error: "File too small. Minimum size is 1KB",
        };
      }

      // Create temporary audio element to check duration and metadata
      const audioUrl = URL.createObjectURL(file);

      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);

        audio.addEventListener("loadedmetadata", () => {
          URL.revokeObjectURL(audioUrl);

          const duration = audio.duration;

          if (duration > CustomSoundManager.MAX_DURATION) {
            resolve({
              valid: false,
              error: `Audio too long. Maximum duration is ${this.formatDuration(CustomSoundManager.MAX_DURATION)}`,
            });
            return;
          }

          if (duration < CustomSoundManager.MIN_DURATION) {
            resolve({
              valid: false,
              error: "Audio too short. Minimum duration is 1 second",
            });
            return;
          }

          resolve({
            valid: true,
            metadata: {
              duration,
              format: file.type,
              size: file.size,
              // Note: Web Audio API doesn't provide direct access to sample rate and channels from file
              // These would need to be extracted during actual audio processing
            },
          });
        });

        audio.addEventListener("error", () => {
          URL.revokeObjectURL(audioUrl);
          resolve({
            valid: false,
            error: "Invalid audio file or corrupted",
          });
        });

        // Set a timeout in case the file never loads
        setTimeout(() => {
          URL.revokeObjectURL(audioUrl);
          resolve({
            valid: false,
            error: "File validation timeout",
          });
        }, 10000);
      });
    } catch (error) {
      return {
        valid: false,
        error: "File validation failed",
      };
    }
  }

  /**
   * Get custom sounds for a user
   */
  async getUserCustomSounds(userId: string): Promise<CustomSound[]> {
    try {
      const { data, error } = await supabase
        .from("custom_sounds")
        .select("*")
        .eq("uploadedBy", userId)
        .order("uploadedAt", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        error,
        "CustomSoundManager.getUserCustomSounds",
      );
      return [];
    }
  }

  /**
   * Delete a custom sound
   */
  async deleteCustomSound(soundId: string, userId: string): Promise<boolean> {
    try {
      // Get sound details first
      const { data: sound, error: fetchError } = await supabase
        .from("custom_sounds")
        .select("*")
        .eq("id", soundId)
        .eq("uploadedBy", userId)
        .single();

      if (fetchError || !sound) {
        throw new Error("Sound not found or unauthorized");
      }

      // Delete from storage
      const fileName = sound.fileUrl.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("audio-files")
          .remove([`custom-sounds/${userId}/${fileName}`]);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from("custom_sounds")
        .delete()
        .eq("id", soundId)
        .eq("uploadedBy", userId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        error,
        "CustomSoundManager.deleteCustomSound",
      );
      return false;
    }
  }

  /**
   * Preview a sound before upload (from File object)
   */
  async previewSound(
    file: File,
  ): Promise<{ audio: HTMLAudioElement; cleanup: () => void }> {
    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);

    const cleanup = () => {
      URL.revokeObjectURL(audioUrl);
    };

    return { audio, cleanup };
  }

  /**
   * Preview a custom sound (from CustomSound object)
   */
  async previewCustomSound(
    customSound: CustomSound,
  ): Promise<HTMLAudioElement> {
    const audio = new Audio(customSound.fileUrl);
    return audio;
  }

  /**
   * Update custom sound metadata
   */
  async updateCustomSound(
    soundId: string,
    userId: string,
    updates: Partial<
      Pick<CustomSound, "name" | "description" | "category" | "tags">
    >,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("custom_sounds")
        .update(updates)
        .eq("id", soundId)
        .eq("uploadedBy", userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        error,
        "CustomSoundManager.updateCustomSound",
      );
      return false;
    }
  }

  // Utility methods
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
}
