# Custom Sound Upload Feature - Test Guide

## Overview
This guide outlines how to test the newly implemented custom sound upload functionality.

## Features Implemented

### 1. CustomSoundManager Service
- ✅ File upload and validation
- ✅ Audio file processing
- ✅ Metadata management
- ✅ Storage integration (Supabase + R2)
- ✅ Local caching via AudioManager

### 2. Database Schema
- ✅ custom_sounds table created
- ✅ Updated alarms table with soundType and customSoundId fields
- ✅ Storage bucket setup for audio files
- ✅ Row Level Security policies

### 3. AlarmForm Enhancements
- ✅ Sound type selection (voice-only, built-in, custom)
- ✅ File upload interface with drag & drop
- ✅ Custom sound library management
- ✅ Sound preview functionality
- ✅ Upload progress tracking
- ✅ Delete custom sounds option

### 4. Audio Playback Integration
- ✅ Updated AlarmRinging component to handle custom sounds
- ✅ AudioManager integration for custom sound playback
- ✅ Fallback to voice/beep if custom sound fails
- ✅ Repeat custom sounds during alarm

### 5. Type Safety
- ✅ Updated Alarm interface with soundType and customSoundId
- ✅ CustomSound interface for type safety
- ✅ SoundOption and SoundLibrary types

## Testing Steps

### Prerequisites
1. Run the database migration: `add_custom_sounds.sql`
2. Set up Supabase storage bucket for audio files
3. Ensure user authentication is working

### Manual Testing

#### 1. Upload Custom Sound
1. Open alarm creation form
2. Select "Custom Sounds" tab
3. Click "Choose File" or drag audio file
4. Verify upload progress is shown
5. Confirm sound appears in custom sound library
6. Test preview functionality

#### 2. Create Alarm with Custom Sound
1. Select uploaded custom sound
2. Set other alarm properties (time, label, etc.)
3. Save alarm
4. Verify alarm is created with soundType: 'custom'

#### 3. Test Alarm Playback
1. Trigger alarm (manually or wait for scheduled time)
2. Verify custom sound plays repeatedly
3. Confirm voice message also plays if voice mood is selected
4. Test dismissing alarm stops both sounds

#### 4. Sound Management
1. Upload multiple sounds
2. Test sound selection in alarm form
3. Delete custom sounds
4. Verify deleted sounds are removed from alarms

#### 5. Error Handling
1. Try uploading invalid file types
2. Test very large files (>10MB)
3. Test network errors during upload
4. Verify graceful fallback to voice/beep

### Supported Audio Formats
- MP3 (.mp3, .mpeg)
- WAV (.wav)
- OGG (.ogg)
- AAC (.aac)
- M4A (.m4a)

### File Constraints
- Maximum size: 10MB
- Maximum duration: 5 minutes (300 seconds)
- Minimum duration: 1 second

## Known Limitations

1. **Storage Dependencies**: Requires Supabase storage and R2 setup
2. **Mobile Performance**: Large audio files may impact mobile performance
3. **Browser Compatibility**: Web Audio API required for playback
4. **Offline Mode**: Custom sounds require network for initial load

## Future Enhancements

1. **Built-in Sound Library**: Pre-loaded alarm sounds
2. **Sound Sharing**: Allow users to share custom sounds
3. **Audio Processing**: Automatic volume normalization
4. **Batch Upload**: Multiple file upload at once
5. **Sound Categories**: Better organization and filtering
6. **Compression**: Automatic file compression for large uploads

## Configuration

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Tables
- `custom_sounds` - Stores custom sound metadata
- `alarms` - Updated with soundType and customSoundId columns
- Storage bucket: `audio-files` for file storage

## API Endpoints Used

### CustomSoundManager Methods
- `uploadCustomSound()` - Upload and process audio file
- `getUserCustomSounds()` - Fetch user's custom sounds
- `deleteCustomSound()` - Remove custom sound
- `previewSound()` - Preview sound before selection
- `validateAudioFile()` - Validate file before upload

### AudioManager Integration
- `preloadCustomSoundFile()` - Cache audio for faster playback
- `playCustomSound()` - Play custom sound with repeat
- `loadAudioFile()` - Load and cache audio data

## Troubleshooting

### Common Issues
1. **Upload Fails**: Check file format and size limits
2. **Sound Doesn't Play**: Verify browser audio permissions
3. **Performance Issues**: Consider file compression
4. **Storage Errors**: Check Supabase storage policies

### Debug Information
- Check browser console for error messages
- Verify network requests to Supabase storage
- Test with smaller audio files first
- Ensure user authentication is valid