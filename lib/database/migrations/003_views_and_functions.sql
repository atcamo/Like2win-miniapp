-- Migration 003: Add Views and Helper Functions
-- Date: 2025-01-27
-- Description: Create helpful views and database functions

-- Views for common queries
-- Current active raffle view
CREATE OR REPLACE VIEW current_raffle AS
SELECT * FROM raffles 
WHERE status IN ('upcoming', 'active') 
ORDER BY start_date DESC 
LIMIT 1;

-- Raffle leaderboard view
CREATE OR REPLACE VIEW raffle_leaderboard AS
SELECT 
  u.fid,
  u.username,
  u.display_name,
  u.pfp_url,
  re.tickets,
  re.raffle_id,
  u.total_lifetime_tickets,
  re.last_participation_at
FROM raffle_entries re
JOIN users u ON re.user_id = u.id
JOIN raffles r ON re.raffle_id = r.id
WHERE r.status = 'active'
ORDER BY re.tickets DESC;

-- User comprehensive stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.fid,
  u.username,
  u.display_name,
  u.pfp_url,
  u.wallet_address,
  u.tip_allowance_enabled,
  u.is_following_like2win,
  u.total_lifetime_tickets,
  u.total_winnings,
  COUNT(DISTINCT re.raffle_id) as raffles_participated,
  COUNT(DISTINCT rw.id) as raffles_won,
  COALESCE(current_entry.tickets, 0) as current_raffle_tickets,
  COALESCE(current_entry.last_participation_at, u.created_at) as last_activity,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN raffle_entries re ON u.id = re.user_id
LEFT JOIN raffle_winners rw ON u.id = rw.user_id
LEFT JOIN LATERAL (
  SELECT re2.tickets, re2.last_participation_at
  FROM raffle_entries re2
  JOIN raffles r2 ON re2.raffle_id = r2.id
  WHERE re2.user_id = u.id AND r2.status = 'active'
  LIMIT 1
) current_entry ON true
GROUP BY u.id, u.fid, u.username, u.display_name, u.pfp_url, u.wallet_address,
         u.tip_allowance_enabled, u.is_following_like2win, u.total_lifetime_tickets, 
         u.total_winnings, current_entry.tickets, current_entry.last_participation_at, 
         u.created_at, u.updated_at;

-- Recent winners view
CREATE OR REPLACE VIEW recent_winners AS
SELECT 
  rw.id,
  rw.position,
  rw.prize_amount,
  rw.transaction_hash,
  rw.claimed_at,
  rw.created_at,
  u.fid,
  u.username,
  u.display_name,
  u.pfp_url,
  r.id as raffle_id,
  r.end_date as raffle_end_date,
  r.prize_pool as raffle_total_pool
FROM raffle_winners rw
JOIN users u ON rw.user_id = u.id
JOIN raffles r ON rw.raffle_id = r.id
ORDER BY rw.created_at DESC;

-- Active posts view (posts that can currently generate tickets)
CREATE OR REPLACE VIEW active_posts AS
SELECT 
  p.id,
  p.cast_hash,
  p.cast_url,
  p.text_content,
  p.author_fid,
  p.engagement_type,
  p.created_at,
  r.id as raffle_id,
  r.status as raffle_status,
  r.end_date as raffle_end_date,
  COUNT(pp.id) as total_participations
FROM posts p
JOIN raffles r ON p.raffle_id = r.id
LEFT JOIN post_participations pp ON p.id = pp.post_id
WHERE p.is_eligible = true 
  AND r.status = 'active'
GROUP BY p.id, p.cast_hash, p.cast_url, p.text_content, p.author_fid, 
         p.engagement_type, p.created_at, r.id, r.status, r.end_date
ORDER BY p.created_at DESC;

-- Helper functions

