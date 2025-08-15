# 📱 Visual Configuration Interface - Step-by-Step Setup

## 🎯 Accessing Advanced Condition Settings

### **Navigation Path:**
1. Open Relife App
2. Tap **"Alarms"** tab at bottom
3. Select your alarm (tap existing or create new with **"+"**)
4. Look for **"🧠 Smart Settings"** or **"Enhanced Settings"** button
5. Tap **"Conditions"** tab (2nd tab in settings)

## 🌦️ Weather Conditions Setup

### **Basic Weather Configuration**

#### **Step 1: Enable Weather Monitoring**
```
Toggle Switch: "Weather Conditions" ✅ ON
Location Permission: Allow when prompted
Weather Provider: Auto-detected or select preferred service
```

#### **Step 2: Configure Rain Adjustment**
```
Condition Name: "Light Rain"
Priority: ⭐⭐⭐ (3 stars - Medium)
Trigger: Contains "rain" 
Adjustment: -10 minutes (earlier wake-up)
Max Adjustment: 20 minutes
```

**Visual Setup:**
```
[🌧️ Light Rain Condition]
├── Priority: ⭐⭐⭐ (Medium)
├── Enabled: [✅] ON
├── Trigger When: [Dropdown] "Contains"
│   └── Value: [rain          ] 
├── Adjustment: [-10] minutes earlier
├── Max Change: [20 ] minutes
└── Reason: [Extra commute time for rain]
```

#### **Step 3: Add Severe Weather Protection**
```
[❄️ Snow/Ice Condition]
├── Priority: ⭐⭐⭐⭐⭐ (Critical)
├── Enabled: [✅] ON  
├── Trigger When: [Dropdown] "Contains"
│   └── Value: [snow, ice      ]
├── Adjustment: [-30] minutes earlier
├── Max Change: [60 ] minutes  
└── Reason: [Safety preparation for icy conditions]
```

### **Advanced Weather Settings**

#### **Extreme Temperature Setup**
```
[🌡️ Extreme Cold]
├── Priority: ⭐⭐⭐ (Medium)
├── Enabled: [✅] ON
├── Trigger When: [Dropdown] "Less Than"
│   └── Value: [-10°C / 14°F  ]
├── Adjustment: [-15] minutes earlier
├── Max Change: [25 ] minutes
└── Reason: [Extra car warm-up and layering time]
```

```
[☀️ Perfect Weather Bonus]  
├── Priority: ⭐ (Low)
├── Enabled: [✅] ON
├── Trigger When: [Dropdown] "Equals"
│   └── Value: [clear         ]
├── Adjustment: [+5 ] minutes later
├── Max Change: [15 ] minutes
└── Reason: [Enjoy the beautiful morning]
```

## 📅 Calendar Integration Setup

### **Step 1: Connect Calendar**
```
Calendar Access: [Grant Permission] button
Select Calendars: [✅] Work Calendar
                  [✅] Personal Calendar  
                  [ ] Other calendars...
Scan Keywords: [✅] Enabled
```

### **Step 2: Critical Events Configuration**
```
[🎯 Critical Events]
├── Priority: ⭐⭐⭐⭐⭐ (Critical)
├── Enabled: [✅] ON
├── Keywords: [critical, urgent, CEO, interview]
├── Adjustment: [-45] minutes earlier
├── Max Change: [90 ] minutes
└── Reason: [Critical events need extensive prep]
```

**Keyword Configuration Interface:**
```
Event Keywords (comma-separated):
┌─────────────────────────────────────┐
│ critical, urgent, emergency, CEO,   │
│ interview, presentation, board      │
└─────────────────────────────────────┘

Priority Events (auto-detected):
✅ Meetings with "Important" flag
✅ All-day events  
✅ Events marked high priority
✅ Recurring critical meetings
```

### **Step 3: Weekend & Holiday Mode**
```
[🏖️ Weekend Mode]
├── Priority: ⭐⭐ (Low)
├── Enabled: [✅] ON
├── Days: [✅] Saturday [✅] Sunday
├── Adjustment: [+45] minutes later
├── Max Change: [120] minutes
└── Reason: [Weekend relaxation time]
```

```
[🎉 Holiday Mode]  
├── Priority: ⭐⭐ (Low)
├── Enabled: [✅] ON
├── Holiday Detection: [✅] Auto-detect holidays
├── Custom Dates: [Add Custom...] button
├── Adjustment: [+60] minutes later  
├── Max Change: [150] minutes
└── Reason: [Holiday sleep-in bonus]
```

### **Step 4: Travel Day Settings**
```
[✈️ Travel Days]
├── Priority: ⭐⭐⭐⭐⭐ (Critical)
├── Enabled: [✅] ON
├── Keywords: [flight, travel, airport, departure]
├── Adjustment: [-90] minutes earlier
├── Max Change: [180] minutes
└── Reason: [Airport/travel preparation time]
```

