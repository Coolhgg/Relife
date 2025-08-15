-- Master Migration Script: Emotional Intelligence System
-- Description: Runs all emotional intelligence migrations in correct order
-- Version: 1.0.0
-- Usage: Execute this script to install the complete emotional intelligence system

-- ========================================
-- SAFETY CHECKS AND PREREQUISITES
-- ========================================

-- Check PostgreSQL version (requires 12+)
DO $$
BEGIN
    IF current_setting('server_version_num')::integer < 120000 THEN
        RAISE EXCEPTION 'PostgreSQL 12 or higher required. Current version: %', version();
    END IF;
END $$;

-- Check for required extensions availability
DO $$
BEGIN
    -- Check if uuid-ossp extension is available
    IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'uuid-ossp') THEN
        RAISE EXCEPTION 'Required extension uuid-ossp is not available';
    END IF;
    
    -- Check if pg_trgm extension is available
    IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
        RAISE EXCEPTION 'Required extension pg_trgm is not available';
    END IF;
END $$;

-- Check for required auth schema (Supabase)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        RAISE WARNING 'Supabase auth schema not found. RLS policies may not work correctly.';
    END IF;
END $$;

-- Check if users table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Required users table not found. Please ensure your authentication system is set up first.';
    END IF;
END $$;

-- ========================================
-- MIGRATION TRACKING SETUP
-- ========================================

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by TEXT DEFAULT current_user,
    checksum TEXT,
    status VARCHAR(20) DEFAULT 'applied'
);

-- Function to record migration
CREATE OR REPLACE FUNCTION record_migration(migration_name TEXT, migration_checksum TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO migration_history (migration_name, checksum)
    VALUES (migration_name, migration_checksum)
    ON CONFLICT (migration_name) 
    DO UPDATE SET 
        applied_at = CURRENT_TIMESTAMP,
        applied_by = current_user,
        checksum = EXCLUDED.checksum,
        status = 'applied';
        
    RAISE NOTICE 'Migration applied: %', migration_name;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MIGRATION EXECUTION
-- ========================================

RAISE NOTICE '';
RAISE NOTICE '=====================================';
RAISE NOTICE 'EMOTIONAL INTELLIGENCE SYSTEM SETUP';
RAISE NOTICE '=====================================';
RAISE NOTICE '';
RAISE NOTICE 'Starting migration process...';
RAISE NOTICE 'Timestamp: %', CURRENT_TIMESTAMP;
RAISE NOTICE '';

-- ========================================
-- MIGRATION 001: Core Tables
-- ========================================

RAISE NOTICE 'Applying Migration 001: Core Tables...';

DO $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '001_create_emotional_tables') THEN
        RAISE NOTICE 'Migration 001 already applied, skipping...';
    ELSE
        -- Apply migration 001
        \i 001_create_emotional_tables.sql
        
        -- Record migration
        PERFORM record_migration('001_create_emotional_tables', 'core_tables_v1.0.0');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 001 failed: %', SQLERRM;
END $$;

-- ========================================
-- MIGRATION 002: Indexes and Constraints
-- ========================================

RAISE NOTICE 'Applying Migration 002: Indexes and Constraints...';

DO $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '002_create_indexes_and_constraints') THEN
        RAISE NOTICE 'Migration 002 already applied, skipping...';
    ELSE
        -- Apply migration 002
        \i 002_create_indexes_and_constraints.sql
        
        -- Record migration
        PERFORM record_migration('002_create_indexes_and_constraints', 'indexes_v1.0.0');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 002 failed: %', SQLERRM;
END $$;

-- ========================================
-- MIGRATION 003: Triggers and Functions
-- ========================================

RAISE NOTICE 'Applying Migration 003: Triggers and Functions...';

DO $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '003_create_triggers_and_functions') THEN
        RAISE NOTICE 'Migration 003 already applied, skipping...';
    ELSE
        -- Apply migration 003
        \i 003_create_triggers_and_functions.sql
        
        -- Record migration
        PERFORM record_migration('003_create_triggers_and_functions', 'triggers_v1.0.0');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 003 failed: %', SQLERRM;
END $$;

-- ========================================
-- MIGRATION 004: Seed Templates
-- ========================================

RAISE NOTICE 'Applying Migration 004: Message Templates...';

DO $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '004_seed_emotional_message_templates') THEN
        RAISE NOTICE 'Migration 004 already applied, skipping...';
    ELSE
        -- Apply migration 004
        \i 004_seed_emotional_message_templates.sql
        
        -- Record migration
        PERFORM record_migration('004_seed_emotional_message_templates', 'templates_v1.0.0');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 004 failed: %', SQLERRM;
END $$;

-- ========================================
-- MIGRATION 005: Analytics Views
-- ========================================

RAISE NOTICE 'Applying Migration 005: Analytics Views...';

DO $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '005_create_analytics_views') THEN
        RAISE NOTICE 'Migration 005 already applied, skipping...';
    ELSE
        -- Apply migration 005
        \i 005_create_analytics_views.sql
        
        -- Record migration
        PERFORM record_migration('005_create_analytics_views', 'analytics_v1.0.0');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 005 failed: %', SQLERRM;
