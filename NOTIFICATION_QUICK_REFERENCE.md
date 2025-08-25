# 🔔 Notification System - Quick Reference

## 🚀 Quick Start Commands

```bash
# 1. Configure notifications (interactive setup)
npm run notifications:setup

# 2. Test your configuration
npm run test:notifications

# 3. Test specific components
npm run test:notifications -- --type=push
npm run test:notifications -- --type=email
npm run test:notifications -- --type=security

# 4. Open test demo page
open notification-test-demo.html
```

## 📁 Key Files & Configuration

### **Environment Variables (.env.local)**
```env
# Web Push (VAPID)
VITE_VAPID_PUBLIC_KEY=your_key_here
VAPID_PRIVATE_KEY=your_key_here
VAPID_SUBJECT=mailto:your-email@domain.com

# Mobile Push (FCM)
FCM_SERVER_KEY=your_server_key_here
FCM_SENDER_ID=your_sender_id_here

# Email Campaigns
CONVERTKIT_API_KEY=your_api_key_here
CONVERTKIT_API_SECRET=your_secret_here

# Security Keys (auto-generated)
NOTIFICATION_SIGNING_KEY=auto_generated
NOTIFICATION_ENCRYPTION_KEY=auto_generated
```

### **Core Service Files**
- `src/services/push-notifications.ts` - Main push notification service
- `src/services/email-campaign.ts` - Email campaign management
- `src/services/secure-push-notification.ts` - Security & validation
- `src/services/smart-notification-service.ts` - AI & smart timing
- `src/components/PushNotificationSettings.tsx` - Settings UI

### **Configuration Files**
- `capacitor.config.ts` - Mobile app notification config
- `public/sw-unified.js` - Service worker for notifications
- `NOTIFICATION_CONFIGURATION_GUIDE.md` - Complete setup guide

## ⚡ One-Line Setup

```bash
npm run notifications:setup && npm run test:notifications && open notification-test-demo.html
```

## 🎯 Notification Types Available

- ⏰ **Alarm Reminders** - Scheduled wake-up alerts
- 💪 **Daily Motivation** - Encouraging messages
- 📊 **Weekly Progress** - Achievement summaries  
- 🔄 **System Updates** - App updates & news
- 🚨 **Emergency Alerts** - Critical notifications
- 🧠 **Emotional Support** - AI-driven personalized messages

## 📱 Platform Support

- ✅ **Web Push** - All modern browsers with VAPID
- ✅ **iOS Push** - Native iOS notifications via Capacitor
- ✅ **Android Push** - FCM integration with background support
- ✅ **Email** - ConvertKit integration with persona detection

## 🔒 Security Features

- ✅ **Signature Validation** - Cryptographic message verification
- ✅ **Rate Limiting** - Prevents notification spam
- ✅ **Trust Scoring** - Blocks suspicious senders
- ✅ **Replay Protection** - Prevents duplicate deliveries
- ✅ **Encryption** - End-to-end encrypted payloads

## 🧠 Smart Features

- ✅ **Quiet Hours** - Respects sleep schedule (22:00-07:00)
- ✅ **Battery Optimization** - Reduces notifications on low battery
- ✅ **Location Awareness** - Context-based delivery timing
- ✅ **Emotional AI** - Mood-based message personalization
- ✅ **Persona Detection** - User behavior analysis for targeting

## 🆘 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| No VAPID keys | Run `npm run notifications:setup` |
| Permissions blocked | Clear browser data, request again |
| Mobile not working | Run `npm run cap:sync` |
| FCM errors | Check `google-services.json` location |
| Email not sending | Verify ConvertKit API keys |
| Rate limited | Adjust `RATE_LIMIT_MAX_REQUESTS` |

## 📞 Support Resources

- 📖 **Full Guide**: `NOTIFICATION_CONFIGURATION_GUIDE.md`
- 🧪 **Test Demo**: `notification-test-demo.html`
- ⚙️ **Setup Script**: `setup-notification-env.js`
- 🔍 **Test Script**: `test-notifications.js`

---

**Your notification system is enterprise-ready! 🚀**