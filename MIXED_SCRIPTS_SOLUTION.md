# Mixed Scripts Solution Guide

This document explains the solution for handling mixed script warnings in the Relife المنبه application.

## Problem

The application generates warnings about "mixed scripts" - text that combines different writing systems. In our case, this occurs with the brand name "Relife المنبه" which intentionally combines:

- **English**: "Relife" (brand name)
- **Arabic**: "المنبه" (meaning "the alarm")

These mixed scripts are **intentional** for proper brand representation in Arabic-speaking markets.

## Location of Mixed Scripts

### Current Instances

1. **`public/locales/ar/common.json`**
   - Line 3: `"name": "Relife المنبه"`

2. **`public/locales/ar/auth.json`**
   - Line 4: `"subtitle": "مرحباً بك في Relife المنبه"`

## Solution Implementation

### 1. Configuration Files Created

#### `.mixedscriptignore`

```
# Mixed Script Ignore File
# Specifies intentional mixed script usage that should not generate warnings

public/locales/ar/auth.json:4:Relife المنبه
public/locales/ar/common.json:3:Relife المنبه
```

#### `.textlintrc`

```json
{
  "rules": {
    "no-mixed-scripts": false,
    "textlint-rule-no-mixed-zenkaku-and-hankaku-alphabet": false
  },
  "filters": {
    "whitelist": {
      "allow": ["Relife المنبه", "Relife", "المنبه"]
    }
  }
}
```

#### `.vscode/settings.json`

Contains VS Code-specific settings to suppress mixed script warnings in the editor.

### 2. ESLint Configuration Updated

Added rules to `eslint.config.js`:

```javascript
// Suppress mixed script warnings for intentional brand name usage
'no-mixed-scripts': 'off',
'unicode/no-mixed': 'off',
'textlint/no-mixed-scripts': 'off',
```

### 3. Translation File Documentation

Added comments to translation files explaining the intentional mixed script usage:

```json
{
  "_comment": "Mixed script usage is intentional for brand name 'Relife المنبه' - combines English brand name with Arabic translation"
  // ... rest of translations
}
```

### 4. Validation Script

Created `scripts/validate-mixed-scripts.js` to:

- Detect mixed script usage
- Validate against allowed patterns
- Generate reports
- Update ignore files automatically

## How to Use

### Run Validation

```bash
# Validate mixed scripts
npm run mixed-scripts:validate

# Or run directly
node scripts/validate-mixed-scripts.js validate
```

### Update Ignore Files

```bash
node scripts/validate-mixed-scripts.js update-ignore
```

### Add to Package.json (Recommended)

```json
{
  "scripts": {
    "mixed-scripts:validate": "node scripts/validate-mixed-scripts.js validate",
    "mixed-scripts:update": "node scripts/validate-mixed-scripts.js update-ignore",
    "mixed-scripts:report": "node scripts/validate-mixed-scripts.js report"
  }
}
```

## Common Warning Sources

Mixed script warnings can come from:

1. **TextLint** - Text linting tool
2. **ESLint plugins** - Unicode/text validation plugins
3. **VS Code extensions** - Text validation extensions
4. **Browser DevTools** - Console warnings
5. **Build tools** - Webpack, Vite, or other bundlers
6. **IDE warnings** - WebStorm, VS Code, etc.

## Adding New Mixed Scripts

If you need to add more intentional mixed scripts:

1. **Add to validation script**:

   ```javascript
   const ALLOWED_MIXED_SCRIPTS = [
     "Relife المنبه",
     "YourNewBrand العربية", // Add new patterns here
   ];
   ```

2. **Update `.textlintrc`**:

   ```json
   {
     "filters": {
       "whitelist": {
         "allow": ["Relife المنبه", "YourNewBrand العربية"]
       }
     }
   }
   ```

3. **Add documentation comments** to the relevant translation files.

4. **Run validation** to update ignore files:
   ```bash
   node scripts/validate-mixed-scripts.js update-ignore
   ```

## Best Practices

### For Brand Names

- Always combine English brand names with native translations
- Document the intention with comments
- Add to allowed patterns immediately

### For UI Text

- Avoid mixing scripts in regular UI text
- Use proper i18n for language-specific content
- Consider separate brand name components

### For Technical Terms

- Use native language equivalents when available
- Document any necessary technical term mixing
- Consider glossaries for consistency

## Troubleshooting

### Warnings Still Appearing?

1. **Check your IDE/editor** - Disable text validation extensions
2. **Browser console** - Look for specific warning sources
3. **Build process** - Check Vite/Webpack configuration
4. **CI/CD** - Update pipeline configurations

### Adding More Languages

When adding new languages with mixed scripts:

1. Follow the same pattern as Arabic
2. Update validation script with new patterns
3. Add comments explaining the mixed script usage
4. Test the validation script

## Technical Details

### Script Detection Patterns

The validation script uses these regex patterns:

```javascript
// Latin + Arabic
/[a-zA-Z]+.*[\u0600-\u06FF]/g

// Arabic + Latin
/[\u0600-\u06FF].*[a-zA-Z]+/g
```

### Unicode Ranges

- **Arabic**: `\u0600-\u06FF`
- **Latin**: `a-zA-Z`
- **Extended Latin**: `\u0100-\u017F`

## Summary

The solution provides multiple layers of suppression for mixed script warnings:

1. ✅ **Configuration files** for various tools
2. ✅ **ESLint rules** for code validation
3. ✅ **Documentation** explaining intentional usage
4. ✅ **Validation script** for management
5. ✅ **Editor settings** for development experience

All mixed script usage in "Relife المنبه" is now properly documented and whitelisted as intentional brand representation.
