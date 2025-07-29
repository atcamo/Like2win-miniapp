-- Migration 001: Initial Like2Win Schema
-- Date: 2025-01-27
-- Description: Create initial database schema for raffle participation tracking

-- This migration creates all necessary tables for the Like2Win raffle system
-- Run this migration against your PostgreSQL database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if tables exist before creating them
DO $$
BEGIN
  -- Users table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      fid BIGINT UNIQUE NOT NULL,
      username VARCHAR(255),
      display_name VARCHAR(255),
      pfp_url TEXT,
      wallet_address VARCHAR(42),
      tip_allowance_enabled BOOLEAN DEFAULT false,
      is_following_like2win BOOLEAN DEFAULT false,
      total_lifetime_tickets INTEGER DEFAULT 0,
      total_winnings DECIMAL(18, 8) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created table: users';
  END IF;

  -- Raffles table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'raffles') THEN
    CREATE TABLE raffles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'drawing', 'completed', 'cancelled')),
      prize_pool DECIMAL(18, 8) DEFAULT 0,
      total_tickets INTEGER DEFAULT 0,
      total_participants INTEGER DEFAULT 0,
      chainlink_vrf_request_id VARCHAR(255),
      random_words TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created table: raffles';
  END IF;

  -- Raffle entries table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'raffle_entries') THEN
    CREATE TABLE raffle_entries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
      tickets INTEGER DEFAULT 0,
      last_participation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, raffle_id)
    );
    
    RAISE NOTICE 'Created table: raffle_entries';
  END IF;

  -- Posts table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts') THEN
    CREATE TABLE posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cast_hash VARCHAR(255) UNIQUE NOT NULL,
      cast_url TEXT,
      text_content TEXT,
      author_fid BIGINT NOT NULL,
      raffle_id UUID REFERENCES raffles(id) ON DELETE SET NULL,
      is_eligible BOOLEAN DEFAULT true,
      engagement_type VARCHAR(50) DEFAULT 'like' CHECK (engagement_type IN ('like', 'like_comment_recast')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created table: posts';
  END IF;

  -- Post participations table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'post_participations') THEN
    CREATE TABLE post_participations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      engagement_type VARCHAR(50) NOT NULL CHECK (engagement_type IN ('like', 'comment', 'recast', 'like_comment_recast')),
      has_liked BOOLEAN DEFAULT false,
      has_commented BOOLEAN DEFAULT false,
      has_recasted BOOLEAN DEFAULT false,
      tickets_earned INTEGER DEFAULT 0,
      engagement_completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    );
    
    RAISE NOTICE 'Created table: post_participations';
  END IF;

  -- Raffle winners table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'raffle_winners') THEN
    CREATE TABLE raffle_winners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position INTEGER NOT NULL CHECK (position IN (1, 2, 3)),
      prize_amount DECIMAL(18, 8) NOT NULL,
      transaction_hash VARCHAR(66),
      claimed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(raffle_id, position),
      UNIQUE(raffle_id, user_id)
    );
    
    RAISE NOTICE 'Created table: raffle_winners';
  END IF;

  -- Notifications table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('raffle_reminder', 'winner_announcement', 'prize_claim', 'system_update')),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created table: notifications';
  END IF;

  -- User settings table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    CREATE TABLE user_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      raffle_reminders BOOLEAN DEFAULT true,
      result_announcements BOOLEAN DEFAULT true,
      winner_notifications BOOLEAN DEFAULT true,
      system_updates BOOLEAN DEFAULT true,
      notification_details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created table: user_settings';
  END IF;

  -- Activity log table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    CREATE TABLE activity_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created table: activity_log';
  END IF;

END $$;