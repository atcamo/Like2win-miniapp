-- Like2Win Database Schema
-- Complete schema for raffle participation tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - Farcaster users participating in raffles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fid BIGINT UNIQUE NOT NULL, -- Farcaster ID
  username VARCHAR(255),
  display_name VARCHAR(255),
  pfp_url TEXT,
  wallet_address VARCHAR(42), -- Ethereum address (0x...)
  tip_allowance_enabled BOOLEAN DEFAULT false,
  is_following_like2win BOOLEAN DEFAULT false,
  total_lifetime_tickets INTEGER DEFAULT 0,
  total_winnings DECIMAL(18, 8) DEFAULT 0, -- $DEGEN amount
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raffles table - Bi-weekly raffle cycles
CREATE TABLE raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'drawing', 'completed', 'cancelled')),
  prize_pool DECIMAL(18, 8) DEFAULT 0, -- Total $DEGEN in pool
  total_tickets INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  chainlink_vrf_request_id VARCHAR(255), -- For provably fair draws
  random_words TEXT, -- Chainlink VRF result
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raffle entries - User participation in specific raffles
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

-- Posts table - Official Like2Win posts that generate tickets
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cast_hash VARCHAR(255) UNIQUE NOT NULL, -- Farcaster cast hash
  cast_url TEXT,
  text_content TEXT,
  author_fid BIGINT NOT NULL, -- Should be Like2Win's FID
  raffle_id UUID REFERENCES raffles(id) ON DELETE SET NULL,
  is_eligible BOOLEAN DEFAULT true, -- Whether this post generates tickets
  engagement_type VARCHAR(50) DEFAULT 'like' CHECK (engagement_type IN ('like', 'like_comment_recast')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post participations - Track user engagement with specific posts
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

-- Raffle winners - Results of completed raffles
CREATE TABLE raffle_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position IN (1, 2, 3)), -- 1st, 2nd, 3rd place
  prize_amount DECIMAL(18, 8) NOT NULL,
  transaction_hash VARCHAR(66), -- Ethereum transaction hash for prize distribution
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(raffle_id, position),
  UNIQUE(raffle_id, user_id)
);

-- Notifications table - User notification preferences and history
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

-- User settings - Notification preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raffle_reminders BOOLEAN DEFAULT true,
  result_announcements BOOLEAN DEFAULT true,
  winner_notifications BOOLEAN DEFAULT true,
  system_updates BOOLEAN DEFAULT true,
  notification_details JSONB, -- Farcaster notification details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log - Track all user actions for analytics
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'like_post', 'earn_ticket', 'join_raffle', etc.
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_users_fid ON users(fid);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_following ON users(is_following_like2win);

CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_dates ON raffles(start_date, end_date);

CREATE INDEX idx_raffle_entries_user_raffle ON raffle_entries(user_id, raffle_id);
CREATE INDEX idx_raffle_entries_raffle ON raffle_entries(raffle_id);

CREATE INDEX idx_posts_cast_hash ON posts(cast_hash);
CREATE INDEX idx_posts_raffle ON posts(raffle_id);
CREATE INDEX idx_posts_eligible ON posts(is_eligible);

CREATE INDEX idx_post_participations_user_post ON post_participations(user_id, post_id);
CREATE INDEX idx_post_participations_post ON post_participations(post_id);

CREATE INDEX idx_raffle_winners_raffle ON raffle_winners(raffle_id);
CREATE INDEX idx_raffle_winners_user ON raffle_winners(user_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at fields
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raffle_entries_updated_at BEFORE UPDATE ON raffle_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_participations_updated_at BEFORE UPDATE ON post_participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW current_raffle AS
SELECT * FROM raffles 
WHERE status IN ('upcoming', 'active') 
ORDER BY start_date DESC 
LIMIT 1;

CREATE VIEW raffle_leaderboard AS
SELECT 
  u.fid,
  u.username,
  u.display_name,
  re.tickets,
  re.raffle_id,
  u.total_lifetime_tickets
FROM raffle_entries re
JOIN users u ON re.user_id = u.id
JOIN raffles r ON re.raffle_id = r.id
WHERE r.status = 'active'
ORDER BY re.tickets DESC;

CREATE VIEW user_stats AS
SELECT 
  u.id,
  u.fid,
  u.username,
  u.total_lifetime_tickets,
  u.total_winnings,
  COUNT(DISTINCT re.raffle_id) as raffles_participated,
  COUNT(DISTINCT rw.id) as raffles_won,
  COALESCE(SUM(pp.tickets_earned), 0) as current_raffle_tickets
FROM users u
LEFT JOIN raffle_entries re ON u.id = re.user_id
LEFT JOIN raffle_winners rw ON u.id = rw.user_id
LEFT JOIN post_participations pp ON u.id = pp.user_id
LEFT JOIN posts p ON pp.post_id = p.id
LEFT JOIN raffles current_r ON p.raffle_id = current_r.id AND current_r.status = 'active'
GROUP BY u.id, u.fid, u.username, u.total_lifetime_tickets, u.total_winnings;