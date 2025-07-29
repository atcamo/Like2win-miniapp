-- Like2Win Database Seed Data
-- This file contains sample data for development and testing

-- Insert sample users
INSERT INTO users (fid, username, display_name, pfp_url, wallet_address, tip_allowance_enabled, is_following_like2win, total_lifetime_tickets, total_winnings) VALUES
(12345, 'alice.eth', 'Alice Cooper', 'https://i.imgur.com/placeholder1.jpg', '0x1234567890123456789012345678901234567890', true, true, 150, 1250.50),
(23456, 'bob_crypto', 'Bob Builder', 'https://i.imgur.com/placeholder2.jpg', '0x2345678901234567890123456789012345678901', false, true, 89, 0),
(34567, 'charlie.base', 'Charlie Chain', 'https://i.imgur.com/placeholder3.jpg', '0x3456789012345678901234567890123456789012', true, true, 234, 2100.25),
(45678, 'diana_degen', 'Diana Dollar', 'https://i.imgur.com/placeholder4.jpg', '0x4567890123456789012345678901234567890123', false, true, 67, 0),
(56789, 'eve.farcaster', 'Eve Ethereum', 'https://i.imgur.com/placeholder5.jpg', NULL, false, false, 0, 0)
ON CONFLICT (fid) DO NOTHING;

-- Insert sample raffles
WITH raffle_data AS (
  SELECT 
    uuid_generate_v4() as id,
    (NOW() - INTERVAL '7 days') as start_date,
    (NOW() - INTERVAL '1 day') as end_date,
    'completed' as status,
    2500.75 as prize_pool,
    450 as total_tickets,
    23 as total_participants,
    'req_123456' as chainlink_vrf_request_id,
    '[12345, 67890, 11111]' as random_words
  UNION ALL
  SELECT 
    uuid_generate_v4() as id,
    NOW() as start_date,
    (NOW() + INTERVAL '6 days') as end_date,
    'active' as status,
    1850.25 as prize_pool,
    267 as total_tickets,
    18 as total_participants,
    NULL as chainlink_vrf_request_id,
    NULL as random_words
  UNION ALL
  SELECT 
    uuid_generate_v4() as id,
    (NOW() + INTERVAL '7 days') as start_date,
    (NOW() + INTERVAL '13 days') as end_date,
    'upcoming' as status,
    0 as prize_pool,
    0 as total_tickets,
    0 as total_participants,
    NULL as chainlink_vrf_request_id,
    NULL as random_words
)
INSERT INTO raffles (id, start_date, end_date, status, prize_pool, total_tickets, total_participants, chainlink_vrf_request_id, random_words)
SELECT * FROM raffle_data;

-- Get raffle IDs for foreign key references
WITH current_raffles AS (
  SELECT id, status FROM raffles ORDER BY start_date DESC LIMIT 3
),
active_raffle AS (
  SELECT id FROM current_raffles WHERE status = 'active' LIMIT 1
),
completed_raffle AS (
  SELECT id FROM current_raffles WHERE status = 'completed' LIMIT 1
)

-- Insert sample posts for active raffle
INSERT INTO posts (cast_hash, cast_url, text_content, author_fid, raffle_id, is_eligible, engagement_type)
SELECT 
  'hash_' || generate_random_uuid()::text,
  'https://warpcast.com/like2win/' || generate_random_uuid()::text,
  post_content,
  99999, -- Like2Win's FID
  (SELECT id FROM active_raffle),
  true,
  CASE WHEN random() > 0.7 THEN 'like_comment_recast' ELSE 'like' END
FROM (VALUES 
  ('🎲 New raffle is LIVE! Like this post to get your first ticket! 🎫'),
  ('💰 Current prize pool: 1,850 $DEGEN! Who will win this Wednesday? 🏆'),
  ('🚀 The more you engage, the more chances you have! Follow + Like = Win! ✨'),
  ('⚡ Quick reminder: Bi-weekly raffles every Wednesday and Sunday at 8PM UTC!'),
  ('🎯 Pro tip: Enable tip allowance for 1-click participation! Like = Ticket! 🎫')
) AS posts_data(post_content);

