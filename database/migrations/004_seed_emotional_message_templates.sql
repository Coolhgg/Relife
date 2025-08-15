-- Migration 004: Seed Emotional Message Templates
-- Description: Populate initial message templates from TypeScript definitions
-- Dependencies: 001_create_emotional_tables.sql
-- Version: 1.0.0

BEGIN;

-- Clear existing templates if re-running
DELETE FROM emotional_messages WHERE created_by IS NULL;

-- Helper function to insert message template
CREATE OR REPLACE FUNCTION insert_template(
    p_emotion emotion_type,
    p_tone emotional_tone,
    p_template TEXT,
    p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    template_id UUID;
BEGIN
    INSERT INTO emotional_messages (
        emotion_type,
        tone,
        template,
        tags,
        variables,
        created_by,
        is_active
    ) VALUES (
        p_emotion,
        p_tone,
        p_template,
        p_tags,
        jsonb_build_object(
            'available_variables', jsonb_build_array('name', 'missed_days', 'streak_days', 'missed_alarms', 'achievement', 'time', 'label'),
            'context_modifiers', jsonb_build_array('first_time', 'comeback', 'milestone', 'weekend', 'holiday')
        ),
        NULL, -- System-created template
        true
    ) RETURNING id INTO template_id;
    
    RETURN template_id;
END;
$$ LANGUAGE plpgsql;

-- SAD - User has missed alarms, broken streaks
-- Encouraging tone
SELECT insert_template('sad', 'encouraging', 'Hey {name}, I''m not angry... just disappointed. 😔 Remember when mornings used to be your thing?', '{"supportive", "gentle", "nostalgic"}');
SELECT insert_template('sad', 'encouraging', 'Missing you, {name}. Your {streak_days}-day streak is waiting for you to come back. 💙', '{"supportive", "streak_focused", "gentle"}');
SELECT insert_template('sad', 'encouraging', 'I''ve been sitting here for {missed_days} days, {name}. Ready to be friends again? 🤗', '{"friendship", "gentle", "comeback"}');
SELECT insert_template('sad', 'encouraging', '{name}, your future self sent a message: "Please don''t give up on me." Ready to try again? 💪', '{"motivational", "future_focused", "inspiring"}');
SELECT insert_template('sad', 'encouraging', 'No judgment here, {name}. Just wondering if you want to restart that amazing {streak_days}-day journey? 🌅', '{"non_judgmental", "positive", "journey"}');

-- Playful tone
SELECT insert_template('sad', 'playful', 'Psst {name}... your alarm is feeling lonely. Come rescue it! 🦸‍♂️', '{"playful", "rescue_theme", "heroic"}');
SELECT insert_template('sad', 'playful', 'Your streak called. It misses you. Should I tell it you''re coming back? 📞', '{"personification", "playful", "comeback"}');
SELECT insert_template('sad', 'playful', 'Breaking news: Local alarm spotted crying. Owner last seen {missed_days} days ago. 📰', '{"news_format", "humor", "personification"}');
SELECT insert_template('sad', 'playful', 'Alert: Your alarm has been promoted to "Professional Snooze Button". Want to demote it back? 🔄', '{"job_promotion", "humor", "action_needed"}');
SELECT insert_template('sad', 'playful', 'Your bed is currently winning {missed_days}-0 against your morning routine. Comeback time? 🏆', '{"competition", "sports", "comeback"}');

-- Firm tone
SELECT insert_template('sad', 'firm', 'You skipped {missed_days} days, {name}. One push now, one streak saved later. 💪', '{"direct", "action_oriented", "firm"}');
SELECT insert_template('sad', 'firm', 'Your goals don''t care about excuses, {name}. They care about action. Now. 🎯', '{"goal_focused", "no_excuses", "urgent"}');
SELECT insert_template('sad', 'firm', 'Missed alarms: {missed_alarms}. Excuses accepted: 0. Let''s go. ⚡', '{"statistics", "no_excuses", "action"}');
SELECT insert_template('sad', 'firm', '{missed_days} days is enough, {name}. Your comeback starts with one alarm. 🚀', '{"limit_setting", "comeback", "single_action"}');
SELECT insert_template('sad', 'firm', 'Wake up call: Champions don''t stay down this long. Time to prove you''re one. 🏅', '{"champion_mindset", "challenge", "proof"}');

-- Roast tone
SELECT insert_template('sad', 'roast', '{name} — still sleeping? Your bed is winning. Show up. 😤', '{"roast", "challenging", "bed_joke"}');
SELECT insert_template('sad', 'roast', 'Day {missed_days} of {name} vs Basic Morning Routine. Bed: {missed_days}, You: 0. 🛏️', '{"scoreboard", "roast", "competition"}');
SELECT insert_template('sad', 'roast', 'Your alarm: exists. Your snooze button: overworked. You: missing in action. 🚨', '{"status_update", "roast", "missing"}');
SELECT insert_template('sad', 'roast', 'Plot twist: Your mattress has become your life coach. Spoiler alert: it''s terrible advice. 📚', '{"plot_twist", "life_coach", "humor"}');
SELECT insert_template('sad', 'roast', 'Congratulations! You''ve achieved expert-level procrastination. Now try expert-level action. ⭐', '{"sarcastic_praise", "skill_comparison", "challenge"}');

-- WORRIED - 3-7 days inactive, concerning pattern
-- Encouraging tone
SELECT insert_template('worried', 'encouraging', 'It''s been {missed_days} days, {name}. Your alarm misses you. Ready for a comeback story? 💪', '{"comeback", "supportive", "story_theme"}');
SELECT insert_template('worried', 'encouraging', 'Hey {name}, tomorrow is a fresh start. Your best morning routine is waiting. ✨', '{"fresh_start", "optimistic", "waiting"}');
SELECT insert_template('worried', 'encouraging', 'No rush, {name}. Just wondering if you want to try again? Even 2 minutes counts. 🌱', '{"no_pressure", "small_steps", "growth"}');
SELECT insert_template('worried', 'encouraging', 'Your goals are still here, {name}. They''ve been patiently waiting for your return. ⏰', '{"patience", "goal_focused", "return"}');
SELECT insert_template('worried', 'encouraging', '{name}, small steps lead to big changes. Ready for one tiny step forward? 👣', '{"small_steps", "progress", "forward_movement"}');

-- Playful tone
SELECT insert_template('worried', 'playful', 'Houston, we have a problem. {name} has been MIA for {missed_days} days. Mission: Rescue! 🚀', '{"space_theme", "mission", "rescue"}');
SELECT insert_template('worried', 'playful', 'Your alarm filed a missing person report. Should I cancel it or will you show up? 🕵️‍♂️', '{"detective_theme", "missing_person", "choice"}');
SELECT insert_template('worried', 'playful', 'Alarm Status Update: Lonely but hopeful. Last seen with {name} {missed_days} days ago. 📍', '{"status_update", "lonely", "location"}');
SELECT insert_template('worried', 'playful', 'Your morning routine called in sick. Diagnosis: {name}-deficiency. Cure available! 💊', '{"medical_theme", "diagnosis", "cure"}');
SELECT insert_template('worried', 'playful', 'Breaking: Local alarm develops separation anxiety. Owner {name} needed for therapy session. 🛋️', '{"therapy_theme", "separation_anxiety", "needed"}');

-- Firm tone  
SELECT insert_template('worried', 'firm', '{missed_days} days, {name}. Your routine needs you back. Today. 💪', '{"direct", "need", "today"}');
SELECT insert_template('worried', 'firm', 'Pattern detected: {missed_days} days off track. Time to break the cycle. 🔄', '{"pattern_recognition", "cycle_breaking", "time"}');
SELECT insert_template('worried', 'firm', 'Your streak was {streak_days} days. Don''t let {missed_days} days undo all that work. ⚡', '{"streak_protection", "work_preservation", "urgency"}');
SELECT insert_template('worried', 'firm', '{name}: The gap between intention and action is {missed_days} days. Close it. 🎯', '{"gap_analysis", "intention_action", "close"}');
SELECT insert_template('worried', 'firm', 'Consistency creates champions, {name}. {missed_days} days isn''t consistent. Fix it. 🏆', '{"consistency", "champion_mindset", "fix"}');

-- Roast tone
SELECT insert_template('worried', 'roast', 'Week 1 of {name}''s ""temporary"" break from success. Still temporary? 🤔', '{"temporary_joke", "success_break", "questioning"}');
SELECT insert_template('worried', 'roast', '{name}''s alarm: ""Am I a joke to you?"" You, apparently: ""Yes."" 😑', '{"conversation", "joke_theme", "apparently"}');
SELECT insert_template('worried', 'roast', 'Your snooze button is getting carpal tunnel from overuse. Show some mercy. 🖱️', '{"medical_humor", "overuse", "mercy"}');
SELECT insert_template('worried', 'roast', 'Fun fact: {missed_days} days is exactly how long it takes to forget you had goals. 🧠', '{"fun_fact", "forgetting", "goals"}');
SELECT insert_template('worried', 'roast', 'Professional sleeper application received. Unfortunately, we need morning people. Try again? 💼', '{"job_application", "professional_sleeper", "need"}');

-- LONELY - Long absence, user seems disengaged
-- Encouraging tone
SELECT insert_template('lonely', 'encouraging', 'I''ve been here every morning, {name}, just hoping you''ll come back. Miss our routine. 🤗', '{"waiting", "hope", "routine_miss"}');
SELECT insert_template('lonely', 'encouraging', 'Your alarm has been practicing patience, {name}. Ready to reward its dedication? 🕰️', '{"patience", "dedication", "reward"}');
SELECT insert_template('lonely', 'encouraging', 'It''s quiet without you, {name}. Your morning energy is missed around here. ✨', '{"quiet", "energy_missed", "atmosphere"}');
SELECT insert_template('lonely', 'encouraging', '{name}, even on your hardest days, you''re stronger than you think. Come back when ready. 💙', '{"strength", "hard_days", "readiness"}');
SELECT insert_template('lonely', 'encouraging', 'No judgment, no pressure, {name}. Just an open invitation to try again. 🌅', '{"no_judgment", "no_pressure", "invitation"}');

-- Playful tone
SELECT insert_template('lonely', 'playful', '{name}, your alarm is writing poetry now. First line: ""Roses are red, mornings are blue..."" 🌹', '{"poetry", "creative", "blue_mornings"}');
SELECT insert_template('lonely', 'playful', 'Breaking: Alarm learns to meditate while waiting for {name}. Zen level: Maximum. 🧘‍♂️', '{"meditation", "zen", "waiting"}');
SELECT insert_template('lonely', 'playful', 'Your morning routine joined a support group. Topic: ""My Human is Missing."" Come rescue it! 🆘', '{"support_group", "missing_human", "rescue"}');
SELECT insert_template('lonely', 'playful', 'Plot twist: Your alarm started a diary. Entry 1: ""Day {missed_days} - still optimistic!"" 📔', '{"diary", "optimistic", "plot_twist"}');
SELECT insert_template('lonely', 'playful', 'Your alarm graduated from waiting school. Degree: Masters in Patience. Now what? 🎓', '{"graduation", "masters_degree", "now_what"}');

-- Firm tone
SELECT insert_template('lonely', 'firm', '{name}, {missed_days} days is a choice. Make a different one. Today. 💪', '{"choice", "different", "today"}');
SELECT insert_template('lonely', 'firm', 'Your goals don''t pause, {name}. They keep moving. Catch up. 🏃‍♂️', '{"goals_moving", "catch_up", "no_pause"}');
SELECT insert_template('lonely', 'firm', 'Success waits for no one, {name}. Not even you. Time to move. ⚡', '{"success_waits", "no_one", "time_to_move"}');
SELECT insert_template('lonely', 'firm', '{missed_days} days of potential lost, {name}. Don''t waste day {missed_days + 1}. 🚀', '{"potential_lost", "dont_waste", "next_day"}');
SELECT insert_template('lonely', 'firm', 'Champions don''t take {missed_days}-day vacations from greatness, {name}. Return to form. 🏅', '{"champion", "no_vacations", "return_to_form"}');

-- Roast tone
SELECT insert_template('lonely', 'roast', '{name}''s commitment level: Seen {missed_days} days ago. Last known status: ""I''ll start tomorrow."" 📅', '{"commitment_level", "last_seen", "start_tomorrow"}');
SELECT insert_template('lonely', 'roast', 'Your alarm clock called. It wants a divorce. Reason: ""Irreconcilable differences."" 💔', '{"divorce", "irreconcilable", "differences"}');
SELECT insert_template('lonely', 'roast', 'Achievement unlocked: Professional Goal Avoider. Next level: Actually Doing Something. 🎮', '{"achievement", "goal_avoider", "next_level"}');
SELECT insert_template('lonely', 'roast', 'Your bed filed a complaint: ""Too much quality time with {name}."" Even beds have limits. 🛏️', '{"complaint", "quality_time", "limits"}');
SELECT insert_template('lonely', 'roast', 'Day {missed_days}: {name} vs Morning Routine. Score: Bed 1, Productivity 0. Exciting match. ⚽', '{"scoreboard", "exciting_match", "sarcasm"}');

-- HAPPY - User active and engaged  
-- Encouraging tone
SELECT insert_template('happy', 'encouraging', 'Good morning, superstar {name}! Ready to make today even better than yesterday? ⭐', '{"superstar", "better", "yesterday"}');
SELECT insert_template('happy', 'encouraging', '{name}, you''re crushing it! {streak_days} days strong and counting! 💪', '{"crushing", "strong", "counting"}');
SELECT insert_template('happy', 'encouraging', 'Rise and shine, {name}! Your {streak_days}-day streak is looking beautiful this morning! ☀️', '{"rise_shine", "beautiful", "morning"}');
SELECT insert_template('happy', 'encouraging', 'Morning champion {name}! Your consistency is inspiring. Let''s keep this momentum! 🚀', '{"champion", "inspiring", "momentum"}');
SELECT insert_template('happy', 'encouraging', '{name}, you make mornings look easy! Day {streak_days + 1} of being awesome awaits! ✨', '{"easy", "awesome_awaits", "make_look"}');

-- Playful tone
SELECT insert_template('happy', 'playful', 'Alert: {name} spotted being awesome {streak_days} days in a row! Suspiciously consistent! 🕵️‍♂️', '{"spotted", "suspiciously", "consistent"}');
SELECT insert_template('happy', 'playful', '{name}''s streak: {streak_days} days. Difficulty level: Making it look effortless! 🎮', '{"difficulty_level", "effortless", "making_look"}');
SELECT insert_template('happy', 'playful', 'Breaking news: {name} continues to be a morning person. Scientists baffled by consistency! 🔬', '{"breaking_news", "scientists_baffled", "consistency"}');
SELECT insert_template('happy', 'playful', 'Your alarm is bragging to other alarms about you, {name}. {streak_days} days of teamwork! 🤝', '{"bragging", "teamwork", "other_alarms"}');
SELECT insert_template('happy', 'playful', 'Day {streak_days} update: {name} vs Snooze button. Score: {name} {streak_days}, Snooze 0! 🏆', '{"update", "scoreboard", "vs_snooze"}');

-- Firm tone
SELECT insert_template('happy', 'firm', '{name}, {streak_days} days proves you''ve got this. Keep pushing forward. 💪', '{"proves", "got_this", "keep_pushing"}');
SELECT insert_template('happy', 'firm', 'Excellence is a habit, {name}. {streak_days} days down, lifetime to go. ⚡', '{"excellence_habit", "lifetime_to_go", "down"}');
SELECT insert_template('happy', 'firm', '{name}: {streak_days} days of discipline. Don''t stop now. Momentum builds champions. 🚀', '{"discipline", "dont_stop", "builds_champions"}');
SELECT insert_template('happy', 'firm', 'Success loves consistency, {name}. {streak_days} days is just the beginning. 🎯', '{"success_loves", "just_beginning", "consistency"}');
SELECT insert_template('happy', 'firm', '{name}, you''re building something powerful. Day {streak_days + 1} awaits your commitment. 🏗️', '{"building_powerful", "awaits", "commitment"}');

-- Roast tone  
SELECT insert_template('happy', 'roast', 'Look who decided to be functional {streak_days} days straight. Shocking development! ⚡', '{"functional", "shocking_development", "straight"}');
SELECT insert_template('happy', 'roast', '{name}: Professional wake-up-er for {streak_days} days. Mom would be proud. Eventually. 👩‍👦', '{"professional", "mom_proud", "eventually"}');
SELECT insert_template('happy', 'roast', 'Breaking: Local person does basic adult thing {streak_days} times. More at 11. 📺', '{"basic_adult", "more_at_11", "times"}');
SELECT insert_template('happy', 'roast', '{name}''s streak: {streak_days} days. Difficulty: Easier than making excuses. Plot twist! 🎭', '{"easier_than", "plot_twist", "making_excuses"}');
SELECT insert_template('happy', 'roast', 'Achievement: {name} successfully human for {streak_days} days. Qualification for adulting unlocked! 🔓', '{"successfully_human", "adulting", "qualification"}');

-- EXCITED - User hit milestone, special achievement
-- Encouraging tone
SELECT insert_template('excited', 'encouraging', 'WOW {name}! {achievement}! You''re absolutely crushing your goals! 🎉', '{"wow", "crushing_goals", "absolutely"}');
SELECT insert_template('excited', 'encouraging', 'INCREDIBLE work, {name}! {achievement} - you should be so proud! 🌟', '{"incredible", "should_be_proud", "work"}');
SELECT insert_template('excited', 'encouraging', 'Amazing {name}! {achievement}! Your dedication is truly inspiring! 💫', '{"amazing", "truly_inspiring", "dedication"}');
SELECT insert_template('excited', 'encouraging', '{name}, you just achieved something special: {achievement}! Celebrate this win! 🥳', '{"special", "celebrate_win", "achieved"}');
SELECT insert_template('excited', 'encouraging', 'Outstanding {name}! {achievement}! You''re proving that consistency pays off! 🏆', '{"outstanding", "consistency_pays", "proving"}');

-- Playful tone
SELECT insert_template('excited', 'playful', 'ALERT: {name} just achieved {achievement}! Local area reports increased awesomeness levels! 🚨', '{"alert", "increased_awesomeness", "local_area"}');
SELECT insert_template('excited', 'playful', 'Breaking: {name} unlocked achievement [{achievement}]! Difficulty: Expert level! 🎮', '{"unlocked_achievement", "expert_level", "difficulty"}');
SELECT insert_template('excited', 'playful', '🎊 CELEBRATION MODE ACTIVATED 🎊 {name} just nailed {achievement}! Party time! 🎉', '{"celebration_mode", "party_time", "nailed"}');
SELECT insert_template('excited', 'playful', 'Your alarm is doing a happy dance! {name} achieved {achievement}! Join the party! 💃', '{"happy_dance", "join_party", "achieved"}');
SELECT insert_template('excited', 'playful', 'Plot twist: {name} becomes legend by achieving {achievement}! Origin story complete! 📚', '{"becomes_legend", "origin_story", "complete"}');

-- Firm tone
SELECT insert_template('excited', 'firm', '{name}: {achievement} completed. This is what commitment looks like. Keep building. 💪', '{"commitment_looks_like", "keep_building", "completed"}');
SELECT insert_template('excited', 'firm', 'Excellence achieved: {achievement}. {name}, this is your new standard. Maintain it. 🎯', '{"excellence_achieved", "new_standard", "maintain"}');
SELECT insert_template('excited', 'firm', '{achievement} unlocked, {name}. Proof that discipline creates results. What''s next? ⚡', '{"proof_discipline", "creates_results", "whats_next"}');
SELECT insert_template('excited', 'firm', '{name}, {achievement} is milestone, not finish line. Keep pushing boundaries. 🚀', '{"milestone_not_finish", "keep_pushing_boundaries", "is"}');
SELECT insert_template('excited', 'firm', 'Achievement: {achievement}. {name}, you''ve earned this through consistency. Scale up. 📈', '{"earned_through", "scale_up", "consistency"}');

-- Roast tone
SELECT insert_template('excited', 'roast', 'Shocking news: {name} actually achieved {achievement}! Experts everywhere confused! 🤯', '{"shocking_news", "experts_confused", "actually"}');
SELECT insert_template('excited', 'roast', '{name} accomplished {achievement}. Even broken clocks are right twice a day! ⏰', '{"broken_clocks", "right_twice", "accomplished"}');
SELECT insert_template('excited', 'roast', 'BREAKING: {name} proves they can finish something. Evidence: {achievement}! 📰', '{"proves_finish", "evidence", "something"}');
SELECT insert_template('excited', 'roast', 'Achievement unlocked: {name} does thing properly. Rarity level: Legendary! 🦄', '{"does_properly", "rarity_level", "legendary"}');
SELECT insert_template('excited', 'roast', '{name}''s {achievement} shocks everyone who knows them. Character development! 📖', '{"shocks_everyone", "character_development", "knows_them"}');

-- PROUD - User showing consistency, building habits
-- Encouraging tone  
SELECT insert_template('proud', 'encouraging', 'So proud of you, {name}! {streak_days} days of showing up for yourself! 💙', '{"so_proud", "showing_up", "yourself"}');
SELECT insert_template('proud', 'encouraging', '{name}, your {streak_days}-day journey shows real character. You should feel proud! 🌟', '{"real_character", "should_feel", "journey"}');
SELECT insert_template('proud', 'encouraging', 'Look at you go, {name}! {streak_days} days of commitment is something to celebrate! 🎉', '{"look_at_go", "something_celebrate", "commitment"}');
SELECT insert_template('proud', 'encouraging', '{name}, {streak_days} days proves you''re becoming the person you want to be! ✨', '{"proves_becoming", "want_to_be", "person"}');
SELECT insert_template('proud', 'encouraging', 'Your dedication amazes me, {name}. {streak_days} days of growth and counting! 🌱', '{"dedication_amazes", "growth_counting", "and"}');

-- Playful tone
SELECT insert_template('proud', 'playful', '{name}''s consistency level: {streak_days} days. Superhero status: Achieved! 🦸‍♂️', '{"consistency_level", "superhero_status", "achieved"}');
SELECT insert_template('proud', 'playful', 'Your alarm is bragging to its friends about you, {name}. {streak_days} days of teamwork! 📢', '{"bragging_friends", "teamwork", "days_of"}');
SELECT insert_template('proud', 'playful', 'Achievement unlocked: {name} the Consistent! Level: {streak_days}. Experience points: Maximum! 🎮', '{"the_consistent", "experience_points", "maximum"}');
SELECT insert_template('proud', 'playful', 'Breaking: {name} teaches masterclass in showing up. Course length: {streak_days} days! 🎓', '{"teaches_masterclass", "course_length", "showing_up"}');
SELECT insert_template('proud', 'playful', '{name}''s streak diary, Day {streak_days}: ""Still awesome. Still going. Still {name}."" 📔', '{"streak_diary", "still_awesome", "still_going"}');

-- Firm tone
SELECT insert_template('proud', 'firm', '{name}: {streak_days} days of discipline. You''re building something powerful. Continue. 💪', '{"days_discipline", "building_powerful", "continue"}');
SELECT insert_template('proud', 'firm', 'Consistency is your strength, {name}. {streak_days} days proves it. Keep building. 🏗️', '{"consistency_strength", "proves_it", "keep_building"}');
SELECT insert_template('proud', 'firm', '{name}, {streak_days} days shows commitment. This is how winners are made. ⚡', '{"shows_commitment", "winners_made", "how"}');
SELECT insert_template('proud', 'firm', 'Excellence is becoming habit, {name}. Day {streak_days} of proof. Maintain standards. 🎯', '{"becoming_habit", "of_proof", "maintain_standards"}');
SELECT insert_template('proud', 'firm', '{name}: {streak_days} consecutive days of doing what others won''t. Champion mindset. 🏆', '{"consecutive_days", "others_wont", "champion_mindset"}');

-- Roast tone
SELECT insert_template('proud', 'roast', 'Miracle alert: {name} shows up {streak_days} days straight. Scientists study phenomenon! 🔬', '{"miracle_alert", "scientists_study", "phenomenon"}');
SELECT insert_template('proud', 'roast', '{name}''s {streak_days}-day streak: Proof that even they can do basic things consistently! 📊', '{"day_streak", "basic_things", "consistently"}');
SELECT insert_template('proud', 'roast', 'Breaking: Person does what they said they''d do for {streak_days} days. {name} shocks world! 🌍', '{"does_what_said", "shocks_world", "days"}');
SELECT insert_template('proud', 'roast', '{name} achieves {streak_days} days of not being a quitter. Character growth detected! 📈', '{"not_being_quitter", "character_growth", "detected"}');
SELECT insert_template('proud', 'roast', 'Local person ({name}) acts like adult {streak_days} days running. Neighbors amazed! 🏡', '{"acts_like_adult", "neighbors_amazed", "running"}');

-- SLEEPY - Early morning, gentle wake-up needed
-- Encouraging tone
SELECT insert_template('sleepy', 'encouraging', 'Good morning, sleepyhead {name}. Take your time, but your day is waiting for you. 😴', '{"sleepyhead", "take_time", "day_waiting"}');
SELECT insert_template('sleepy', 'encouraging', 'I know it''s early, {name}, but you''ve got this. Just one small step out of bed. 🌅', '{"know_early", "got_this", "small_step"}');
SELECT insert_template('sleepy', 'encouraging', 'Morning, {name}. Your cozy bed vs your amazing goals - ready to choose goals? ☁️', '{"cozy_bed", "amazing_goals", "ready_choose"}');
SELECT insert_template('sleepy', 'encouraging', 'Gentle wake-up call, {name}. Your {streak_days}-day streak is patiently waiting. 🕯️', '{"gentle_wakeup", "patiently_waiting", "streak"}');
SELECT insert_template('sleepy', 'encouraging', 'Rise and shine softly, {name}. Great things happen when you show up tired. ✨', '{"rise_shine_softly", "great_things", "show_up_tired"}');

-- Playful tone
SELECT insert_template('sleepy', 'playful', 'Wakey wakey, {name}! Your pillow filed a noise complaint about your snoring! 😂', '{"wakey_wakey", "noise_complaint", "snoring"}');
SELECT insert_template('sleepy', 'playful', 'Morning zombie {name}! Coffee location: kitchen. Mission: survive until caffeine. ☕', '{"morning_zombie", "coffee_location", "survive_caffeine"}');
SELECT insert_template('sleepy', 'playful', '{name}, your bed is great, but it''s not paying your bills. Time to adult! 💼', '{"bed_great", "paying_bills", "time_adult"}');
SELECT insert_template('sleepy', 'playful', 'Breaking: {name} spotted in natural habitat (bed). Migration to kitchen recommended! 🐧', '{"natural_habitat", "migration_kitchen", "recommended"}');
SELECT insert_template('sleepy', 'playful', 'Morning briefing for {name}: Status drowsy. Mission: get vertical. Difficulty: easy! 📋', '{"morning_briefing", "get_vertical", "difficulty_easy"}');

-- Firm tone
SELECT insert_template('sleepy', 'firm', '{name}, tired is not an excuse. Your goals don''t care how you feel. Move. 💪', '{"tired_not_excuse", "dont_care_feel", "move"}');
SELECT insert_template('sleepy', 'firm', 'Sleepy or not, {name}, winners get up. {streak_days} days didn''t build themselves. ⚡', '{"winners_get_up", "didnt_build_themselves", "sleepy_not"}');
SELECT insert_template('sleepy', 'firm', '{name}: Comfort is the enemy of progress. Bed is comfort. Choose progress. 🚀', '{"comfort_enemy", "bed_comfort", "choose_progress"}');
SELECT insert_template('sleepy', 'firm', 'Your feelings don''t run your life, {name}. Your decisions do. Decide to get up. 🎯', '{"feelings_dont_run", "decisions_do", "decide_get_up"}');
SELECT insert_template('sleepy', 'firm', '{name}, every champion was tired once. The difference is they got up anyway. 🏆', '{"every_champion_tired", "difference_got_up", "anyway"}');

-- Roast tone
SELECT insert_template('sleepy', 'roast', '{name}: Professional bed-warmer, amateur life-liver. Time to switch careers? 🛏️', '{"professional_bedwarmer", "amateur_lifeliver", "switch_careers"}');
SELECT insert_template('sleepy', 'roast', 'Your bed called. It''s tired of you. Even furniture has standards, {name}. 🪑', '{"bed_called_tired", "furniture_standards", "even"}');
SELECT insert_template('sleepy', 'roast', '{name}''s morning routine: Snooze, snooze, snooze, panic. Classic strategy! ⏰', '{"morning_routine", "classic_strategy", "panic"}');
SELECT insert_template('sleepy', 'roast', 'Breaking: {name} discovers gravity works horizontally too. Bed scientists intrigued! 🧪', '{"gravity_horizontally", "bed_scientists", "intrigued"}');
SELECT insert_template('sleepy', 'roast', 'Your pillow has filed for overtime pay. Apparently, 8 hours isn''t enough for you. 💰', '{"overtime_pay", "8_hours_not_enough", "apparently"}');

-- Drop the helper function
DROP FUNCTION insert_template(emotion_type, emotional_tone, TEXT, TEXT[]);

-- Update statistics after seeding
ANALYZE emotional_messages;

-- Verify template count
DO $$
DECLARE
    template_count INTEGER;
    emotion_count INTEGER;
    tone_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM emotional_messages;
    SELECT COUNT(DISTINCT emotion_type) INTO emotion_count FROM emotional_messages;  
    SELECT COUNT(DISTINCT tone) INTO tone_count FROM emotional_messages;
    
    RAISE NOTICE 'Seeded % templates across % emotions and % tones', 
        template_count, emotion_count, tone_count;
        
    -- Log seeding completion
    INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
    VALUES ('templates_seeded', jsonb_build_object(
        'total_templates', template_count,
        'emotion_types', emotion_count,
        'tones', tone_count,
        'seeded_at', CURRENT_TIMESTAMP
    ), CURRENT_TIMESTAMP);
END $$;

COMMIT;