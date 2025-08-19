import type { EmotionType, EmotionalTone } from "../types/emotional";

// Emotional Message Templates - Builds on existing voice mood system
// Variables available: {name}, {missed_days}, {streak_days}, {missed_alarms}, {achievement}, {time}, {label}

export const EMOTIONAL_MESSAGE_TEMPLATES: Record<
  EmotionType,
  Record<EmotionalTone, string[]>
> = {
  // 😢 SAD - User has missed alarms, broken streaks
  sad: {
    encouraging: [
      "Hey {name}, I'm not angry... just disappointed. 😔 Remember when mornings used to be your thing?",
      "Missing you, {name}. Your {streak_days}-day streak is waiting for you to come back. 💙",
      "I've been sitting here for {missed_days} days, {name}. Ready to be friends again? 🤗",
      "{name}, your future self sent a message: 'Please don't give up on me.' Ready to try again? 💪",
      "No judgment here, {name}. Just wondering if you want to restart that amazing {streak_days}-day journey? 🌅",
    ],
    playful: [
      "Psst {name}... your alarm is feeling lonely. Come rescue it! 🦸‍♂️",
      "Your streak called. It misses you. Should I tell it you're coming back? 📞",
      "Breaking news: Local alarm spotted crying. Owner last seen {missed_days} days ago. 📰",
      "Alert: Your alarm has been promoted to 'Professional Snooze Button'. Want to demote it back? 🔄",
      "Your bed is currently winning {missed_days}-0 against your morning routine. Comeback time? 🏆",
    ],
    firm: [
      "You skipped {missed_days} days, {name}. One push now, one streak saved later. 💪",
      "Your goals don't care about excuses, {name}. They care about action. Now. 🎯",
      "Missed alarms: {missed_alarms}. Excuses accepted: 0. Let's go. ⚡",
      "{missed_days} days is enough, {name}. Your comeback starts with one alarm. 🚀",
      "Wake up call: Champions don't stay down this long. Time to prove you're one. 🏅",
    ],
    roast: [
      "{name} — still sleeping? Your bed is winning. Show up. 😤",
      "Day {missed_days} of {name} vs Basic Morning Routine. Bed: {missed_days}, You: 0. 🛏️",
      "Your alarm: exists. Your snooze button: overworked. You: missing in action. 🚨",
      "Plot twist: Your mattress has become your life coach. Spoiler alert: it's terrible advice. 📚",
      "Congratulations! You've achieved expert-level procrastination. Now try expert-level action. ⭐",
    ],
  },

  // 😟 WORRIED - 3-7 days inactive, concerning pattern
  worried: {
    encouraging: [
      "It's been {missed_days} days, {name}. Your alarm misses you. Ready for a comeback story? 💪",
      "Hey {name}, tomorrow is a fresh start. Your best morning routine is waiting. ✨",
      "No rush, {name}. Just wondering if you want to try again? Even 2 minutes counts. 🌱",
      "Your goals are still here, {name}. They've been patiently waiting for your return. ⏰",
      "{name}, small steps lead to big changes. Ready for one tiny step forward? 👣",
    ],
    playful: [
      "Houston, we have a problem. {name} has been MIA for {missed_days} days. Mission: Rescue! 🚀",
      "Your alarm filed a missing person report. Should I cancel it or will you show up? 🕵️‍♂️",
      "Status update: Your morning routine is currently 'buffering...' for {missed_days} days. Refresh? 🔄",
      "Breaking: Local person forgot they have goals. More at 11... or whenever you wake up. 📺",
      "Your streak is in witness protection. Want to give it a safe return? 🛡️",
    ],
    firm: [
      "Week {missed_weeks}: Time to decide who you want to be, {name}. ⚡",
      "{missed_days} days of silence. Your goals deserve better. Show up. 🎯",
      "The difference between you and your goals? Action. Take it now. 💥",
      "Comfort zone population: You. Time for a change of address, {name}. 🏠",
      "Your future self is watching. Make them proud with what you do next. 👀",
    ],
    roast: [
      "{name}, your motivation called. It's filing for divorce. Irreconcilable differences. 💔",
      "Update: Your ambitions have joined the witness protection program. They're scared of your snooze button. 🫥",
      "Your bed has officially adopted you. Your morning routine is jealous. 🛏️",
      "Day {missed_days}: Still cosplaying as a professional sleeper. The academy is not impressed. 🎭",
      "Your goals are ghosting you harder than your last relationship. Ouch. 👻",
    ],
  },

  // 😊 HAPPY - Active user, good patterns
  happy: {
    encouraging: [
      "Look at you, {name}! {streak_days} days strong and crushing it! Keep shining! ⭐",
      "Your consistency is inspiring, {name}! {streak_days} days of pure awesome! 💫",
      "Amazing work, {name}! Your {streak_days}-day streak is proof that you've got this! 🌟",
      "Loving your energy, {name}! {streak_days} days of showing up for yourself! 🙌",
      "You're on fire, {name}! {streak_days} days of making it happen! So proud! 🔥",
    ],
    playful: [
      "Someone's becoming a morning person! Day {streak_days} of {name} being awesome! 😎",
      "{name} level: Expert Morning Ninja! {streak_days} days and counting! 🥷",
      "Alert: {name} is dangerously good at mornings. Neighbors getting jealous! 🏆",
      "Breaking: Local person discovers they're actually good at life. More at {streak_days}! 📺",
      "{name}: Turning alarm clocks into cheerleaders since day 1. Currently on day {streak_days}! 📣",
    ],
    firm: [
      "{streak_days} days, {name}. This is what discipline looks like. Keep building. 💪",
      "Day {streak_days}: You're proving that consistency beats perfection. Well done. 🎯",
      "{name}, {streak_days} days of showing up. This is how champions are made. 🏅",
      "No accidents here, {name}. {streak_days} days is deliberate excellence. Continue. ⚡",
      "Day {streak_days}: You vs Your Old Self. Current score: You're winning. 🏆",
    ],
    roast: [
      "Well, well, {name}. Look who's actually functional. {streak_days} days without being a disaster. 👏",
      "Shocking development: {name} proves they're capable of basic life skills. Day {streak_days}! 😱",
      "Plot twist: {name} can actually adult. {streak_days} days of evidence collected. 📊",
      "Update: {name} is no longer a morning catastrophe. Day {streak_days} of this miracle. ✨",
      "{name}: Formerly known as 'that person who can't wake up.' Reformed after {streak_days} days. 🎭",
    ],
  },

  // 🥳 EXCITED - Achievements, milestones, celebrations
  excited: {
    encouraging: [
      "🎉 {name}, you just unlocked '{achievement}'! Your friends are going to be so jealous!",
      "WOW! {streak_days} days strong! You're officially a morning champion! ⭐",
      "Plot twist: You're actually GOOD at this! {achievement} unlocked! 🏆",
      "CELEBRATION TIME! {name} just achieved '{achievement}'! You absolute star! 🌟",
      "Breaking records, {name}! {achievement} earned! Your growth is incredible! 📈",
    ],
    playful: [
      "Someone's on fire! 🔥 {name} just crushed another morning goal!",
      "Alert: {name} is becoming dangerously good at mornings. Achievement: {achievement}! 😎",
      "Your streak just leveled up! {achievement} achievement GET! 🎮",
      "Achievement unlocked: '{achievement}'. {name} status: Officially awesome! 🏅",
      "Ding ding! {name} just earned '{achievement}'! Victory lap time! 🏃‍♂️",
    ],
    firm: [
      "{achievement} earned, {name}. This is what happens when you commit. Keep going. 💪",
      "Day {streak_days}: {achievement} unlocked. Success isn't luck, it's discipline. 🎯",
      "{name}, {achievement} achieved through pure consistency. Respect. 🙌",
      "Milestone reached: {achievement}. {name}, this is how you build a life. 🏗️",
      "{achievement} complete. {name}, you're writing your own success story. 📚",
    ],
    roast: [
      "Holy plot twist! {name} actually achieved something: '{achievement}'. Witnesses required. 📸",
      "Alert: {name} broke their record of being mediocre. {achievement} unlocked! Who are you?! 🤯",
      "Shocking: {name} proves they're not just decorative. {achievement} earned! 🏆",
      "Breaking: Local person stops being disappointing. {achievement} achieved by {name}! 📺",
      "{name} leveled up from 'human disaster' to '{achievement}' holder. Character development! 📈",
    ],
  },

  // 😔 LONELY - No social activity, isolated user
  lonely: {
    encouraging: [
      "Hey {name}, you don't have to do this alone. Your morning wins matter, and so do you. 💙",
      "Missing your energy, {name}. Ready to show yourself some love with a gentle morning routine? 🤗",
      "{name}, even small victories count. Want to celebrate a 2-minute win together? 🌱",
      "You matter, {name}. Your goals matter. Let's start small and build together. 🤝",
      "Sending you strength, {name}. Tomorrow's a new chance to show up for yourself. 💫",
    ],
    playful: [
      "Your alarm has been practicing its best encouraging voice just for you, {name}! 🎭",
      "Knock knock! It's your morning routine. It's been waiting to hang out with you! 🚪",
      "{name}, your future self wants to be friends. Step one: wake up together! 👥",
      "Your goals called - they miss spending time with you, {name}! Coffee date? ☕",
      "Plot twist: You're the main character of your own story, {name}. Time for the next chapter! 📖",
    ],
    firm: [
      "Isolation ends now, {name}. Start with yourself. Show up. 💪",
      "{name}, the world needs what you have to offer. Begin with discipline. ⚡",
      "Connection starts with self-respect, {name}. Honor your commitments. 🎯",
      "Loneliness isn't solved by sleeping more, {name}. Get up and engage. 🚀",
      "Your life is waiting, {name}. Stop watching from the sidelines. 🏟️",
    ],
    roast: [
      "{name}, even your alarm feels sorry for you. That's saying something. Wake up. 😅",
      "Your bed called - it's tired of being your only relationship. Diversify, {name}. 🛏️",
      "Status: {name} vs Social Life. Current score: Pillow is winning. Time to change that? 📊",
      "Your snooze button is getting clingy, {name}. Maybe try an actual relationship... with your goals. 💔",
      "Breaking: {name}'s most committed relationship is with their mattress. Plot twist needed. 🎬",
    ],
  },

  // 🏆 PROUD - Major milestones, significant achievements
  proud: {
    encouraging: [
      "Incredible, {name}! {achievement} is HUGE! Look how far you've come! So proud! 🏆",
      "This is your moment, {name}! {achievement} - you've earned every bit of this success! 👑",
      "{name}, {achievement} represents all your hard work paying off! You're amazing! ⭐",
      "Witnessing greatness: {name} achieving {achievement}! Your dedication inspires everyone! 🌟",
      "Standing ovation for {name}! {achievement} is proof of your incredible growth! 👏",
    ],
    playful: [
      "ALERT: {name} just became legendary! {achievement} unlocked! Hall of fame entry! 🏛️",
      "Someone call the newspapers! {name} just achieved {achievement}! Front page material! 📰",
      "{name} status: Officially too cool for school! {achievement} earned! 😎",
      "Plot armor activated: {name} is now invincible! {achievement} proves it! 🛡️",
      "Achievement get! {name} unlocked: {achievement}. Victory dance mandatory! 💃",
    ],
    firm: [
      "Respect, {name}. {achievement} is what happens when you refuse to quit. 🙌",
      "{achievement} achieved through sheer will, {name}. This is leadership. 👑",
      "{name}, {achievement} separates you from those who just talk. Well done. 💪",
      "Master class in commitment: {name} earning {achievement}. Study this moment. 📚",
      "{achievement} complete, {name}. This is how legends are made. Continue. ⚡",
    ],
    roast: [
      "Wait, WHAT?! {name} achieved {achievement}?! Who are you and what did you do with the old {name}? 🤯",
      "System error: {name} is succeeding beyond expectations. {achievement} confirmed. Rebooting worldview... 🔄",
      "Breaking: {name} stops being average. {achievement} achieved. Experts baffled. 📊",
      "Plot twist nobody saw coming: {name} actually follows through. {achievement} unlocked! 🎬",
      "{name} went from 'participation trophy' to '{achievement}' holder. Character arc complete! 📈",
    ],
  },

  // 😴 SLEEPY - Sleep schedule issues, circadian problems
  sleepy: {
    encouraging: [
      "Gentle nudge, {name}. I know you're tired, but your morning routine misses you. 🌙",
      "Sweet dreams ending, {name}? Your {streak_days}-day streak is worth waking up for. ☀️",
      "No rush, {name}. When you're ready, your goals will be here waiting. 😊",
      "Sleep is precious, {name}, but so are your dreams. Ready to chase them? 💤",
      "Soft wake-up call: {name}, your future self will thank you for this moment. ✨",
    ],
    playful: [
      "Sleepy {name} vs Morning Goals: Round 1! Who will win today? 🥊",
      "Your pillow is great, {name}, but your alarm has better long-term plans for you! 😴",
      "Breaking news: {name} is cosplaying as a koala. Cute, but goals are calling! 🐨",
      "Status: {name} is currently speed-running the 'Five More Minutes' world record! ⏰",
      "Your bed filed a complaint: {name} is TOO comfortable. Time to break up! 💔",
    ],
    firm: [
      "Sleep debt paid, {name}. Time to invest in your future. Get up. 💪",
      "Tired is not an identity, {name}. It's a temporary state. Change it. ⚡",
      "Your goals don't care if you're sleepy, {name}. They care if you show up. 🎯",
      "Champions are tired too, {name}. The difference? They get up anyway. 🏅",
      "Energy comes from action, not rest, {name}. Start moving. 🚀",
    ],
    roast: [
      "{name}, your sleep schedule called - it's filing for unemployment. Too much work lately. 😂",
      "Update: {name} is professionally sleepy. Unfortunately, that's not a paying career. 💼",
      "Your bed is writing a memoir: 'My Life with {name}: A Love Story That Needs Boundaries.' 📚",
      "{name} vs Consciousness: Currently losing by a landslide. Comeback needed! 🥊",
      "Breaking: {name}'s relationship with sleep is more committed than most marriages. Time for couples therapy. 💏",
    ],
  },
};

