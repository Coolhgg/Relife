# 🌍 Translation Files

This directory contains all translation files for the Relife Alarms application. Each language has its own subdirectory with JSON files containing localized text.

## 📁 Directory Structure

```
locales/
├── en/                 # English (American) - Reference language
├── en-GB/              # English (British)
├── en-AU/              # English (Australian)
├── es/                 # Spanish (European)
├── es-MX/              # Spanish (Mexican)
├── es-419/             # Spanish (Latin American)
├── fr/                 # French (European)
├── fr-CA/              # French (Canadian)
├── de/                 # German
├── ja/                 # Japanese
├── zh/                 # Chinese (Simplified)
├── zh-TW/              # Chinese (Traditional)
├── ar/                 # Arabic
├── hi/                 # Hindi
├── ko/                 # Korean
├── pt/                 # Portuguese (European)
├── pt-BR/              # Portuguese (Brazilian)
├── it/                 # Italian
├── ru/                 # Russian
├── id/                 # Indonesian
├── bn/                 # Bengali
├── vi/                 # Vietnamese
└── th/                 # Thai
```

## 📋 Translation Files

Each language directory contains 6 JSON files:

| File | Purpose | Keys | Description |
|------|---------|------|-------------|
| `common.json` | Core UI elements | ~90 | Navigation, buttons, labels, accessibility |
| `alarms.json` | Alarm functionality | ~84 | Alarm management, challenges, notifications |
| `auth.json` | Authentication | ~64 | Login, registration, profile management |
| `gaming.json` | Gamification features | ~102 | Battles, friends, achievements, leaderboards |
| `settings.json` | Application settings | ~126 | Preferences, configuration options |
| `errors.json` | Error messages | ~69 | User-friendly error descriptions |

## 🚀 Quick Start

### For Contributors

1. **Check translation status**: Run `node scripts/manage-translations.mjs validate` from project root
2. **Find your language**: Look for your language code in the directories above
3. **Review guidelines**: Read [TRANSLATION_GUIDELINES.md](../../TRANSLATION_GUIDELINES.md) for detailed instructions
4. **Start translating**: Begin with `common.json` as it contains the most frequently used terms

### For Developers

```javascript
// Import translation hook
import { useTranslation } from 'react-i18next';

// Use in component
function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome.title')}</h1>;
}
```

## 🔧 Management Tools

### Validation Script
```bash
# Validate all translations
node scripts/manage-translations.mjs validate

# Generate missing key templates
node scripts/manage-translations.mjs generate

# Create language directories
node scripts/manage-translations.mjs setup

# Generate detailed report
node scripts/manage-translations.mjs report
```

### File Format
All translation files use JSON format with nested objects:

```json
{
  "section": {
    "subsection": {
      "key": "Translated text"
    }
  },
  "interpolation": "Hello {{name}}!",
  "plurals": "{{count}} item_one||{{count}} items_other"
}
```

## ✅ Translation Status

Use the management script to check current translation completeness:

```bash
node scripts/manage-translations.mjs report
```

This will show completion percentage for each language and file.

## 📝 Contributing

1. **Read the guidelines**: [TRANSLATION_GUIDELINES.md](../../TRANSLATION_GUIDELINES.md)
2. **Choose a language**: Pick from the supported languages list
3. **Create a branch**: `git checkout -b translations/[language-code]`
4. **Translate files**: Start with high-priority files
5. **Validate**: Run the validation script frequently
6. **Submit PR**: Include translation details and testing notes

## 🆘 Need Help?

- **Translation Guidelines**: [TRANSLATION_GUIDELINES.md](../../TRANSLATION_GUIDELINES.md)
- **Project Issues**: Open a GitHub issue
- **Validation Errors**: Run `node scripts/manage-translations.mjs validate` for details

---

Thank you for helping make Relife accessible to users worldwide! 🌍