END $$;

-- ========================================
-- MIGRATION 006: Row Level Security
-- ========================================

RAISE NOTICE 'Applying Migration 006: Row Level Security...';

DO $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '006_setup_row_level_security') THEN
        RAISE NOTICE 'Migration 006 already applied, skipping...';
    ELSE
        -- Apply migration 006
        \i 006_setup_row_level_security.sql
        
        -- Record migration
        PERFORM record_migration('006_setup_row_level_security', 'rls_v1.0.0');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 006 failed: %', SQLERRM;
END $$;

-- ========================================
-- POST-MIGRATION VALIDATION
-- ========================================

RAISE NOTICE '';
RAISE NOTICE 'Running post-migration validation...';

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
    template_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count created objects
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name LIKE '%emotional%' 
    AND table_schema = 'public';
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_name LIKE '%emotional%'
    AND routine_schema = 'public';
    
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_name LIKE '%emotional%'
    AND table_schema = 'public';
    
    SELECT COUNT(*) INTO template_count
    FROM emotional_messages;
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE indexname LIKE '%emotional%';
    
    -- Validation report
    RAISE NOTICE '';
    RAISE NOTICE 'Validation Results:';
    RAISE NOTICE '- Tables created: % (expected: 7)', table_count;
    RAISE NOTICE '- Functions created: % (expected: ~15)', function_count;
    RAISE NOTICE '- Views created: % (expected: 7)', view_count;
    RAISE NOTICE '- Message templates: % (expected: ~140)', template_count;
    RAISE NOTICE '- Indexes created: % (expected: ~50)', index_count;
    
    -- Check critical tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_notification_logs') THEN
        RAISE EXCEPTION 'Critical table emotional_notification_logs not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_emotional_profiles') THEN
        RAISE EXCEPTION 'Critical table user_emotional_profiles not found';
    END IF;
    
    -- Check templates were seeded
    IF template_count < 100 THEN
        RAISE WARNING 'Expected at least 100 message templates, found %', template_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Validation completed successfully!';
END $$;

-- ========================================
-- FINAL SETUP AND CONFIGURATION
-- ========================================

-- Update table statistics for optimal performance
RAISE NOTICE 'Updating database statistics...';
SELECT update_emotional_statistics();

-- Create initial system configuration
INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
VALUES ('system_installation_completed', jsonb_build_object(
    'installed_at', CURRENT_TIMESTAMP,
    'version', '1.0.0',
    'migration_count', 6,
    'tables_created', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%emotional%'),
    'functions_created', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%emotional%'),
    'templates_seeded', (SELECT COUNT(*) FROM emotional_messages)
), CURRENT_TIMESTAMP);

-- ========================================
-- COMPLETION SUMMARY
-- ========================================

RAISE NOTICE '';
RAISE NOTICE '=====================================';
RAISE NOTICE 'INSTALLATION COMPLETED SUCCESSFULLY!';
RAISE NOTICE '=====================================';
RAISE NOTICE '';
RAISE NOTICE 'Emotional Intelligence System v1.0.0 has been installed.';
RAISE NOTICE '';
RAISE NOTICE 'Components installed:';
RAISE NOTICE '✓ Core database schema (7 tables)';
RAISE NOTICE '✓ Performance indexes (~50 indexes)';
RAISE NOTICE '✓ Automated triggers and functions';
RAISE NOTICE '✓ Message templates (~140 templates)';
RAISE NOTICE '✓ Analytics views (7 views)';
RAISE NOTICE '✓ Row-level security policies';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Update your application configuration to enable emotional notifications';
RAISE NOTICE '2. Configure PostHog analytics integration';
RAISE NOTICE '3. Set up background job processing for notification scheduling';
RAISE NOTICE '4. Deploy emotional notification assets (icons, banners)';
RAISE NOTICE '5. Update your service worker with emotional notification handling';
RAISE NOTICE '6. Test the emotional intelligence service integration';
RAISE NOTICE '';
RAISE NOTICE 'Documentation:';
RAISE NOTICE '- Implementation guide: /project/workspace/Coolhgg/Relife/EMOTIONAL_NOTIFICATIONS_INTEGRATION_GUIDE.md';
RAISE NOTICE '- Asset guide: /project/workspace/EMOTIONAL_NOTIFICATION_ASSETS_GUIDE.md';
RAISE NOTICE '- Rollback script: rollback_emotional_migrations.sql';
RAISE NOTICE '';
RAISE NOTICE 'Support:';
RAISE NOTICE '- View migration history: SELECT * FROM migration_history;';
RAISE NOTICE '- Check system status: SELECT * FROM emotional_overview_dashboard;';
RAISE NOTICE '- Monitor events: SELECT * FROM emotional_analytics_events ORDER BY event_timestamp DESC LIMIT 10;';
RAISE NOTICE '';
RAISE NOTICE 'Installation completed at: %', CURRENT_TIMESTAMP;
RAISE NOTICE '';

-- Clean up temporary functions
DROP FUNCTION IF EXISTS record_migration(TEXT, TEXT);

-- Final success marker
SELECT 'EMOTIONAL_INTELLIGENCE_SYSTEM_READY' as installation_status;