-- Insert raffle entries for active raffle
WITH user_ids AS (
  SELECT id, fid FROM users WHERE is_following_like2win = true
),
active_raffle AS (
  SELECT id FROM raffles WHERE status = 'active' LIMIT 1
)
INSERT INTO raffle_entries (user_id, raffle_id, tickets, last_participation_at)
SELECT 
  u.id,
  ar.id,
  CASE u.fid
    WHEN 12345 THEN 45
    WHEN 23456 THEN 23
    WHEN 34567 THEN 67
    WHEN 45678 THEN 12
    ELSE 5
  END,
  NOW() - (INTERVAL '1 hour' * random() * 24)
FROM user_ids u
CROSS JOIN active_raffle ar
WHERE u.fid IN (12345, 23456, 34567, 45678);

-- Insert sample post participations
WITH user_posts AS (
  SELECT 
    u.id as user_id,
    p.id as post_id,
    u.tip_allowance_enabled,
    row_number() OVER (PARTITION BY u.id ORDER BY p.created_at) as post_order
  FROM users u
  CROSS JOIN posts p
  WHERE u.is_following_like2win = true
    AND random() > 0.3 -- 70% chance of participation
)
INSERT INTO post_participations (user_id, post_id, engagement_type, has_liked, has_commented, has_recasted, tickets_earned, engagement_completed_at)
SELECT 
  user_id,
  post_id,
  CASE 
    WHEN tip_allowance_enabled THEN 'like'
    ELSE 'like_comment_recast'
  END,
  true,
  CASE WHEN tip_allowance_enabled THEN false ELSE true END,
  CASE WHEN tip_allowance_enabled THEN false ELSE true END,
  1,
  NOW() - (INTERVAL '1 hour' * random() * 48)
FROM user_posts
WHERE post_order <= 3; -- Each user participates in up to 3 posts

-- Insert sample winners for completed raffle
WITH completed_raffle AS (
  SELECT id FROM raffles WHERE status = 'completed' LIMIT 1
),
winner_users AS (
  SELECT id, fid FROM users WHERE fid IN (12345, 34567, 23456) -- Top participants
)
INSERT INTO raffle_winners (raffle_id, user_id, position, prize_amount, transaction_hash, claimed_at)
SELECT 
  cr.id,
  wu.id,
  CASE wu.fid
    WHEN 12345 THEN 1  -- 1st place
    WHEN 34567 THEN 2  -- 2nd place  
    WHEN 23456 THEN 3  -- 3rd place
  END,
  CASE wu.fid
    WHEN 12345 THEN 1500.45  -- 60% of 2500.75
    WHEN 34567 THEN 750.23   -- 30% of 2500.75
    WHEN 23456 THEN 250.07   -- 10% of 2500.75
  END,
  '0x' || md5(random()::text || wu.fid::text) || md5(random()::text),
  NOW() - INTERVAL '1 day'
FROM completed_raffle cr
CROSS JOIN winner_users wu;

-- Insert sample user settings
INSERT INTO user_settings (user_id, raffle_reminders, result_announcements, winner_notifications, system_updates, notification_details)
SELECT 
  id,
  true,
  true,
  true,
  CASE WHEN random() > 0.5 THEN true ELSE false END,
  CASE 
    WHEN random() > 0.7 THEN 
      '{"url": "https://api.warpcast.com/webhooks/frame", "token": "sample_token_' || fid::text || '"}'::jsonb
    ELSE NULL
  END
FROM users;

-- Insert sample notifications
WITH notification_data AS (
  SELECT 
    u.id as user_id,
    notification_type,
    title,
    message,
    CASE WHEN random() > 0.6 THEN true ELSE false END as is_read,
    NOW() - (INTERVAL '1 hour' * random() * 168) as created_at -- Last week
  FROM users u
  CROSS JOIN (VALUES 
    ('raffle_reminder', '🎲 Raffle Ending Soon!', 'The current raffle ends in 2 hours. Make sure you have your tickets!'),
    ('winner_announcement', '🏆 Raffle Results Are In!', 'Check out who won this week''s raffle. Congratulations to all winners!'),
    ('system_update', '⚡ New Feature Available', 'We''ve added real-time ticket tracking! Check your status anytime.'),
    ('raffle_reminder', '🎫 New Raffle Started!', 'A fresh raffle just started. Start earning tickets now!')
  ) AS notif_types(notification_type, title, message)
  WHERE u.is_following_like2win = true
    AND random() > 0.4 -- 60% chance of having notifications
)
INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
SELECT user_id, notification_type, title, message, is_read, created_at
FROM notification_data;

