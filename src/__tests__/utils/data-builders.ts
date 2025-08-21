// Data builders and factory utilities for comprehensive test data generation

import { faker } from '@faker-js/faker';
import {
  TestUser,
  TestAlarm,
  TestTheme,
  TestBattle,
  TestVoiceClip,
  TEST_CONSTANTS
} from './index';

// Builder pattern for creating complex test scenarios
export class TestUserBuilder {
  private user: Partial<TestUser> = {};

  constructor(baseData?: Partial<TestUser>) {
    if (baseData) {
      this.user = { ...baseData };
    }
  }

  withId(id: string): TestUserBuilder {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): TestUserBuilder {
    this.user.email = email;
    return this;
  }

  withName(name: string): TestUserBuilder {
    this.user.name = name;
    return this;
  }

  withRole(role: 'user' | 'premium' | 'admin'): TestUserBuilder {
    this.user.role = role;
    return this;
  }

  withSubscription(tier: 'free' | 'premium' | 'ultimate', status: 'active' | 'canceled' | 'past_due' = 'active'): TestUserBuilder {
    this.user.subscription = {
      tier,
      status,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    return this;
  }

  withPreferences(preferences: Partial<TestUser['preferences']>): TestUserBuilder {
    this.user.preferences = { ...this.user.preferences, ...preferences };
    return this;
  }

  asGuest(): TestUserBuilder {
    this.user.role = 'user';
    this.user.subscription = undefined;
    return this;
  }

  asPremium(): TestUserBuilder {
    return this.withRole('premium').withSubscription('premium');
  }

  asAdmin(): TestUserBuilder {
    this.user.role = 'admin';
    return this.withSubscription('ultimate');
  }

  withCreationDate(daysAgo: number): TestUserBuilder {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    this.user.createdAt = date.toISOString();
    this.user.updatedAt = new Date().toISOString();
    return this;
  }

  build(): TestUser {
    const defaultUser: TestUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { ...defaultUser, ...this.user };
  }
}

export class TestAlarmBuilder {
  private alarm: Partial<TestAlarm> = {};

  constructor(baseData?: Partial<TestAlarm>) {
    if (baseData) {
      this.alarm = { ...baseData };
    }
  }

  withId(id: string): TestAlarmBuilder {
    this.alarm.id = id;
    return this;
  }

  withUserId(userId: string): TestAlarmBuilder {
    this.alarm.userId = userId;
    return this;
  }

  withTime(time: string): TestAlarmBuilder {
    this.alarm.time = time;
    return this;
  }

  withLabel(label: string): TestAlarmBuilder {
    this.alarm.label = label;
    return this;
  }

  enabled(isEnabled = true): TestAlarmBuilder {
    this.alarm.enabled = isEnabled;
    this.alarm.isActive = isEnabled;
    return this;
  }

  disabled(): TestAlarmBuilder {
    return this.enabled(false);
  }

  withDays(days: number[]): TestAlarmBuilder {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    this.alarm.days = days;
    this.alarm.dayNames = days.map(day => dayNames[day]);
    return this;
  }

  weekdays(): TestAlarmBuilder {
    return this.withDays([1, 2, 3, 4, 5]); // Monday to Friday
  }

  weekends(): TestAlarmBuilder {
    return this.withDays([0, 6]); // Sunday and Saturday
  }

  daily(): TestAlarmBuilder {
    return this.withDays([0, 1, 2, 3, 4, 5, 6]);
  }

  withVoiceMood(mood: TestAlarm['voiceMood']): TestAlarmBuilder {
    this.alarm.voiceMood = mood;
    return this;
  }

  withSound(sound: string): TestAlarmBuilder {
    this.alarm.sound = sound;
    return this;
  }

  withDifficulty(difficulty: TestAlarm['difficulty']): TestAlarmBuilder {
    this.alarm.difficulty = difficulty;
    return this;
  }

