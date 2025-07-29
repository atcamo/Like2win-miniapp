-- Migration 002: Add Indexes and Triggers
-- Date: 2025-01-27
-- Description: Add performance indexes and automatic triggers

-- Performance indexes
DO $$
BEGIN
  -- Users indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_users_fid') THEN
    CREATE INDEX idx_users_fid ON users(fid);
    RAISE NOTICE 'Created index: idx_users_fid';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_users_wallet_address') THEN
    CREATE INDEX idx_users_wallet_address ON users(wallet_address);
    RAISE NOTICE 'Created index: idx_users_wallet_address';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_users_following') THEN
    CREATE INDEX idx_users_following ON users(is_following_like2win);
    RAISE NOTICE 'Created index: idx_users_following';
  END IF;

  -- Raffles indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_raffles_status') THEN
    CREATE INDEX idx_raffles_status ON raffles(status);
    RAISE NOTICE 'Created index: idx_raffles_status';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_raffles_dates') THEN
    CREATE INDEX idx_raffles_dates ON raffles(start_date, end_date);
    RAISE NOTICE 'Created index: idx_raffles_dates';
  END IF;

  -- Raffle entries indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_raffle_entries_user_raffle') THEN
    CREATE INDEX idx_raffle_entries_user_raffle ON raffle_entries(user_id, raffle_id);
    RAISE NOTICE 'Created index: idx_raffle_entries_user_raffle';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_raffle_entries_raffle') THEN
    CREATE INDEX idx_raffle_entries_raffle ON raffle_entries(raffle_id);
    RAISE NOTICE 'Created index: idx_raffle_entries_raffle';
  END IF;

  -- Posts indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_posts_cast_hash') THEN
    CREATE INDEX idx_posts_cast_hash ON posts(cast_hash);
    RAISE NOTICE 'Created index: idx_posts_cast_hash';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_posts_raffle') THEN
    CREATE INDEX idx_posts_raffle ON posts(raffle_id);
    RAISE NOTICE 'Created index: idx_posts_raffle';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_posts_eligible') THEN
    CREATE INDEX idx_posts_eligible ON posts(is_eligible);
    RAISE NOTICE 'Created index: idx_posts_eligible';
  END IF;

  -- Post participations indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_post_participations_user_post') THEN
    CREATE INDEX idx_post_participations_user_post ON post_participations(user_id, post_id);
    RAISE NOTICE 'Created index: idx_post_participations_user_post';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_post_participations_post') THEN
    CREATE INDEX idx_post_participations_post ON post_participations(post_id);
    RAISE NOTICE 'Created index: idx_post_participations_post';
  END IF;

  -- Winners indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_raffle_winners_raffle') THEN
    CREATE INDEX idx_raffle_winners_raffle ON raffle_winners(raffle_id);
    RAISE NOTICE 'Created index: idx_raffle_winners_raffle';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_raffle_winners_user') THEN
    CREATE INDEX idx_raffle_winners_user ON raffle_winners(user_id);
    RAISE NOTICE 'Created index: idx_raffle_winners_user';
  END IF;

  -- Notifications indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_notifications_user') THEN
    CREATE INDEX idx_notifications_user ON notifications(user_id);
    RAISE NOTICE 'Created index: idx_notifications_user';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_notifications_unread') THEN
    CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
    RAISE NOTICE 'Created index: idx_notifications_unread';
  END IF;

  -- Activity log indexes
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_activity_log_user') THEN
    CREATE INDEX idx_activity_log_user ON activity_log(user_id);
    RAISE NOTICE 'Created index: idx_activity_log_user';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_activity_log_action') THEN
    CREATE INDEX idx_activity_log_action ON activity_log(action);
    RAISE NOTICE 'Created index: idx_activity_log_action';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_activity_log_created') THEN
    CREATE INDEX idx_activity_log_created ON activity_log(created_at);
    RAISE NOTICE 'Created index: idx_activity_log_created';
  END IF;

END $$;

-- Function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at fields
DO $$
BEGIN
  -- Users trigger
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_users_updated_at';
  END IF;

  -- Raffles trigger
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_raffles_updated_at') THEN
    CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_raffles_updated_at';
  END IF;

  -- Raffle entries trigger
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_raffle_entries_updated_at') THEN
    CREATE TRIGGER update_raffle_entries_updated_at BEFORE UPDATE ON raffle_entries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_raffle_entries_updated_at';
  END IF;

  -- Posts trigger
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_posts_updated_at') THEN
    CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_posts_updated_at';
  END IF;

  -- Post participations trigger
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_post_participations_updated_at') THEN
    CREATE TRIGGER update_post_participations_updated_at BEFORE UPDATE ON post_participations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_post_participations_updated_at';
  END IF;

  -- User settings trigger
  IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_user_settings_updated_at') THEN
    CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_user_settings_updated_at';
  END IF;

END $$;