-- Insert sample activity log
WITH activity_data AS (
  SELECT 
    u.id as user_id,
    action_type,
    details,
    '192.168.1.' || (random() * 255)::int as ip_address,
    'Mozilla/5.0 (compatible; FarcasterBot/1.0)' as user_agent,
    NOW() - (INTERVAL '1 minute' * random() * 10080) as created_at -- Last week
  FROM users u
  CROSS JOIN (VALUES 
    ('like_post', '{"post_hash": "sample_hash_123", "tickets_earned": 1}'),
    ('earn_ticket', '{"raffle_id": "sample_uuid", "total_tickets": 25}'),
    ('join_raffle', '{"raffle_id": "sample_uuid", "first_participation": true}'),
    ('view_status', '{"page": "raffle_status", "tickets": 15}'),
    ('share_frame', '{"frame_url": "https://like2win.app/frame", "platform": "farcaster"}')
  ) AS activity_types(action_type, details)
  WHERE random() > 0.2 -- 80% chance of having activity
)
INSERT INTO activity_log (user_id, action, details, ip_address, user_agent, created_at)
SELECT 
  user_id, 
  action_type, 
  details::jsonb, 
  ip_address::inet, 
  user_agent, 
  created_at
FROM activity_data;

-- Update raffle totals based on entries
UPDATE raffles 
SET 
  total_tickets = (
    SELECT COALESCE(SUM(tickets), 0) 
    FROM raffle_entries 
    WHERE raffle_id = raffles.id
  ),
  total_participants = (
    SELECT COUNT(DISTINCT user_id) 
    FROM raffle_entries 
    WHERE raffle_id = raffles.id
  )
WHERE status IN ('active', 'completed');

-- Update user total lifetime tickets
UPDATE users 
SET total_lifetime_tickets = (
  SELECT COALESCE(SUM(tickets), 0)
  FROM raffle_entries re
  WHERE re.user_id = users.id
);

-- Add a helper function to generate realistic sample data
CREATE OR REPLACE FUNCTION generate_sample_cast_hash()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN '0x' || md5(random()::text || NOW()::text);
END;
$$ LANGUAGE plpgsql;

-- Add some sample debug data (optional, for development)
-- This creates realistic-looking data for testing the UI
DO $$
DECLARE
  active_raffle_id UUID;
  sample_user_id UUID;
BEGIN
  -- Get active raffle
  SELECT id INTO active_raffle_id FROM raffles WHERE status = 'active' LIMIT 1;
  
  IF active_raffle_id IS NOT NULL THEN
    -- Add some more sample posts with realistic timing
    INSERT INTO posts (cast_hash, cast_url, text_content, author_fid, raffle_id, is_eligible, engagement_type, created_at)
    VALUES 
    (generate_sample_cast_hash(), 'https://warpcast.com/like2win/cast1', '🎯 Mid-week check-in! How many tickets do you have so far?', 99999, active_raffle_id, true, 'like', NOW() - INTERVAL '2 hours'),
    (generate_sample_cast_hash(), 'https://warpcast.com/like2win/cast2', '⚡ Final day to earn tickets! Raffle draws tomorrow at 8PM UTC!', 99999, active_raffle_id, true, 'like', NOW() - INTERVAL '30 minutes'),
    (generate_sample_cast_hash(), 'https://warpcast.com/like2win/cast3', '🏆 Current leaderboard is heating up! Who will claim the top spot?', 99999, active_raffle_id, true, 'like_comment_recast', NOW() - INTERVAL '1 hour');
  END IF;
END $$;

-- Create indexes on sample data for better performance during development
ANALYZE users;
ANALYZE raffles;
ANALYZE raffle_entries;
ANALYZE posts;
ANALYZE post_participations;
ANALYZE raffle_winners;

-- Display summary of seeded data
SELECT 
  'Users' as table_name, 
  COUNT(*) as record_count,
  COUNT(*) FILTER (WHERE is_following_like2win = true) as following_count
FROM users
UNION ALL
SELECT 
  'Raffles', 
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'active')
FROM raffles
UNION ALL
SELECT 
  'Raffle Entries', 
  COUNT(*),
  NULL
FROM raffle_entries
UNION ALL
SELECT 
  'Posts', 
  COUNT(*),
  COUNT(*) FILTER (WHERE is_eligible = true)
FROM posts
UNION ALL
SELECT 
  'Participations', 
  COUNT(*),
  COUNT(*) FILTER (WHERE tickets_earned > 0)
FROM post_participations
UNION ALL
SELECT 
  'Winners', 
  COUNT(*),
  NULL
FROM raffle_winners;