# 🚀 Quick Start Guide for Translators

New to translating for Relife? This guide will get you started in minutes!

## ⚡ 5-Minute Setup

### 1. Check What Needs Work
```bash
# See current translation status
node scripts/manage-translations.mjs validate
```

### 2. Pick Your Language
Look for languages with missing translations or choose a new language to add.

**Currently Supported (22 languages)**:
- English: `en`, `en-GB`, `en-AU`
- Spanish: `es`, `es-MX`, `es-419`
- French: `fr`, `fr-CA`
- German: `de`
- Asian: `ja`, `zh`, `zh-TW`, `ko`, `hi`, `th`, `vi`, `bn`, `id`
- European: `pt`, `pt-BR`, `it`, `ru`
- Middle East: `ar`

### 3. Start Translating
```bash
# Create language directories (if new language)
node scripts/manage-translations.mjs setup

# Create your feature branch
git checkout -b translations/[your-language-code]

# Edit translation files in /public/locales/[language-code]/
```

## 📁 Translation Files Priority

Translate in this order for maximum impact:

1. **`common.json`** (90 keys) - Navigation, buttons, core UI
2. **`alarms.json`** (84 keys) - Main alarm functionality  
3. **`auth.json`** (64 keys) - Login, registration
4. **`gaming.json`** (102 keys) - Gamification features
5. **`settings.json`** (126 keys) - App preferences
6. **`errors.json`** (69 keys) - Error messages

**Total: 535 translation keys per language**

## 🎯 Translation Rules

### ✅ Do This
- **Keep variables intact**: `{{userName}}`, `{{count}}` must stay exactly the same
- **Translate meaning**: Focus on what makes sense in your language
- **Stay consistent**: Use the same terms throughout all files
- **Test your work**: Run `node scripts/manage-translations.mjs validate`

### ❌ Avoid This
- Changing interpolation variables
- Direct word-for-word translation without considering context
- Mixing formal/informal tone within the same file

## 📝 File Format
```json
{
  "welcome": {
    "title": "Good morning!",
    "subtitle": "Ready to start your day, {{userName}}?"
  },
  "buttons": {
    "start": "Get Started",
    "cancel": "Cancel"
  }
}
```

## 🔍 Validation Commands
```bash
# Check your progress
node scripts/manage-translations.mjs validate

# Generate missing key templates  
node scripts/manage-translations.mjs generate

# Get detailed report
node scripts/manage-translations.mjs report
```

## 🌍 Cultural Tips

### Tone & Style
- **Encouraging**: Keep the motivational, positive tone
- **Accessible**: Write for everyday mobile app users
- **Appropriate**: Consider cultural norms around productivity and morning routines

### Technical Adaptation
- **Time formats**: 12h vs 24h handled automatically
- **Currency**: Handled by the i18n system
- **Date formats**: Automatically localized per region

## 🚀 Submission Process

1. **Validate**: Run the validation script
2. **Test**: Check your translations in the app (optional but recommended)
3. **Commit**: `git add . && git commit -m "Add [language] translations"`
4. **Push**: `git push origin translations/[language-code]`
5. **PR**: Create pull request with description of your work

## 📋 PR Checklist Template

```markdown
## Translation Contribution

**Language**: [Language Name] (`language-code`)
**Files Completed**: 
- [ ] common.json (90 keys)
- [ ] alarms.json (84 keys)  
- [ ] auth.json (64 keys)
- [ ] gaming.json (102 keys)
- [ ] settings.json (126 keys)
- [ ] errors.json (69 keys)

**Validation**: 
- [ ] Validation script passes
- [ ] All variables preserved
- [ ] Consistent terminology

**Cultural Notes**: [Any cultural adaptations you made]
```

## 🆘 Need Help?

- **Validation errors?** Run `node scripts/manage-translations.mjs validate` for details
- **Not sure about context?** Check the existing English files for reference
- **Questions?** Open a GitHub issue or check the full [Translation Guidelines](../TRANSLATION_GUIDELINES.md)

## 🎉 You're Ready!

Jump in and start translating! Even completing one file makes a huge difference for users who speak your language.

Remember: **Quality over speed** - focus on creating translations that feel natural and helpful to users.

---

**Need more details?** Check out the comprehensive [Translation Guidelines](../TRANSLATION_GUIDELINES.md) for advanced topics and best practices.