## 😴 Sleep Pattern Configuration

### **Step 1: Sleep Tracking Integration**
```
Sleep Data Source: 
[ ] Phone sensors (basic)
[✅] Fitness tracker (recommended)
[ ] Smart watch
[ ] Manual entry

Sleep Goal: [8h 00m] per night
Bedtime Target: [10:30 PM]
```

### **Step 2: Sleep Debt Management**
```
[😴 Sleep Debt Levels]

Minor Debt (15-30 min):
├── Priority: ⭐⭐ (Low)
├── Enabled: [✅] ON
├── Adjustment: [-5 ] minutes earlier
└── Max Change: [10 ] minutes

Moderate Debt (30-60 min):  
├── Priority: ⭐⭐⭐ (Medium)
├── Enabled: [✅] ON
├── Adjustment: [-15] minutes earlier
└── Max Change: [25 ] minutes

High Debt (1-2 hours):
├── Priority: ⭐⭐⭐⭐ (High)
├── Enabled: [✅] ON  
├── Adjustment: [-25] minutes earlier
└── Max Change: [45 ] minutes

Severe Debt (2+ hours):
├── Priority: ⭐⭐⭐⭐⭐ (Critical)
├── Enabled: [✅] ON
├── Adjustment: [-40] minutes earlier  
└── Max Change: [75 ] minutes
```

### **Step 3: Sleep Quality Adjustments**
```
[⭐ Sleep Quality Response]

Poor Quality (<5/10):
├── Priority: ⭐⭐⭐⭐ (High)
├── Enabled: [✅] ON
├── Adjustment: [-20] minutes earlier
├── Max Change: [35 ] minutes
└── Action: Earlier bedtime suggestion

Excellent Quality (8.5+/10):
├── Priority: ⭐ (Low)
├── Enabled: [✅] ON
├── Adjustment: [+10] minutes later
├── Max Change: [20 ] minutes
└── Reward: Relaxed wake-up bonus
```

### **Step 4: Sleep Stage Optimization**
```
[🧠 Sleep Stage Intelligence]

Deep Sleep Avoidance:
├── Enabled: [✅] ON
├── Detection: Smart algorithm prediction
├── Adjustment: [+20] minutes (wait for lighter stage)
├── Max Delay: [35 ] minutes
└── Benefit: Reduce grogginess

Light Sleep Preference:
├── Enabled: [✅] ON  
├── Opportunity Window: [±15] minutes
├── Adjustment: [-5 ] minutes (catch optimal window)
└── Benefit: Natural, easy wake-up
```

## 🏋️ Exercise & Activity Configuration

### **Step 1: Fitness Integration**
```
Activity Data Source:
[✅] Apple Health / Google Fit
[ ] Strava
[ ] Fitbit  
[ ] Manual logging

Exercise Types to Track:
[✅] Cardio [✅] Strength [✅] Sports
[✅] Yoga   [ ] Walking   [✅] HIIT
```

### **Step 2: Workout Recovery Setup**
```
[💪 Exercise Recovery]

Intense Workout (90+ min):
├── Priority: ⭐⭐⭐ (Medium)
├── Enabled: [✅] ON
├── Trigger: Previous day >90 minutes exercise
├── Adjustment: [+20] minutes later
├── Max Change: [40 ] minutes
└── Reason: Extra recovery sleep needed

Morning Workout Prep:
├── Priority: ⭐⭐⭐⭐ (High)
├── Enabled: [✅] ON
├── Trigger: Calendar contains "workout", "gym"
├── Adjustment: [-30] minutes earlier
├── Max Change: [45 ] minutes
└── Reason: Pre-workout preparation time
```

## 💡 Smart Configuration Interface

### **Condition Priority Visualization**
```
Priority Levels (drag to reorder):

🔴 CRITICAL (5 stars)
├── Travel Days
├── Snow/Ice Weather  
├── Critical Meetings
└── Severe Sleep Debt

🟠 HIGH (4 stars)  
├── Important Meetings
├── Heavy Rain
├── High Sleep Debt
└── Morning Workouts

🟡 MEDIUM (3 stars)
├── Light Rain
├── Busy Days
├── Moderate Sleep Debt
└── Stress Management

🟢 LOW (2 stars)
├── Weekend Mode
├── Screen Time Impact
└── Minor Sleep Debt

🔵 MINIMAL (1 star)
├── Perfect Weather
├── Free Days
└── Small Bonuses
```

