# Form Accessibility Pattern Guide

## Overview

This guide documents the comprehensive form accessibility patterns implemented in the Relife Alarm App to ensure proper form field associations and WCAG 2.1 compliance. These patterns address the "missing form field associations" issues and provide a reference for future development.

## 🚨 ESLint Configuration

The project includes `eslint-plugin-jsx-a11y` to automatically catch form field association issues:

```javascript
// eslint.config.js
'jsx-a11y/label-has-associated-control': [
  'error',
  {
    labelComponents: ['Label', 'label'],
    labelAttributes: ['htmlFor'],
    controlComponents: ['Input', 'Select', 'Textarea', 'input', 'select', 'textarea', 'button'],
    depth: 3,
  },
]
```

## ✅ Form Field Association Patterns

### 1. Basic Label-Input Association

**Pattern**: Use `htmlFor` on labels and `id` on form controls to create programmatic associations.

```tsx
// ✅ CORRECT - Basic input with label association
<label htmlFor="user-name-input" className="block text-sm font-medium">
  Full Name
</label>
<input
  id="user-name-input"
  type="text"
  value={formData.name}
  onChange={(e) => handleInputChange('name', e.target.value)}
  className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1"
  placeholder="Enter your name"
  aria-describedby="user-name-help"
  required
/>
<div id="user-name-help" className="text-xs text-gray-500">
  This name will be displayed in your profile
</div>
```

**Key Points**:
- `htmlFor` attribute on label matches `id` attribute on input
- Help text connected via `aria-describedby`
- Validation attributes (`required`) included
- Descriptive `id` names that are unique

### 2. Select Dropdown Association

**Pattern**: Associate labels with select dropdowns using proper `htmlFor`/`id` relationships.

```tsx
// ✅ CORRECT - Select with label association
<label htmlFor="default-voice-mood" className="block text-sm font-medium mb-3">
  <Mic className="w-4 h-4 inline mr-2" aria-hidden="true" />
  Default Voice Mood
</label>
<select
  id="default-voice-mood"
  value={editForm.preferences.defaultVoiceMood}
  onChange={(e) => handleInputChange('defaultVoiceMood', e.target.value)}
  className="w-full p-3 border border-gray-300 rounded-lg"
  aria-describedby="voice-mood-help"
  required
>
  {voiceMoodOptions.map((mood) => (
    <option key={mood.value} value={mood.value}>
      {mood.label} - {mood.description}
    </option>
  ))}
</select>
<div id="voice-mood-help" className="text-xs text-gray-500">
  This voice mood will be used for new alarms by default
</div>
```

**For ShadCN/UI Select Components**:
```tsx
// ✅ CORRECT - ShadCN Select with proper associations
<label htmlFor="difficulty-select" className="text-sm font-medium mb-2 block">
  Test Difficulty Level
</label>
<Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
  <SelectTrigger id="difficulty-select">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="easy">Easy</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="hard">Hard</SelectItem>
  </SelectContent>
</Select>
```

### 3. Checkbox and Toggle Switch Association

**Pattern**: Use proper label-control relationships for checkboxes and toggle switches.

```tsx
// ✅ CORRECT - Checkbox with label association
<div className="flex items-center justify-between p-3 border rounded-lg">
  <div>
    <label htmlFor="notifications-enabled" className="text-sm font-medium cursor-pointer">
      Enable Notifications
    </label>
    <p id="notifications-help" className="text-xs text-gray-600">
      Receive alarm notifications on this device
    </p>
  </div>
  <input
    id="notifications-enabled"
    type="checkbox"
    checked={formData.notificationsEnabled}
    onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2"
    aria-describedby="notifications-help"
  />
</div>
```

**For Toggle Switches**:
```tsx
// ✅ CORRECT - Toggle switch with proper associations
<div className="flex items-center justify-between">
  <div>
    <label htmlFor="push-notifications-switch" className="font-medium cursor-pointer">
      Push Notifications
    </label>
    <div id="push-notif-help" className="text-sm text-gray-600">
      Receive alarm notifications on your device
    </div>
  </div>
  <button 
    id="push-notifications-switch"
    onClick={handlePushNotificationsToggle}
    className={`alarm-toggle ${pushNotifications ? 'alarm-toggle-checked' : 'alarm-toggle-unchecked'}`}
    role="switch"
    aria-checked={pushNotifications}
    aria-labelledby="push-notif-label"
    aria-describedby="push-notif-help"
  >
    <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow" />
    <span id="push-notif-label" className="sr-only">
      Push notifications {pushNotifications ? 'enabled' : 'disabled'}
    </span>
  </button>
</div>
```

### 4. Fieldset and Legend for Grouped Controls

**Pattern**: Use `fieldset` and `legend` for logically grouped form controls like radio groups or checkbox groups.

