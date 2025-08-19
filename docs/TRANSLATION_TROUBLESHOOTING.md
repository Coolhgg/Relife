# 🔧 Translation Troubleshooting Guide

Common issues and solutions when working with Relife translations.

## 🚨 Common Validation Errors

### Error: "Missing interpolation variables"

**Problem**: Translation doesn't include required variables like `{{userName}}` or `{{count}}`

```json
// ❌ Wrong
"greeting": "Hello user!"

// ✅ Correct
"greeting": "Hello {{userName}}!"
```

**Solution**: Always preserve interpolation variables exactly as they appear in English.

### Error: "Extra interpolation variables"

**Problem**: Translation includes variables that don't exist in the English version

```json
// ❌ Wrong ({{time}} not in English)
"message": "Good morning {{userName}}, it's {{time}}!"

// ✅ Correct
"message": "Good morning {{userName}}!"
```

**Solution**: Only use variables that exist in the reference English text.

### Error: "Empty translation value"

**Problem**: Translation key exists but has no value

```json
// ❌ Wrong
"button": {
  "save": "",
  "cancel": "Cancel"
}

// ✅ Correct
"button": {
  "save": "Save",
  "cancel": "Cancel"
}
```

**Solution**: Provide translations for all keys, or remove unused keys.

### Error: "Missing translation for key"

**Problem**: English has a key that doesn't exist in your translation file

**Solution**: Run the generation script to add missing keys:

```bash
node scripts/manage-translations.mjs generate
```

## 📁 File Issues

### JSON Syntax Errors

**Common mistakes**:

```json
// ❌ Missing comma
{
  "key1": "value1"
  "key2": "value2"
}

// ❌ Trailing comma
{
  "key1": "value1",
  "key2": "value2",
}

// ❌ Unescaped quotes
{
  "message": "She said "Hello""
}

// ✅ Correct
{
  "key1": "value1",
  "key2": "value2",
  "message": "She said "Hello""
}
```

**Solution**: Use a JSON validator or editor with syntax highlighting.

### File Encoding Issues

**Problem**: Special characters display as question marks or boxes

**Solution**:

1. Save files as UTF-8 encoding
2. Test special characters on target devices
3. Use Unicode escape sequences if needed: `\u00E9` for é

## 🌐 Language-Specific Issues

### Right-to-Left Languages (Arabic, Hebrew)

**Text direction**: Handled automatically by CSS
**Numbers and dates**: Remain left-to-right
**Punctuation**: May need adjustment for readability

```json
// Arabic example
{
  "greeting": "مرحباً {{userName}}!",
  "count": "لديك {{count}} منبه"
}
```

### Asian Languages (Chinese, Japanese, Korean)

**Character encoding**: Ensure UTF-8 support
**Text length**: Often shorter than English, check UI layout
**Formality levels**: Choose appropriate level of politeness

```json
// Japanese formal example
{
  "greeting": "おはようございます、{{userName}}さん",
  "notification": "{{count}}件の通知があります"
}
```

### Pluralization Issues

**Problem**: Different languages have different plural rules

```json
// English (2 forms)
"alarms": "{{count}} alarm_one||{{count}} alarms_other"

// Polish (5 forms) - more complex
"alarms": "{{count}} budzik_one||{{count}} budziki_few||{{count}} budzików_many||{{count}} budzika_other"
```

**Solution**: Research plural rules for your language and use appropriate forms.

## 🔧 Tool Issues

### Management Script Errors

**Error**: `Error: ENOENT: no such file or directory`

**Cause**: Running script from wrong directory or missing translation files

**Solution**:

```bash
# Make sure you're in the project root
cd /path/to/relife

# Create missing directories
node scripts/manage-translations.mjs setup
```

**Error**: `SyntaxError: Unexpected token in JSON`

**Cause**: Invalid JSON syntax in translation file

**Solution**:

1. Find the problematic file in the error message
2. Validate JSON syntax using online tools or editor
3. Fix syntax errors and run validation again

### Development Environment Issues

**Problem**: Translations don't appear in the app

