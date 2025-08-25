# 🔔 Notification Configuration Guide - Relife Smart Alarm

## 🎯 Overview

Your Relife app has a **comprehensive notification system** already implemented with advanced features:

✅ **Push Notifications** - Web & Mobile with security validation  
✅ **Email Campaigns** - Persona-based automated sequences  
✅ **Emotional Intelligence** - AI-driven personalized notifications  
✅ **Smart Timing** - Context-aware delivery optimization  
✅ **Security Features** - Signature validation & rate limiting  

## 📋 Configuration Checklist

### 1️⃣ Push Notifications Setup

#### **Web Push (VAPID Keys)**
```env
# Generate VAPID keys for web push notifications
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:your-email@domain.com
```

**Generate VAPID Keys:**
```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

#### **Mobile Push (Firebase/FCM)**
```env
# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_SENDER_ID=your_fcm_sender_id_here
```

**Firebase Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create/select your project
3. Navigate to Project Settings → Cloud Messaging
4. Copy Server Key and Sender ID

### 2️⃣ Email Campaign Configuration

#### **ConvertKit Integration**
```env
# ConvertKit API credentials
CONVERTKIT_API_KEY=your_convertkit_api_key_here
CONVERTKIT_API_SECRET=your_convertkit_secret_here
CONVERTKIT_WEBHOOK_SECRET=your_webhook_secret_here
```

**ConvertKit Setup:**
1. Login to [ConvertKit](https://app.convertkit.com)
2. Go to Settings → Advanced → API Keys
3. Copy API Key and API Secret
4. Set up webhooks for subscriber events

### 3️⃣ Mobile Platform Setup

#### **iOS Configuration**
```json
// ios/App/App/Info.plist additions
<dict>
  <key>UIBackgroundModes</key>
  <array>
    <string>background-processing</string>
    <string>remote-notification</string>
  </array>
</dict>
```

#### **Android Configuration**
```json
// android/app/src/main/AndroidManifest.xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 4️⃣ Security Configuration

#### **Notification Security Keys**
```env
# Security for notification validation
NOTIFICATION_SIGNING_KEY=your_notification_signing_key_here
NOTIFICATION_ENCRYPTION_KEY=your_32_byte_encryption_key_here
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=15
```

**Generate Security Keys:**
```bash
# Generate signing key (256-bit)
openssl rand -base64 32

# Generate encryption key (256-bit)  
openssl rand -base64 32
```

---

## ⚙️ Quick Setup Commands

### **Run Environment Setup**
```bash
# Set up notification environment variables
node setup-notification-env.js
```

### **Test Notification System**
```bash
# Test all notification types
node test-notifications.js

# Test specific notification type
node test-notifications.js --type=push
node test-notifications.js --type=email
```

### **Mobile Platform Sync**
```bash
# Sync mobile platforms with notification config
npm run cap:sync
npm run cap:sync:android
npm run cap:sync:ios
```

---

## 🧪 Testing Your Setup

### **Quick Test Demo**
```bash
# Open the interactive notification test page
open notification-test-demo.html
# or serve it locally:
python -m http.server 8000
# Then visit: http://localhost:8000/notification-test-demo.html
```

### **1. Web Push Notifications**
- Open your app in browser
- Navigate to Settings → Notifications
- Click "Test Push Notification" 
- **Expected**: Browser notification appears
- **Demo**: Use `notification-test-demo.html` for interactive testing

### **2. Mobile Push Notifications**
- Install app on device via `npm run cap:open:android`
- Enable notification permissions
- Test from notification settings panel
- **Expected**: Native mobile notification appears

### **3. Email Campaigns**
- Add test subscriber in ConvertKit
- Trigger welcome sequence
- **Expected**: Persona-based email received

### **4. Emotional Intelligence Notifications**
- Set emotional state in app
- Wait for context-aware notification
- **Expected**: Personalized message based on mood
- **Demo**: Test different moods in the demo page

---

## 🎛️ Notification Types Available

### **Push Notifications**
```javascript
// Already configured types:
- ALARM_REMINDER: Scheduled wake-up alerts
- DAILY_MOTIVATION: Encouraging messages
- WEEKLY_PROGRESS: Achievement summaries
- SYSTEM_UPDATE: App updates
- EMERGENCY_ALERT: Critical notifications
- EMOTIONAL_SUPPORT: AI-driven messages
```

### **Email Campaigns**
```javascript
// Persona-based email sequences:
- struggling_sam: Encouragement & tips
- busy_ben: Quick productivity hacks
- professional_paula: Professional insights
- enterprise_emma: Team management
- student_sarah: Study optimization
```

---

## 🔧 Advanced Configuration

### **Smart Timing Settings**
```env
# Adaptive notification timing
SMART_TIMING_ENABLED=true
QUIET_HOURS_START=22:00
QUIET_HOURS_END=07:00
BATTERY_OPTIMIZATION=true
LOCATION_AWARENESS=true
```