#### Radio Group Pattern:
```tsx
// ✅ CORRECT - Radio group with fieldset/legend
<fieldset>
  <legend className="block text-sm font-medium text-gray-700 mb-3">
    <Palette className="w-4 h-4 inline mr-2" aria-hidden="true" />
    Theme Preference
  </legend>
  <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="theme-legend" aria-describedby="theme-help">
    {['light', 'dark', 'auto'].map((theme) => (
      <button
        key={theme}
        onClick={() => handleInputChange('theme', theme)}
        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
          selectedTheme === theme
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 text-gray-700'
        }`}
        role="radio"
        aria-checked={selectedTheme === theme}
        aria-label={`Set theme to ${theme} mode`}
        aria-describedby={`theme-${theme}-desc`}
      >
        {theme}
        <span id={`theme-${theme}-desc`} className="sr-only">
          {theme === 'light' ? 'Use light theme always' : 
           theme === 'dark' ? 'Use dark theme always' : 
           'Automatically switch between light and dark based on system settings'}
        </span>
      </button>
    ))}
  </div>
  <div id="theme-help" className="text-xs text-gray-500 mt-2">
    Choose your preferred color scheme for the app interface
  </div>
</fieldset>
```

#### Day Selection Pattern:
```tsx
// ✅ CORRECT - Day selection with fieldset/legend
<fieldset>
  <legend className="text-sm font-medium text-gray-700 mb-2">Repeat Days</legend>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Select repeat days for alarm">
    {DAYS.map((day) => (
      <button
        key={day.value}
        type="button"
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          formData.days.includes(day.value)
            ? 'bg-primary-500 text-white border-primary-500'
            : 'bg-gray-100 text-gray-700 border-gray-300'
        }`}
        onClick={() => toggleDay(day.value)}
        role="checkbox"
        aria-checked={formData.days.includes(day.value)}
        aria-label={`Toggle ${day.full}`}
      >
        {day.short}
      </button>
    ))}
  </div>
</fieldset>
```

#### Checkbox Group Pattern:
```tsx
// ✅ CORRECT - Friend selection with fieldset/legend
<fieldset>
  <legend className="text-sm font-medium text-gray-700 mb-2">Invite Friends</legend>
  <div className="space-y-2 max-h-32 overflow-y-auto" role="group" aria-label="Select friends to invite">
    {friends.map((friend) => (
      <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg">
        <input
          id={`friend-${friend.id}`}
          type="checkbox"
          checked={selectedFriends.includes(friend.id)}
          onChange={() => toggleFriendSelection(friend.id)}
          className="rounded"
          aria-label={`Select ${friend.displayName} for battle invitation`}
        />
        <label htmlFor={`friend-${friend.id}`} className="flex items-center gap-3 cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{friend.displayName}</div>
            <div className="text-xs text-muted-foreground">Level {friend.level}</div>
          </div>
        </label>
      </div>
    ))}
  </div>
</fieldset>
```

### 5. Number Input with Validation

**Pattern**: Number inputs with proper validation and help text associations.

```tsx
// ✅ CORRECT - Number input with validation
<div>
  <label htmlFor="snooze-duration" className="block text-sm font-medium text-gray-700 mb-2">
    Snooze Duration (minutes)
  </label>
  <input
    id="snooze-duration"
    type="number"
    min="1"
    max="30"
    value={formData.snoozeMinutes}
    onChange={(e) => handleInputChange('snoozeMinutes', parseInt(e.target.value))}
    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
    aria-describedby="snooze-duration-help"
    required
  />
  <div id="snooze-duration-help" className="text-xs text-gray-500 mt-1">
    How long to wait between snooze activations (1-30 minutes)
  </div>
</div>
```

## ❌ Common Anti-Patterns to Avoid

### 1. Label Components Used for Non-Form Content

```tsx
// ❌ WRONG - Using Label component for headings
<Label>Suggested Friends</Label>

// ✅ CORRECT - Use proper heading elements
<h3 className="text-sm font-medium">Suggested Friends</h3>
```

### 2. Missing Label-Control Associations

```tsx
// ❌ WRONG - No htmlFor/id association
<label className="block text-sm font-medium">
  Full Name
</label>
<input
  type="text"
  value={name}
  onChange={handleChange}
  className="border rounded px-3 py-1"
/>

// ✅ CORRECT - Proper association
<label htmlFor="name-input" className="block text-sm font-medium">
  Full Name
</label>
<input
  id="name-input"
  type="text"
  value={name}
  onChange={handleChange}
  className="border rounded px-3 py-1"
/>
```

### 3. Missing ARIA Relationships

```tsx
// ❌ WRONG - Help text not connected to input
<label htmlFor="email">Email</label>
<input id="email" type="email" />
<div>Please enter a valid email address</div>

// ✅ CORRECT - Help text connected via aria-describedby
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-help" />
<div id="email-help">Please enter a valid email address</div>
```

### 4. Improper Use of Standalone Labels for Groups

```tsx
// ❌ WRONG - Label used for group title without proper structure
<Label>Battle Type</Label>
<div className="grid grid-cols-1 gap-2">
  {battleTypes.map(type => (
    <Card key={type.id} onClick={() => select(type)}>
      {type.name}
    </Card>
  ))}
</div>

// ✅ CORRECT - Fieldset/legend for grouped controls
<fieldset>
  <legend className="text-sm font-medium">Battle Type</legend>
  <div className="grid grid-cols-1 gap-2" role="radiogroup">
    {battleTypes.map(type => (
      <button
        key={type.id}
        onClick={() => select(type)}
        role="radio"
        aria-checked={selectedType === type.id}
      >
        {type.name}
      </button>
    ))}
  </div>
</fieldset>
```

## 🎯 ARIA Attributes Reference

### Essential ARIA Attributes for Forms

| Attribute | Use Case | Example |
|-----------|----------|---------|
| `aria-describedby` | Connect form control to help text or error messages | `<input aria-describedby="help-text">` |
| `aria-labelledby` | Reference multiple labels or complex labeling | `<input aria-labelledby="label1 label2">` |
| `aria-label` | Provide accessible name when visual label isn't sufficient | `<button aria-label="Delete alarm">🗑️</button>` |
| `aria-checked` | State for custom checkboxes/radios | `<div role="checkbox" aria-checked="true">` |
| `aria-expanded` | State for collapsible elements | `<button aria-expanded="false">More options</button>` |
| `aria-required` | Indicate required fields (prefer HTML `required`) | `<input aria-required="true">` |
| `aria-invalid` | Indicate validation state | `<input aria-invalid="true" aria-describedby="error">` |

### Role Attributes for Custom Controls

| Role | Use Case | Additional Attributes |
|------|----------|----------------------|
| `radio` | Custom radio buttons | `aria-checked`, `aria-labelledby` |
| `checkbox` | Custom checkboxes | `aria-checked`, `aria-label` |
| `switch` | Toggle switches | `aria-checked`, `aria-labelledby` |
| `radiogroup` | Group of radio buttons | `aria-labelledby`, `aria-describedby` |
| `group` | Group of related controls | `aria-labelledby` |

## 📱 Mobile Accessibility Considerations

### Touch Target Size
- Ensure all interactive elements are at least 44px in size
- Add adequate spacing between touch targets
- Use `cursor-pointer` class on clickable labels

```css
/* Touch target enhancement */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Haptic Feedback
- Use haptic feedback for form interactions on mobile devices
- Provide audio or visual feedback when haptic is unavailable

## 🧪 Testing Strategies

### Automated Testing
1. **ESLint Rules**: Catch missing associations during development
2. **Axe-core**: Automated accessibility testing in CI/CD
3. **Jest Tests**: Unit tests for form accessibility patterns

### Manual Testing
1. **Screen Reader Testing**: Test with NVDA, JAWS, VoiceOver, TalkBack
2. **Keyboard Navigation**: Tab through all form elements
3. **Voice Control**: Test with Dragon, Voice Control, Voice Access
4. **High Contrast Mode**: Verify form visibility in high contrast themes

### Testing Checklist

- [ ] All form controls have accessible names (labels or aria-label)
- [ ] Labels are programmatically associated with controls
- [ ] Grouped controls use fieldset/legend appropriately
- [ ] Help text is connected via aria-describedby
- [ ] Error messages are announced and connected to fields
- [ ] Form validation provides clear, specific feedback
- [ ] Custom controls have appropriate roles and states
- [ ] Keyboard navigation follows logical tab order
- [ ] Focus indicators are clearly visible

## 🚀 Implementation Steps for New Forms

1. **Plan Structure**: Identify form groups and relationships
2. **Add ESLint Rules**: Ensure linting catches issues early
3. **Implement Labels**: Use proper htmlFor/id associations
4. **Add Help Text**: Connect via aria-describedby
5. **Group Related Fields**: Use fieldset/legend for groups
6. **Add ARIA States**: Include aria-checked, aria-invalid as needed
7. **Test with Tools**: Run ESLint and axe-core tests
8. **Manual Testing**: Test with keyboard and screen readers

## 📋 Quick Reference

### Must-Have Patterns
1. `htmlFor`/`id` association for all form controls
2. `aria-describedby` for help text and error messages
3. `fieldset`/`legend` for grouped controls
4. Proper `role` attributes for custom controls
5. `aria-checked` for custom checkboxes/radios

### ESLint Rules to Enable
```javascript
'jsx-a11y/label-has-associated-control': 'error',
'jsx-a11y/role-has-required-aria-props': 'error',
'jsx-a11y/role-supports-aria-props': 'error',
'jsx-a11y/aria-props': 'error',
'jsx-a11y/aria-role': 'error'
```

This comprehensive guide ensures that all form field associations in the Relife Alarm App follow accessibility best practices and WCAG 2.1 compliance standards. Regular reference to these patterns will help maintain accessible forms throughout future development.