### **Effectiveness Monitoring Dashboard**
```
[📊 Condition Performance - Last 30 Days]

Weather Conditions:        ████████░░ 82% effective
├── Rain Adjustment:       ████████░░ 85% ✅
├── Snow Preparation:      ██████████ 95% ✅✅  
└── Perfect Weather:       ██████░░░░ 65% ⚠️

Calendar Events:           ████████░░ 87% effective
├── Important Meetings:    ████████░░ 92% ✅✅
├── Weekend Mode:          ██████████ 98% ✅✅
└── Travel Days:          ████████░░ 88% ✅

Sleep Management:          ███████░░░ 78% effective
├── High Sleep Debt:       ████████░░ 83% ✅
├── Sleep Quality:         ███████░░░ 75% ⚠️
└── Sleep Stage:          ████████░░ 87% ✅

Overall Satisfaction:      ████████░░ 84% ✅
```

### **Quick Action Buttons**
```
[🚀 Quick Setup]    [📋 Copy Settings]    [🔄 Reset All]

[⚡ Presets]
├── Professional  ←  [Apply]
├── Student      ←  [Apply]  
├── Fitness      ←  [Apply]
├── Parent       ←  [Apply]
└── Custom       ←  [Configure]
```

## 🔧 Advanced Settings Panel

### **Fine-Tuning Controls**
```
[⚙️ Advanced Configuration]

Learning Speed:           [████░░░░░░] 30% 
├── Conservative (20%):   Slow, stable changes
├── Moderate (30%):       Balanced learning ← Current
├── Aggressive (50%):     Fast adaptation

Sleep Pattern Weight:     [███████░░░] 70%
├── Patterns Focus (80%): Prioritize sleep data  
├── Balanced (70%):       Mix patterns & conditions ← Current
├── Conditions Focus (50%): Emphasize external factors

Confidence Threshold:     [██████░░░░] 60%
├── Conservative (70%):   High confidence required
├── Moderate (60%):       Balanced approach ← Current  
├── Aggressive (50%):     Lower confidence OK

Max Daily Adaptations:    [█████░░░░░] 5
├── Minimal (3):          Very stable schedule
├── Moderate (5):         Balanced adjustments ← Current
├── Active (8):           Frequent optimization
```

### **Monitoring & Notifications**
```
[📱 Smart Notifications]

Adaptation Alerts:        [✅] ON
├── "Your alarm was adjusted -15 min due to rain"
├── Show reason and confidence level
└── Allow manual override

Weekly Summary:           [✅] ON  
├── "This week: 4 adaptations, 87% satisfaction"
├── Top performing conditions
└── Optimization suggestions

Condition Updates:        [✅] ON
├── "Weather condition improved to 90% effectiveness"
├── Suggestions to enable/disable conditions
└── New condition recommendations
```

## 📋 Setup Checklist

### **Essential Setup (5 minutes)**
```
✅ Enable Real-Time Adaptation
✅ Grant location permission for weather
✅ Connect calendar (work & personal)
✅ Enable basic conditions:
   ├── ✅ Light rain (-10 min)
   ├── ✅ Important meetings (-30 min)
   ├── ✅ High sleep debt (-25 min)
   └── ✅ Weekend mode (+45 min)
✅ Set learning factor to 30%
✅ Set sleep pattern weight to 70%
```

### **Advanced Setup (15 minutes)**
```
✅ Add weather extremes (snow, heat, wind)
✅ Configure travel day detection
✅ Set up exercise recovery tracking
✅ Enable sleep stage optimization  
✅ Add stress level monitoring
✅ Configure screen time impact
✅ Set up effectiveness monitoring
✅ Enable smart notifications
```

### **User Type Optimization (10 minutes)**
```
Choose your profile and apply preset:

👨‍💼 Professional:
✅ Focus on meetings and commute
✅ Conservative learning (20%)
✅ Balanced sleep weight (70%)

🎓 Student:  
✅ Exam and deadline detection
✅ Flexible learning (40%)
✅ Equal weight (50%)

🏋️‍♀️ Fitness:
✅ Exercise recovery priority
✅ Moderate learning (30%)  
✅ Sleep pattern focus (80%)

🌍 Shift Worker:
✅ Schedule change detection
✅ Fast learning (50%)
✅ Condition focus (40%)
```

## ⚡ Quick Test & Validation

### **Test Your Configuration**
```
[🧪 Configuration Test]

Test Scenario:           [Dropdown ▼]
├── Rainy Tuesday morning
├── Important meeting day
├── Weekend sleep-in
└── High sleep debt night

Predicted Adjustment:    [-15] minutes
Confidence Level:        [████████░░] 82%
Triggered Conditions:    
├── ✅ Light rain (-10 min)
├── ✅ Important meeting (-30 min)
└── ✅ Sleep debt (-15 min)
Final Adjustment:        [-15 min] (weighted average)

[Run Test] [Save Configuration] [Get Recommendations]
```

Your advanced condition-based adjustments are now configured for intelligent, personalized wake-up optimization! 🎯