-- Function to get user's current raffle status
CREATE OR REPLACE FUNCTION get_user_raffle_status(user_fid BIGINT)
RETURNS TABLE(
  user_id UUID,
  fid BIGINT,
  username VARCHAR(255),
  is_following BOOLEAN,
  tip_allowance_enabled BOOLEAN,
  current_tickets INTEGER,
  raffle_id UUID,
  raffle_status VARCHAR(20),
  raffle_end_date TIMESTAMP WITH TIME ZONE,
  total_participants INTEGER,
  total_pool DECIMAL(18, 8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.fid,
    u.username,
    u.is_following_like2win,
    u.tip_allowance_enabled,
    COALESCE(re.tickets, 0)::INTEGER,
    r.id,
    r.status,
    r.end_date,
    r.total_participants,
    r.prize_pool
  FROM users u
  LEFT JOIN raffle_entries re ON u.id = re.user_id
  LEFT JOIN raffles r ON re.raffle_id = r.id AND r.status = 'active'
  WHERE u.fid = user_fid;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can participate in a post
CREATE OR REPLACE FUNCTION can_user_participate_in_post(user_fid BIGINT, post_cast_hash VARCHAR(255))
RETURNS TABLE(
  can_participate BOOLEAN,
  reason VARCHAR(255),
  required_actions TEXT[]
) AS $$
DECLARE
  user_record RECORD;
  post_record RECORD;
  existing_participation RECORD;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM users WHERE fid = user_fid;
  
  -- Check if user exists
  IF user_record IS NULL THEN
    RETURN QUERY SELECT false, 'User not found', ARRAY['Register first']::TEXT[];
    RETURN;
  END IF;
  
  -- Check if user is following Like2Win
  IF NOT user_record.is_following_like2win THEN
    RETURN QUERY SELECT false, 'Must follow @Like2Win', ARRAY['Follow @Like2Win']::TEXT[];
    RETURN;
  END IF;
  
  -- Get post info
  SELECT p.*, r.status as raffle_status 
  INTO post_record 
  FROM posts p
  JOIN raffles r ON p.raffle_id = r.id
  WHERE p.cast_hash = post_cast_hash;
  
  -- Check if post exists and is eligible
  IF post_record IS NULL THEN
    RETURN QUERY SELECT false, 'Post not found', ARRAY['Post does not exist']::TEXT[];
    RETURN;
  END IF;
  
  IF NOT post_record.is_eligible THEN
    RETURN QUERY SELECT false, 'Post not eligible for tickets', ARRAY['Post is not eligible']::TEXT[];
    RETURN;
  END IF;
  
  IF post_record.raffle_status != 'active' THEN
    RETURN QUERY SELECT false, 'Raffle not active', ARRAY['Wait for active raffle']::TEXT[];
    RETURN;
  END IF;
  
  -- Check if user already participated in this post
  SELECT * INTO existing_participation 
  FROM post_participations pp
  JOIN posts p ON pp.post_id = p.id
  WHERE pp.user_id = user_record.id AND p.cast_hash = post_cast_hash;
  
  IF existing_participation IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Already participated in this post', ARRAY['Find another post to like']::TEXT[];
    RETURN;
  END IF;
  
  -- Determine required actions based on tip allowance
  IF user_record.tip_allowance_enabled THEN
    RETURN QUERY SELECT true, 'Can participate with like only', ARRAY['Like the post']::TEXT[];
  ELSE
    RETURN QUERY SELECT true, 'Can participate with full engagement', ARRAY['Like the post', 'Comment on the post', 'Recast the post']::TEXT[];
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- Function to calculate raffle probabilities
CREATE OR REPLACE FUNCTION calculate_raffle_probabilities(raffle_uuid UUID)
RETURNS TABLE(
  user_id UUID,
  fid BIGINT,
  username VARCHAR(255),
  tickets INTEGER,
  probability_percent DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    re.user_id,
    u.fid,
    u.username,
    re.tickets,
    CASE 
      WHEN r.total_tickets > 0 THEN 
        ROUND((re.tickets::DECIMAL / r.total_tickets * 100), 2)
      ELSE 0::DECIMAL(5,2)
    END
  FROM raffle_entries re
  JOIN users u ON re.user_id = u.id
  JOIN raffles r ON re.raffle_id = r.id
  WHERE re.raffle_id = raffle_uuid
  ORDER BY re.tickets DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get raffle statistics
CREATE OR REPLACE FUNCTION get_raffle_stats(raffle_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  raffle_id UUID,
  status VARCHAR(20),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  prize_pool DECIMAL(18, 8),
  total_tickets INTEGER,
  total_participants INTEGER,
  avg_tickets_per_user DECIMAL(10, 2),
  top_participant_tickets INTEGER,
  eligible_posts_count BIGINT
) AS $$
BEGIN
  -- If no raffle_id provided, get current active raffle
  IF raffle_uuid IS NULL THEN
    SELECT id INTO raffle_uuid FROM current_raffle LIMIT 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.status,
    r.start_date,
    r.end_date,
    r.prize_pool,
    r.total_tickets,
    r.total_participants,
    CASE 
      WHEN r.total_participants > 0 THEN 
        ROUND(r.total_tickets::DECIMAL / r.total_participants, 2)
      ELSE 0::DECIMAL(10, 2)
    END,
    COALESCE(MAX(re.tickets), 0)::INTEGER,
    COUNT(DISTINCT p.id)
  FROM raffles r
  LEFT JOIN raffle_entries re ON r.id = re.raffle_id
  LEFT JOIN posts p ON r.id = p.raffle_id AND p.is_eligible = true
  WHERE r.id = raffle_uuid
  GROUP BY r.id, r.status, r.start_date, r.end_date, r.prize_pool, 
           r.total_tickets, r.total_participants;
END;
$$ LANGUAGE plpgsql;