  withSnooze(enabled = true, interval = 5, maxSnoozes = 3): TestAlarmBuilder {
    this.alarm.snoozeEnabled = enabled;
    this.alarm.snoozeInterval = interval;
    this.alarm.maxSnoozes = maxSnoozes;
    this.alarm.snoozeCount = 0;
    return this;
  }

  withBattleMode(enabled = true, difficulty: 'easy' | 'medium' | 'hard' = 'medium', opponents: string[] = []): TestAlarmBuilder {
    this.alarm.battleMode = {
      enabled,
      difficulty,
      opponents
    };
    return this;
  }

  withRepeat(type: 'daily' | 'weekly' | 'monthly' = 'daily', interval = 1, endDate?: string): TestAlarmBuilder {
    this.alarm.repeatOptions = {
      type,
      interval,
      endDate
    };
    return this;
  }

  build(): TestAlarm {
    const defaultAlarm: TestAlarm = {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      time: '07:00',
      label: 'Morning Alarm',
      enabled: true,
      isActive: true,
      days: [1, 2, 3, 4, 5],
      dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      voiceMood: 'motivational',
      sound: 'default-alarm.mp3',
      difficulty: 'medium',
      snoozeEnabled: true,
      snoozeInterval: 5,
      snoozeCount: 0,
      maxSnoozes: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { ...defaultAlarm, ...this.alarm };
  }
}

export class TestBattleBuilder {
  private battle: Partial<TestBattle> = {};

  constructor(baseData?: Partial<TestBattle>) {
    if (baseData) {
      this.battle = { ...baseData };
    }
  }

  withId(id: string): TestBattleBuilder {
    this.battle.id = id;
    return this;
  }

  withParticipants(participantIds: string[]): TestBattleBuilder {
    this.battle.participants = participantIds;
    return this;
  }

  withStatus(status: TestBattle['status']): TestBattleBuilder {
    this.battle.status = status;
    return this;
  }

  withDifficulty(difficulty: TestBattle['difficulty']): TestBattleBuilder {
    this.battle.difficulty = difficulty;
    return this;
  }

  withTimeRange(startTime: string, endTime: string): TestBattleBuilder {
    this.battle.startTime = startTime;
    this.battle.endTime = endTime;
    return this;
  }

  withChallenges(challenges: TestBattle['challenges']): TestBattleBuilder {
    this.battle.challenges = challenges;
    return this;
  }

  withWinner(winnerId: string): TestBattleBuilder {
    this.battle.winner = winnerId;
    this.battle.status = 'completed';
    return this;
  }

  withRewards(xp: number, coins: number, badges: string[] = []): TestBattleBuilder {
    this.battle.rewards = { xp, coins, badges };
    return this;
  }

  pending(): TestBattleBuilder {
    return this.withStatus('pending');
  }

  active(): TestBattleBuilder {
    return this.withStatus('active');
  }

  completed(): TestBattleBuilder {
    return this.withStatus('completed');
  }

  abandoned(): TestBattleBuilder {
    return this.withStatus('abandoned');
  }