### **Emotional Intelligence Config**
```env
# AI-driven notification personalization
EMOTIONAL_AI_ENABLED=true
SENTIMENT_ANALYSIS_ENDPOINT=your_ai_endpoint_here
EMOTIONAL_PROFILE_UPDATES=true
```

### **Security & Rate Limiting**
```env
# Advanced security settings
NOTIFICATION_SIGNATURE_VALIDATION=true
NOTIFICATION_REPLAY_PROTECTION=true
SUSPICIOUS_SENDER_BLOCKING=true
TRUST_SCORING_ENABLED=true
```

---

## 📊 Monitoring & Analytics

### **Notification Metrics**
Your app automatically tracks:
- ✅ Delivery success rates
- 📱 Device engagement metrics  
- 🧠 Emotional response tracking
- 🎯 Persona detection accuracy
- 🔒 Security event logging

### **Dashboard Access**
- **Push Stats**: Settings → Notifications → Analytics
- **Email Metrics**: Integrated ConvertKit dashboard
- **Security Events**: Admin → Security → Notifications

---

## 🆘 Troubleshooting

### **Push Notifications Not Working**
```bash
# Check VAPID keys are set
echo $VAPID_PUBLIC_KEY

# Verify service worker registration
# Open browser DevTools → Application → Service Workers

# Test notification permissions
# Browser settings → Notifications → Allow for your domain
```

**Common Issues:**
- ❌ **"No VAPID public key"** → Run `npm run notifications:setup`
- ❌ **"Service worker not found"** → Check `public/sw-unified.js` exists
- ❌ **"Permission denied"** → Clear browser data and request permission again
- ❌ **"Notifications not showing"** → Check Do Not Disturb is disabled

### **Mobile Notifications Issues**
```bash
# Check Capacitor plugin installation
npm list @capacitor/push-notifications
npm list @capacitor/local-notifications

# Verify FCM configuration
# Check android/app/google-services.json exists
# Check ios/App/GoogleService-Info.plist exists

# Sync mobile configuration
npm run cap:sync
```

**Common Mobile Issues:**
- ❌ **"Plugin not found"** → Run `npm install @capacitor/push-notifications`
- ❌ **"FCM token error"** → Verify `google-services.json` is in correct location
- ❌ **"iOS notifications silent"** → Check notification settings in iOS app
- ❌ **"Android background issues"** → Disable battery optimization for your app

### **Email Campaign Not Triggering**
```bash
# Verify ConvertKit webhook setup
curl -X POST your-domain.com/api/convertkit/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Check subscriber creation in ConvertKit dashboard
```

**Common Email Issues:**
- ❌ **"ConvertKit API error"** → Verify API keys in .env.local
- ❌ **"Webhook not receiving"** → Check webhook URL is publicly accessible
- ❌ **"Wrong persona detected"** → Review persona detection logic
- ❌ **"Emails going to spam"** → Set up proper SPF/DKIM records

### **Security & Performance Issues**
```bash
# Check security configuration
node test-notifications.js --type=security

# Monitor notification rate limiting
tail -f logs/notification-security.log
```

**Common Security Issues:**
- ❌ **"Signature validation failed"** → Regenerate signing keys
- ❌ **"Rate limit exceeded"** → Adjust RATE_LIMIT_MAX_REQUESTS
- ❌ **"Suspicious sender blocked"** → Check trust scoring configuration

### **Smart Timing Issues**
- ❌ **"Quiet hours not working"** → Verify time format is HH:MM
- ❌ **"Battery optimization not detecting"** → Enable location services
- ❌ **"Context awareness off"** → Check LOCATION_AWARENESS=true

### **Quick Diagnostic Commands**
```bash
# Run full notification system test
npm run test:notifications

# Test specific component
npm run test:notifications -- --type=push
npm run test:notifications -- --type=email
npm run test:notifications -- --type=security

# View notification logs
tail -f logs/notifications.log

# Check environment configuration
node -e "console.log(require('dotenv').config())"
```

---

## 🎉 Success Indicators

Your notification system is working when:

✅ **Web notifications** appear with custom sounds and actions  
✅ **Mobile notifications** show on lock screen with badges  
✅ **Email campaigns** trigger based on user persona  
✅ **Smart timing** respects quiet hours and context  
✅ **Emotional AI** adapts messages to user mood  
✅ **Security validation** prevents malicious notifications  
✅ **Analytics** track all notification metrics  

---

## 🚀 Next Steps

1. **Run setup script**: `node setup-notification-env.js`
2. **Configure VAPID keys** for web push
3. **Set up Firebase/FCM** for mobile push  
4. **Connect ConvertKit** for email campaigns
5. **Test all notification types** 
6. **Monitor analytics** for optimization

Your notification system is enterprise-grade with features that rival major apps! 🔔✨