// Contextual modifiers for message personalization
export const MESSAGE_MODIFIERS = {
  firstTime: {
    prefix: "Welcome to your emotional journey, {name}! ",
    suffix: " This is just the beginning! 🌟",
  },
  comebackAfterLongAbsence: {
    prefix: "Hey stranger! ",
    suffix: " Missed having you around. 💙",
  },
  weekendEncouragement: {
    prefix: "Weekend warrior {name}! ",
    suffix: " Even superheroes need their rest days! 🦸‍♂️",
  },
  nearMilestone: {
    prefix: "So close, {name}! ",
    suffix: " Just {days_to_milestone} more days to your next big win! 🎯",
  },
  perfectWeek: {
    prefix: "Perfect week incoming, {name}! ",
    suffix: " You're unstoppable! 🔥",
  },
};

// Message effectiveness scoring
export interface MessageTemplate {
  id: string;
  emotion: EmotionType;
  tone: EmotionalTone;
  template: string;
  variables: Record<string, any>;
  tags: string[]; // For categorization and filtering
  effectivenessScore: number; // 0-100
  timesUsed: number;
  lastUsed?: Date;
}

// Export template getter with personalization
export function getEmotionalMessageTemplate(
  emotion: EmotionType,
  tone: EmotionalTone,
  context: Record<string, any> = {},
): string {
  const templates = EMOTIONAL_MESSAGE_TEMPLATES[emotion]?.[tone] || [];

  if (templates.length === 0) {
    // Fallback to encouraging tone if tone not available
    const fallbackTemplates =
      EMOTIONAL_MESSAGE_TEMPLATES[emotion]?.encouraging || [];
    if (fallbackTemplates.length === 0) {
      return "Hey {name}, time to shine! Your goals are waiting! ✨";
    }
    return fallbackTemplates[
      Math.floor(Math.random() * fallbackTemplates.length)
    ];
  }

  // Simple weighted selection based on effectiveness (in real implementation)
  // For now, just random selection
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

// Message variable replacement
export function personalizeMessage(
  template: string,
  variables: Record<string, any>,
): string {
  let message = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, "g"), String(value));
  });

  return message;
}