  build(): TestBattle {
    const defaultBattle: TestBattle = {
      id: faker.string.uuid(),
      participants: [faker.string.uuid(), faker.string.uuid()],
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      difficulty: 'medium',
      challenges: [],
      createdAt: new Date().toISOString()
    };

    return { ...defaultBattle, ...this.battle };
  }
}

// Data generation utilities
export const _generateRealisticTestData = {
  // Generate realistic alarm times weighted towards common wake-up times
  alarmTime: (): string => {
    const weights = {
      early: 0.1,   // 5:00-6:30
      morning: 0.6, // 6:30-8:30
      late: 0.2,    // 8:30-10:00
      other: 0.1    // other times
    };

    const rand = Math.random();
    let hour: number, minute: number;

    if (rand < weights.early) {
      hour = faker.number.int({ min: 5, max: 6 });
      minute = faker.number.int({ min: 0, max: 30 });
    } else if (rand < weights.early + weights.morning) {
      hour = faker.number.int({ min: 6, max: 8 });
      minute = faker.number.int({ min: 0, max: 59 });
    } else if (rand < weights.early + weights.morning + weights.late) {
      hour = faker.number.int({ min: 8, max: 10 });
      minute = faker.number.int({ min: 0, max: 59 });
    } else {
      hour = faker.number.int({ min: 0, max: 23 });
      minute = faker.number.int({ min: 0, max: 59 });
    }

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  },

  // Generate realistic alarm days (weighted towards weekdays)
  alarmDays: (): number[] => {
    const patterns = [
      [1, 2, 3, 4, 5],     // Weekdays (60%)
      [0, 1, 2, 3, 4, 5, 6], // Daily (20%)
      [0, 6],              // Weekends (10%)
      [1, 3, 5],           // MWF (5%)
      [2, 4],              // TR (5%)
    ];

    const weights = [0.6, 0.2, 0.1, 0.05, 0.05];
    return faker.helpers.weightedArrayElement(
      patterns.map((pattern, index) => ({ weight: weights[index], value: pattern }))
    );
  },

  // Generate realistic user preferences
  userPreferences: (isPremium = false) => ({
    theme: faker.helpers.weightedArrayElement([
      { weight: 0.4, value: 'light' },
      { weight: 0.35, value: 'dark' },
      { weight: 0.2, value: 'auto' },
      { weight: 0.05, value: 'system' }
    ]),
    language: faker.helpers.weightedArrayElement([
      { weight: 0.6, value: 'en' },
      { weight: 0.15, value: 'es' },
      { weight: 0.08, value: 'fr' },
      { weight: 0.05, value: 'de' },
      { weight: 0.04, value: 'ja' },
      { weight: 0.04, value: 'hi' },
      { weight: 0.04, value: 'zh' }
    ]),
    notifications: faker.datatype.boolean({ probability: 0.85 }),
    hapticFeedback: faker.datatype.boolean({ probability: 0.7 }),
    voiceFeatures: isPremium ? faker.datatype.boolean({ probability: 0.8 }) : false,
    advancedAnalytics: isPremium ? faker.datatype.boolean({ probability: 0.6 }) : false
  }),

  // Generate realistic battle scenarios
  battleChallenges: (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const challengeTypes = ['math', 'pattern', 'memory', 'reaction'] as const;
    const difficultyMultiplier = { easy: 0.5, medium: 1, hard: 1.5 }[difficulty];

    return faker.helpers.multiple(() => ({
      type: faker.helpers.arrayElement(challengeTypes),
      difficulty: Math.floor(faker.number.int({ min: 1, max: 10 }) * difficultyMultiplier),
      timeLimit: faker.number.int({ min: 10, max: 120 }) * 1000, // milliseconds
      completed: faker.datatype.boolean({ probability: 0.7 }),
      score: faker.number.int({ min: 0, max: 100 })
    }), { count: { min: 1, max: 5 } });
  }
};

// Bulk data generators
export const _generateTestDataSets = {
  // Generate a complete user cohort for testing
  userCohort: (size: number, premiumPercentage = 0.3): TestUser[] => {
    const users: TestUser[] = [];

    for (let i = 0; i < size; i++) {
      const isPremium = Math.random() < premiumPercentage;
      const createdDaysAgo = faker.number.int({ min: 1, max: 365 });

      const user = new TestUserBuilder()
        .withCreationDate(createdDaysAgo)
        .withPreferences(generateRealisticTestData.userPreferences(isPremium));

      if (isPremium) {
        const tier = faker.helpers.weightedArrayElement([
          { weight: 0.7, value: 'premium' as const },
          { weight: 0.3, value: 'ultimate' as const }
        ]);
        user.withSubscription(tier);
      }

      users.push(user.build());
    }

    return users;
  },

  // Generate alarm patterns for a user
  userAlarms: (userId: string, count: number, userTier: 'free' | 'premium' | 'ultimate' = 'free'): TestAlarm[] => {
    const maxAlarms = { free: 5, premium: 25, ultimate: 50 }[userTier];
    const actualCount = Math.min(count, maxAlarms);
    const isPremium = userTier !== 'free';

    const alarms: TestAlarm[] = [];

    for (let i = 0; i < actualCount; i++) {
      const alarm = new TestAlarmBuilder()
        .withUserId(userId)
        .withTime(generateRealisticTestData.alarmTime())
        .withDays(generateRealisticTestData.alarmDays())
        .withLabel(faker.helpers.arrayElement([
          'Morning Workout', 'Work Start', 'School Time', 'Gym Session',
          'Study Time', 'Meeting Reminder', 'Wake Up', 'Daily Standup'
        ]))
        .enabled(faker.datatype.boolean({ probability: 0.8 }));

      // Add premium features for premium users
      if (isPremium && Math.random() < 0.4) {
        alarm.withBattleMode(true, faker.helpers.arrayElement(['easy', 'medium', 'hard']));
      }

      alarms.push(alarm.build());
    }

    return alarms;
  },

  // Generate battle tournament data
  battleTournament: (participantCount: number): TestBattle[] => {
    const battles: TestBattle[] = [];
    const participants: string[] = Array.from({ length: participantCount }, () => faker.string.uuid());

    // Generate elimination rounds
    let currentParticipants = [...participants];
    let round = 1;

    while (currentParticipants.length > 1) {
      const roundBattles = [];

      for (let i = 0; i < currentParticipants.length; i += 2) {
        if (i + 1 < currentParticipants.length) {
          const battle = new TestBattleBuilder()
            .withParticipants([currentParticipants[i], currentParticipants[i + 1]])
            .withDifficulty(faker.helpers.arrayElement(['easy', 'medium', 'hard']))
            .withChallenges(generateRealisticTestData.battleChallenges())
            .completed()
            .withWinner(faker.helpers.arrayElement([currentParticipants[i], currentParticipants[i + 1]]))
            .build();

          roundBattles.push(battle);
        }
      }

      battles.push(...roundBattles);
      currentParticipants = roundBattles.map(battle => battle.winner!);
      round++;
    }

    return battles;
  }
};

// Convenience builder functions
export const _createUser = (overrides?: Partial<TestUser>) =>
  new TestUserBuilder(overrides);
export const _createAlarm = (overrides?: Partial<TestAlarm>) =>
  new TestAlarmBuilder(overrides);
export const _createBattle = (overrides?: Partial<TestBattle>) =>
  new TestBattleBuilder(overrides);

// Export builders for easy access
export { TestUserBuilder, TestAlarmBuilder, TestBattleBuilder };

// Default data generators
export const _defaultTestData = {
  guestUser: () => createUser().asGuest().build(),
  premiumUser: () => createUser().asPremium().build(),
  adminUser: () => createUser().asAdmin().build(),

  morningAlarm: (userId?: string) =>
    createAlarm({ userId }).withTime('07:00').weekdays().build(),

  workoutAlarm: (userId?: string) =>
    createAlarm({ userId })
      .withTime('06:00')
      .withLabel('Morning Workout')
      .withDifficulty('hard')
      .build(),

  activeBattle: () =>
    createBattle()
      .active()
      .withDifficulty('medium')
      .withChallenges(generateRealisticTestData.battleChallenges('medium'))
      .build()
};

// Data validation helpers
export const _validateTestData = {
  user: (user: TestUser): boolean => {
    return !!(user.id && user.email && user.name && user.role && user.createdAt);
  },

  alarm: (alarm: TestAlarm): boolean => {
    return !!(
      alarm.id &&
      alarm.userId &&
      alarm.time &&
      alarm.label &&
      alarm.days &&
      alarm.dayNames &&
      alarm.voiceMood &&
      alarm.difficulty
    );
  },

  battle: (battle: TestBattle): boolean => {
    return !!(
      battle.id &&
      battle.participants &&
      battle.participants.length >= 2 &&
      battle.status &&
      battle.difficulty &&
      battle.startTime &&
      battle.endTime
    );
  }
};