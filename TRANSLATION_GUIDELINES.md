# 🌍 Translation Guidelines for Relife Alarms

This document provides comprehensive guidelines for contributing high-quality translations to the Relife Alarms project. Our goal is to create an inclusive, culturally-appropriate experience for users worldwide.

## 📋 Table of Contents

- [Overview](#overview)
- [Supported Languages](#supported-languages)
- [Getting Started](#getting-started)
- [Translation Workflow](#translation-workflow)
- [Quality Standards](#quality-standards)
- [Cultural Localization](#cultural-localization)
- [Technical Guidelines](#technical-guidelines)
- [Testing and Validation](#testing-and-validation)
- [Tools and Scripts](#tools-and-scripts)
- [Contribution Process](#contribution-process)
- [Maintenance and Updates](#maintenance-and-updates)

## 📖 Overview

Relife is a life-changing alarm app designed to help users build better morning routines and achieve their goals. Our translation system supports **22 languages** with region-specific variants to provide the best possible user experience across different cultures and markets.

### Translation Philosophy

- **User-Centric**: Prioritize clarity and user understanding over literal translation
- **Culturally Aware**: Adapt content to local customs, etiquette, and expectations
- **Consistent**: Maintain terminology consistency within each language
- **Accessible**: Ensure translations work for users of all technical skill levels

## 🌍 Supported Languages

Our application supports the following languages with their regional variants:

### Primary Languages (Complete)
- **English**: `en`, `en-GB`, `en-AU`
- **Spanish**: `es`, `es-MX`, `es-419` (Latin America)
- **French**: `fr`, `fr-CA`
- **German**: `de`
- **Japanese**: `ja`
- **Chinese**: `zh` (Simplified), `zh-TW` (Traditional)
- **Arabic**: `ar`
- **Korean**: `ko`
- **Portuguese**: `pt`, `pt-BR`
- **Italian**: `it`
- **Russian**: `ru`

### Additional Languages (In Progress)
- **Hindi**: `hi`
- **Indonesian**: `id`
- **Bengali**: `bn`
- **Vietnamese**: `vi`
- **Thai**: `th`

## 🚀 Getting Started

### Prerequisites

1. **Native or fluent proficiency** in the target language
2. **Understanding of the source culture** (English/American) and target culture
3. **Familiarity with alarm/productivity apps** and their terminology
4. **Basic understanding of JSON format** and text interpolation

### Initial Setup

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install` or `bun install`
3. **Run the validation script**: `node scripts/manage-translations.mjs validate`
4. **Explore existing translations** in `/public/locales/[language-code]/`

## 🔄 Translation Workflow

### 1. Language Assignment
- Check the [supported languages](#supported-languages) list
- Verify current translation status using: `node scripts/manage-translations.mjs report`
- Choose a language with missing translations or quality improvements needed

### 2. File Structure
Each language has 6 translation files:

```
/public/locales/[language-code]/
├── common.json      # Core UI, navigation, accessibility (90 keys)
├── alarms.json      # Alarm management, challenges (84 keys)
├── auth.json        # Authentication, profiles (64 keys)
├── gaming.json      # Battles, friends, achievements (102 keys)
├── settings.json    # App settings, preferences (126 keys)
└── errors.json      # User-friendly error messages (69 keys)
```

### 3. Translation Process
1. **Start with `common.json`** - contains the most frequently used terms
2. **Establish terminology** - create a consistent vocabulary for key terms
3. **Work systematically** through each file
4. **Validate frequently** using the management script
5. **Test in context** when possible

## ✅ Quality Standards

### Linguistic Requirements

#### Accuracy
- **Preserve meaning**: Convey the original intent, not just literal words
- **Maintain functionality**: Ensure UI elements remain clear and actionable
- **Respect context**: Consider where and how text will be displayed

#### Consistency
- **Use established terminology**: Maintain a consistent vocabulary throughout
- **Follow platform conventions**: Use terms familiar to users of that platform/OS
- **Maintain tone**: Keep the encouraging, positive tone of the original

#### Clarity
- **Write for your audience**: Use language appropriate for general mobile app users
- **Avoid jargon**: Minimize technical terms unless commonly understood
- **Be concise**: Mobile screens have limited space

### Cultural Requirements

#### Localization (Not Just Translation)
- **Adapt cultural references**: Replace culture-specific examples with local equivalents
- **Consider social norms**: Ensure content aligns with local customs and values
- **Respect religious/cultural sensitivities**: Be mindful of dietary, religious, and cultural practices

#### Regional Differences
- **Use appropriate dialects/variants**: E.g., Mexican Spanish vs. Argentinian Spanish
- **Consider local holidays/events**: Adapt examples and references accordingly
- **Respect local regulations**: Be aware of local laws affecting app functionality

### Technical Requirements

#### Format Preservation
- **Maintain interpolation variables**: Keep `{{variable}}` and `{variable}` placeholders intact
- **Preserve HTML tags**: Maintain `<strong>`, `<em>`, and other formatting
- **Respect line breaks**: Use `\n` where appropriate for multi-line text

#### Character Encoding
- **Use proper Unicode**: Ensure correct encoding for special characters
- **Test character display**: Verify characters display correctly on target devices
- **Consider text expansion**: Some languages require 30-50% more space

## 🎯 Cultural Localization

### Content Adaptation

#### Time and Date Formats
- **Follow local conventions**: Use appropriate date/time formats per region
- **Consider work schedules**: Adapt "morning routine" content to local work patterns
- **Respect cultural time concepts**: Some cultures have different relationships with punctuality

#### Motivational Content
- **Adapt motivational language**: What motivates varies significantly across cultures
- **Consider achievement concepts**: Individual vs. collective achievement emphasis
- **Respect cultural values**: Family, work, personal growth priorities vary

#### Gaming and Competition
- **Adapt competitive language**: Some cultures prefer cooperation over competition
- **Consider appropriate rewards**: What constitutes meaningful recognition varies
- **Respect age and gender norms**: Gaming engagement varies across demographics

### Regional Customization

#### Currency and Numbers
- **Use local currency symbols**: Automatically handled by the i18n system
- **Follow local number formats**: Decimal separators, thousands separators
- **Consider pricing psychology**: Round numbers that work well in each market

#### Legal and Compliance
- **Privacy terminology**: Adapt privacy policy language to local legal requirements
- **Data protection**: Ensure compliance terminology is accurate
- **Age restrictions**: Consider local laws about app usage and data collection

## 🔧 Technical Guidelines

### JSON Structure

```json
{
  "section": {
    "subsection": {
      "key": "Translated text here"
    }
  },
  "simpleKey": "Direct translation",
  "withVariable": "Hello {{name}}, you have {{count}} alarms",
  "withPlural": "You have {{count}} notification_one||notifications_other"
}
```

### Variable Interpolation

#### Standard Variables
```json
{
  "greeting": "Good morning, {{userName}}!",
  "alarmCount": "You have {{count}} active alarms",
  "timeRemaining": "{{hours}} hours and {{minutes}} minutes remaining"
}
```

#### Pluralization
Different languages have different pluralization rules. Use the format:
```json
{
  "itemCount": "{{count}} item_one||{{count}} items_other"
}
```

#### HTML Formatting
```json
{
  "emphasis": "This is <strong>important</strong> information",
  "link": "Visit our <a href='{{url}}'>help center</a> for more info"
}
```

### Special Considerations

#### Right-to-Left (RTL) Languages
For Arabic and other RTL languages:
- **Text direction**: Handled automatically by CSS
- **UI mirroring**: Icons and layouts automatically flip
- **Number formatting**: Numbers remain left-to-right

#### Character Encoding
- **UTF-8 encoding**: All files must use UTF-8
- **Special characters**: Test display on target devices
- **Emoji compatibility**: Consider emoji support across different platforms

## 🧪 Testing and Validation

### Automated Validation

#### Management Script
```bash
# Validate all translations
node scripts/manage-translations.mjs validate

# Generate missing key templates
node scripts/manage-translations.mjs generate

# Create full validation report
node scripts/manage-translations.mjs report
```

#### Translation Validator
The project includes a comprehensive validation system that checks:
- Missing translation keys
- Empty values
- Interpolation variable consistency
- Suspicious translations (same as English)
- JSON syntax errors

### Manual Testing

#### Context Testing
1. **Run the app**: Test translations in the actual user interface
2. **Check layouts**: Ensure text fits properly in UI elements
3. **Verify functionality**: Confirm all interactive elements work correctly
4. **Test different states**: Check error messages, loading states, etc.

#### Device Testing
1. **Mobile responsiveness**: Test on various screen sizes
2. **Platform differences**: iOS vs. Android text rendering
3. **Accessibility**: Screen reader compatibility
4. **Performance**: Translation loading speed

### Quality Assurance Checklist

- [ ] All keys from English (`en`) are translated
- [ ] No empty translation values
- [ ] All interpolation variables preserved
- [ ] Consistent terminology throughout
- [ ] Culturally appropriate content
- [ ] Proper character encoding
- [ ] JSON syntax is valid
- [ ] Text fits in UI layouts
- [ ] All functionality preserved

## 🛠️ Tools and Scripts

### Management Script (`scripts/manage-translations.mjs`)

This powerful script helps manage the translation workflow:

```bash
# Setup new language directories
node scripts/manage-translations.mjs setup

# Validate existing translations
node scripts/manage-translations.mjs validate

# Generate missing key templates
node scripts/manage-translations.mjs generate

# Create detailed report
node scripts/manage-translations.mjs report
```

### Translation Validator (`src/utils/translationValidation.ts`)

Provides programmatic validation with detailed error reporting:
- Missing key detection
- Empty value checking
- Interpolation validation
- Suspicious translation detection
- Structure consistency validation

### Development Tools

#### Live Reload
- Use `npm run dev` to see changes in real-time
- Language switching works immediately without restart

#### Language Switching
- Use the app's language selector to test translations
- Browser developer tools can simulate different languages

## 📝 Contribution Process

### 1. Preparation Phase
1. **Review existing translations** in your target language
2. **Identify missing or incorrect translations**
3. **Create a glossary** of key terms for consistency
4. **Set up development environment**

### 2. Translation Phase
1. **Create a feature branch**: `git checkout -b translations/[language-code]`
2. **Start with high-priority files**: `common.json`, `alarms.json`
3. **Validate frequently**: Run validation script after each file
4. **Test in context**: Use development server to see changes

### 3. Review Phase
1. **Self-review**: Check your work against quality standards
2. **Native speaker review**: Have another native speaker review
3. **Context testing**: Test all translations in the actual app
4. **Documentation**: Update this guide if needed

### 4. Submission Phase
1. **Create pull request**: Include detailed description of changes
2. **Fill out PR template**: Provide context and testing information
3. **Respond to feedback**: Work with maintainers to refine translations
4. **Celebration**: Your contribution helps users worldwide!

### Pull Request Template

When submitting translations, include:

```markdown
## Translation Contribution

**Language**: [Language Name] (`language-code`)
**Completion Level**: [X]% complete
**Files Modified**: 
- [ ] common.json (90 keys)
- [ ] alarms.json (84 keys)
- [ ] auth.json (64 keys)
- [ ] gaming.json (102 keys)
- [ ] settings.json (126 keys)
- [ ] errors.json (69 keys)

### Quality Assurance
- [ ] All interpolation variables preserved
- [ ] Consistent terminology used
- [ ] Culturally appropriate adaptations made
- [ ] Validation script passes
- [ ] Manual testing completed

### Cultural Adaptations Made
[Describe any cultural adaptations or decisions made]

### Testing Notes
[Describe how you tested the translations]

### Additional Notes
[Any other relevant information]
```

## 🔄 Maintenance and Updates

### Ongoing Responsibilities

#### Translation Updates
- **Monitor source changes**: Stay updated when English content changes
- **Quality improvements**: Continuously refine existing translations
- **User feedback**: Incorporate feedback from native speakers
- **Cultural updates**: Adapt to changing cultural norms and terminology

#### Community Building
- **Help new contributors**: Mentor new translators in your language
- **Share knowledge**: Document language-specific guidelines
- **Coordinate efforts**: Work with other contributors in your language
- **Provide feedback**: Suggest improvements to the translation system

### Version Management

#### Release Cycles
- **Feature releases**: Major updates may require translation updates
- **Hotfixes**: Critical bug fixes might need immediate translation
- **Seasonal updates**: Holiday or seasonal content may need localization

#### Change Management
- **Diff tracking**: Use git to track changes in English files
- **Impact assessment**: Evaluate how source changes affect translations
- **Priority management**: Focus on user-facing changes first

## 🎯 Best Practices Summary

### Do's ✅
- **Translate meaning, not words**: Focus on conveying the right message
- **Be consistent**: Use the same terms for the same concepts
- **Test frequently**: Validate early and often
- **Ask questions**: When in doubt, ask maintainers or community
- **Consider context**: Think about how and where text will be displayed
- **Respect culture**: Adapt content appropriately for your target audience
- **Maintain tone**: Keep the encouraging, positive spirit of the app

### Don'ts ❌
- **Don't change interpolation variables**: Keep `{{variables}}` exactly as they are
- **Don't ignore context**: Consider where text appears in the UI
- **Don't be too literal**: Focus on meaning over word-for-word translation
- **Don't forget pluralization**: Different languages have different plural rules
- **Don't skip validation**: Always run the validation script
- **Don't ignore cultural differences**: One size doesn't fit all cultures
- **Don't work in isolation**: Collaborate with other contributors

## 📞 Getting Help

### Resources
- **Translation Management Script**: Use `node scripts/manage-translations.mjs` for validation
- **Development Documentation**: Check project README for setup instructions
- **Existing Translations**: Review completed translations for reference
- **Community Discussion**: Join project discussions for questions

### Contact
- **Project Issues**: Open GitHub issues for translation-related problems
- **Direct Communication**: Contact maintainers for urgent translation needs
- **Community Forums**: Participate in community discussions about localization

### Useful Links
- [React i18next Documentation](https://react.i18next.com/)
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/)
- [Unicode CLDR](http://cldr.unicode.org/) for locale data
- [W3C Internationalization](https://www.w3.org/International/) guidelines

---

## 🙏 Thank You

Your contribution to making Relife accessible to users worldwide is invaluable. Every translation helps someone build better morning routines and achieve their goals, regardless of their native language.

Together, we're making productivity and personal growth truly global! 🌍✨

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Maintained by**: Relife Translation Team