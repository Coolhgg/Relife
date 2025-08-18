# Smart Alarm Database Setup

This directory contains the database schema and setup scripts for the Smart Alarm application using Supabase.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the Supabase dashboard

## Setup Instructions

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Update the values in `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script

This will create:

- All necessary tables (users, alarms, alarm_events, voices, user_voices)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates
- Default voice configurations

### 3. Enable Realtime (Optional)

For real-time alarm synchronization across devices:

1. Go to Database > Replication in your Supabase dashboard
2. Enable realtime for the `alarms` table
3. This allows the app to sync alarm changes instantly

## Database Schema Overview

### Tables

#### `users`

- User profiles and preferences
- Linked to Supabase Auth
- Stores theme, notification, and voice preferences

#### `alarms`

- User-created alarms
- Stores time, days, voice mood, and status
- Links to user via `user_id`

#### `alarm_events`

- Log of alarm triggers and interactions
- Tracks dismissals, snoozes, and methods used
- Used for analytics and debugging

#### `voices`

- Available TTS voices and configurations
- Public table with default voice settings
- Extensible for future TTS provider integration

#### `user_voices`

- User-specific voice customizations
- Custom messages per voice mood
- Links users to preferred voices

### Security

- Row Level Security (RLS) enabled on all user data tables
- Users can only access their own data
- Automatic user profile creation on signup
- Secure API access through Supabase Auth

### Performance

- Indexes on frequently queried columns
- Optimized for alarm lookup and event logging
- View for aggregated user statistics

## API Usage

The app uses the `SupabaseService` class in `src/services/supabase.ts` to interact with the database:

```typescript
// Sign up new user
const { user, error } = await SupabaseService.signUp(email, password, name);

// Load user alarms
const { alarms, error } = await SupabaseService.loadUserAlarms(userId);

// Save alarm
const { error } = await SupabaseService.saveAlarm(alarm);

// Subscribe to real-time updates
const unsubscribe = SupabaseService.subscribeToUserAlarms(userId, (alarms) => {
  // Handle alarm updates
});
```

## Local Development

For local development without Supabase:

- The app will fall back to local storage
- User authentication will be bypassed
- All alarm data is stored locally
- Real-time sync is disabled

## Production Deployment

1. Set up environment variables in your hosting platform
2. Configure Supabase Auth providers if needed
3. Set up email templates for user onboarding
4. Configure webhook endpoints for alarm notifications
5. Set up monitoring and alerts for database performance

## Backup and Recovery

Supabase provides automatic backups, but for critical deployments:

1. Set up daily database dumps
2. Store critical alarm data redundantly
3. Implement data export functionality for users
4. Test recovery procedures regularly

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Check that user is authenticated and policies allow the operation
2. **Connection Errors**: Verify environment variables and network connectivity
3. **Migration Errors**: Ensure schema.sql is run completely without errors
4. **Performance Issues**: Check query performance and add indexes if needed

### Debugging

- Enable Supabase logging in dashboard
- Use browser dev tools to inspect network requests
- Check console for error messages
- Verify user authentication status

## Future Enhancements

- Integration with external TTS providers (ElevenLabs, Google Cloud TTS)
- Advanced analytics and reporting
- Backup and sync to cloud storage
- Multi-device alarm coordination
- Social features and alarm sharing