**Possible causes**:

1. Browser cache (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)
2. Translation file not saved properly
3. Wrong language code in filename or directory
4. Development server needs restart

**Solutions**:

```bash
# Clear cache and restart dev server
npm run dev
# or
bun run dev
```

## 📱 Testing Issues

### Text Overflow in UI

**Problem**: Translations are longer than English and break layouts

**Solutions**:

1. Use shorter synonyms where possible
2. Test on different screen sizes
3. Report layout issues if text is reasonably short

### Fonts Not Supporting Characters

**Problem**: Special characters display as squares or fallback fonts

**Solutions**:

1. Test on target devices/browsers
2. Consider using Unicode normalization
3. Report font support issues for critical characters

## 🎯 Quality Assurance Problems

### Inconsistent Terminology

**Problem**: Using different words for the same concept

**Example**:

```json
// ❌ Inconsistent
"alarm": "Alarm",
"notification": "Alert",  // Should be consistent

// ✅ Consistent
"alarm": "Alarm",
"notification": "Notification"
```

**Solution**: Create and maintain a terminology glossary for your language.

### Cultural Inappropriateness

**Problem**: Direct translations that don't fit cultural context

**Solutions**:

1. Adapt examples to local context
2. Consider cultural attitudes toward productivity/competition
3. Adjust formality levels appropriately
4. Research local app conventions

## 🔄 Workflow Issues

### Git/GitHub Problems

**Error**: Merge conflicts in translation files

**Solution**:

```bash
# Update your branch with latest changes
git fetch origin
git rebase origin/main

# Resolve conflicts manually, then:
git add .
git rebase --continue
```

**Problem**: Forgot to create feature branch

**Solution**:

```bash
# Create and switch to new branch
git checkout -b translations/your-language
git push -u origin translations/your-language
```

## 📊 Validation Script Debugging

### Verbose Output

Run with detailed logging to see exactly what's happening:

```bash
# Enable debug mode (if available)
DEBUG=1 node scripts/manage-translations.mjs validate
```

### Manual File Check

```bash
# Check specific language
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/public/locales/es/common.json', 'utf8'));
console.log('Keys:', Object.keys(data).length);
"
```

## 🆘 Getting Help

### Before Asking for Help

1. **Run validation script**: `node scripts/manage-translations.mjs validate`
2. **Check this troubleshooting guide**: Look for your specific error
3. **Verify JSON syntax**: Use online JSON validators
4. **Clear cache**: Hard refresh browser, restart dev server

### When Asking for Help

Include this information:

- **Error message**: Full text of any error messages
- **Language code**: Which language you're working on
- **Files affected**: Which translation files have issues
- **Steps to reproduce**: What you did before the error occurred
- **Environment**: Operating system, Node.js version, etc.

### Where to Get Help

1. **GitHub Issues**: Open an issue with translation tag
2. **Project Documentation**: Check README and other docs
3. **Community**: Join project discussions
4. **Stack Overflow**: For general i18n questions

## 📚 Useful Resources

### Validation Tools

- [JSONLint](https://jsonlint.com/) - JSON syntax validator
- [Unicode Character Inspector](https://apps.timwhitlock.info/unicode/inspect) - Check character codes
- [Language Plural Rules](https://www.unicode.org/cldr/cldr-aux/charts/30/supplemental/language_plural_rules.html) - CLDR plural rules

### Reference Materials

- [React i18next](https://react.i18next.com/) - Framework documentation
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/) - Interpolation syntax
- [W3C Internationalization](https://www.w3.org/International/) - Best practices

---

## 🎯 Quick Debugging Checklist

When something isn't working:

- [ ] JSON syntax is valid
- [ ] File encoding is UTF-8
- [ ] All required variables are preserved
- [ ] Language code matches directory name
- [ ] Translation keys match English structure
- [ ] No empty translation values
- [ ] Validation script passes
- [ ] Browser cache cleared
- [ ] Development server restarted

Remember: Most translation issues are simple syntax errors or missing variables. The validation script will catch most problems! 🚀
