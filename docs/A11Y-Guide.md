# Accessibility Guide 🔍

**Relife Alarm App - WCAG 2.1 AA Compliance Guide**

This comprehensive guide helps developers build and maintain accessible features in the Relife alarm
application. Our goal is to ensure every user, regardless of ability, can effectively use our app to
manage their alarms and wake-up routines.

## Table of Contents

- [Quick Start](#quick-start)
- [Accessibility Principles](#accessibility-principles)
- [Component Guidelines](#component-guidelines)
- [Testing Strategy](#testing-strategy)
- [Common Patterns](#common-patterns)
- [Quick Fixes](#quick-fixes)
- [Resources](#resources)

## Quick Start

### 🚀 Running Accessibility Tests

```bash
# Run all accessibility tests
npm run test:a11y:all

# Run specific test suites
npm run test:a11y:unit        # Jest-axe component tests
npm run test:a11y:e2e         # Playwright E2E a11y tests
npm run test:a11y:lighthouse  # Lighthouse audits
npm run test:a11y:pa11y       # pa11y WCAG audits

# Generate accessibility report
npm run a11y:report
```

### 📊 Viewing Reports

- **HTML Report**: `artifacts/a11y-reports/accessibility-report.html`
- **Storybook**: Run `npm run storybook` and use the Accessibility panel
- **Live Testing**: Test with real screen readers and keyboard navigation

## Accessibility Principles

### 1. Perceivable 👁️

**Users must be able to perceive the information being presented**

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Text Alternatives**: All images, icons, and media need alt text
- **Resizable Text**: Content must be readable when zoomed to 200%
- **Color Independence**: Don't rely solely on color to convey information

```tsx
// ✅ Good: High contrast and alt text
<img src="alarm-icon.svg" alt="Alarm settings" className="text-slate-900 dark:text-white" />

// ❌ Bad: Low contrast and missing alt text
<img src="alarm-icon.svg" className="text-gray-400" />
```

### 2. Operable ⌨️

**Interface components must be operable**

- **Keyboard Navigation**: All functionality available via keyboard
- **Focus Management**: Clear focus indicators and logical order
- **Timing Controls**: Users can extend or disable time limits
- **Touch Targets**: Minimum 44x44px for touch interfaces

```tsx
// ✅ Good: Keyboard accessible with proper focus
<button
  onClick={handleAlarmToggle}
  onKeyDown={(e) => e.key === 'Enter' && handleAlarmToggle()}
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px] min-w-[44px]"
  aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm for ${alarm.time}`}
>
  {alarm.enabled ? <AlarmOnIcon /> : <AlarmOffIcon />}
</button>
```

### 3. Understandable 🧠

**Information and UI operation must be understandable**

- **Readable Text**: Use clear, simple language
- **Predictable Navigation**: Consistent layout and interaction patterns
- **Input Assistance**: Clear labels, instructions, and error messages
- **Error Prevention**: Help users avoid and correct mistakes

```tsx
// ✅ Good: Clear labels and error handling
<form onSubmit={handleSubmit}>
  <div className="space-y-2">
    <label htmlFor="alarm-time" className="block text-sm font-medium">
      Alarm Time *
    </label>
    <input
      id="alarm-time"
      type="time"
      value={time}
      onChange={(e) => setTime(e.target.value)}
      aria-describedby={error ? 'time-error' : undefined}
      aria-invalid={!!error}
      required
    />
    {error && (
      <div id="time-error" role="alert" className="text-red-600 text-sm">
        {error}
      </div>
    )}
  </div>
</form>
```

### 4. Robust 🔧

**Content must be robust enough for various assistive technologies**

- **Valid HTML**: Use semantic markup and proper structure
- **ARIA Support**: Implement ARIA when semantic HTML isn't sufficient
- **Compatible**: Works with screen readers, voice control, etc.
- **Future-Proof**: Follows web standards and best practices

## Component Guidelines

### Buttons

```tsx
// Primary action buttons
<Button
  variant="primary"
  size="lg"
  aria-label="Create new alarm"
  disabled={isCreating}
>
  {isCreating ? 'Creating...' : 'Create Alarm'}
</Button>

// Icon buttons require accessible names
<Button
  variant="ghost"
  size="icon"
  aria-label="Delete alarm"
  onClick={() => handleDelete(alarm.id)}
>
  <TrashIcon />
</Button>

// Toggle buttons show state
<Button
  variant="outline"
  pressed={alarm.enabled}
  aria-pressed={alarm.enabled}
  aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm`}
>
  {alarm.enabled ? 'Enabled' : 'Disabled'}
</Button>
```

### Forms

```tsx
// Form fields with proper labeling
<div className="form-field">
  <label htmlFor="alarm-name" className="required">
    Alarm Name
  </label>
  <input
    id="alarm-name"
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    aria-describedby="name-help name-error"
    aria-invalid={!!nameError}
    required
  />
  <div id="name-help" className="help-text">
    Give your alarm a memorable name
  </div>
  {nameError && (
    <div id="name-error" role="alert" className="error-text">
      {nameError}
    </div>
  )}
</div>

// Fieldsets for grouped inputs
<fieldset>
  <legend>Repeat Days</legend>
  {DAYS.map(day => (
    <label key={day} className="checkbox-label">
      <input
        type="checkbox"
        checked={selectedDays.includes(day)}
        onChange={() => toggleDay(day)}
      />
      {day}
    </label>
  ))}
</fieldset>
```

### Modals and Dialogs

```tsx
// Modal with proper focus management
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent aria-labelledby="dialog-title" aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle id="dialog-title">Delete Alarm</DialogTitle>
      <DialogDescription id="dialog-description">
        Are you sure you want to delete this alarm? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Lists and Navigation

```tsx
// Semantic navigation structure
<nav aria-label="Main navigation">
  <ul role="list">
    <li>
      <Link
        href="/alarms"
        aria-current={pathname === '/alarms' ? 'page' : undefined}
      >
        My Alarms
      </Link>
    </li>
    <li>
      <Link href="/settings">Settings</Link>
    </li>
  </ul>
</nav>

// Alarm list with proper structure
<div role="region" aria-labelledby="alarms-heading">
  <h2 id="alarms-heading">Your Alarms</h2>
  <ul role="list" className="space-y-4">
    {alarms.map(alarm => (
      <li key={alarm.id} className="alarm-item">
        <div className="alarm-time">{alarm.time}</div>
        <div className="alarm-name">{alarm.name}</div>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.name} alarm`}
          onClick={() => toggleAlarm(alarm.id)}
        >
          <ToggleIcon />
        </Button>
      </li>
    ))}
  </ul>
</div>
```

### Loading and Status States

```tsx
// Loading indicators with screen reader announcements
<div role="status" aria-live="polite">
  {isLoading && (
    <div className="flex items-center gap-2">
      <LoadingSpinner aria-hidden="true" />
      <span>Loading your alarms...</span>
    </div>
  )}
</div>;

// Error states with clear messaging
{
  error && (
    <div role="alert" className="error-banner">
      <AlertIcon aria-hidden="true" />
      <div>
        <strong>Error:</strong> Unable to load alarms.
        <Button variant="link" onClick={retry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

// Success announcements
{
  saveSuccess && (
    <div role="status" aria-live="polite" className="sr-only">
      Alarm saved successfully
    </div>
  );
}
```

## Testing Strategy

### 1. Automated Testing (80% Coverage)

**Unit Tests (jest-axe)**

- Test individual components for WCAG violations
- Verify ARIA attributes and roles
- Check color contrast and semantic markup

**Integration Tests (Playwright + axe)**

- Test complete user flows
- Verify focus management across pages
- Test keyboard navigation paths

**Audit Tools (Lighthouse + pa11y)**

- Production accessibility scores
- WCAG 2.1 AA compliance checking
- Performance impact assessment

### 2. Manual Testing (20% Coverage)

**Screen Reader Testing**

```bash
# Test with common screen readers:
# - macOS: VoiceOver (Cmd+F5)
# - Windows: NVDA (free), JAWS
# - Mobile: TalkBack (Android), VoiceOver (iOS)
```

**Keyboard Navigation Testing**

- Tab order follows logical flow
- All interactive elements are reachable
- Focus indicators are clearly visible
- Escape key closes modals/dropdowns

**Visual Testing**

- Test at 200% zoom level
- Verify color contrast in different themes
- Test with color vision deficiency simulators
- Validate touch target sizes on mobile

### 3. User Testing

**Accessibility User Research**

- Test with real users who use assistive technologies
- Gather feedback on alarm creation and management flows
- Validate wake-up experience accessibility

## Common Patterns

### Skip Links

```tsx
// Allow keyboard users to skip navigation
<a
  href="#main-content"
  className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
>
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
  {/* Main content */}
</main>
```

### Live Regions

```tsx
// Announce status changes to screen readers
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// For urgent announcements
<div aria-live="assertive" className="sr-only">
  {errorMessage}
</div>
```

### Focus Management

```tsx
// Managing focus in single-page applications
const FocusManager = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Focus main content on route change
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [location.pathname]);

  return (
    <main ref={mainRef} tabIndex={-1} className="focus:outline-none">
      {children}
    </main>
  );
};
```

### High Contrast Mode

```css
/* Support Windows High Contrast Mode */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid ButtonText;
  }

  .focus-ring {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}

/* Support forced colors mode */
@media (forced-colors: active) {
  .custom-checkbox {
    forced-color-adjust: none;
    border: 1px solid ButtonText;
  }
}
```

## Quick Fixes

### Common Issues and Solutions

**❌ Missing alt text**

```tsx
// Before
<img src="alarm-clock.png" />

// After
<img src="alarm-clock.png" alt="Alarm clock showing 7:00 AM" />
```

**❌ Low color contrast**

```tsx
// Before - contrast ratio 2.1:1
<button className="text-gray-400 bg-gray-100">Save</button>

// After - contrast ratio 4.8:1
<button className="text-gray-900 bg-gray-100 hover:bg-gray-200">Save</button>
```

**❌ Missing form labels**

```tsx
// Before
<input type="time" placeholder="Set alarm time" />

// After
<label htmlFor="alarm-time">Alarm Time</label>
<input id="alarm-time" type="time" />
```

**❌ Unclear button purpose**

```tsx
// Before
<button onClick={deleteAlarm}>🗑️</button>

// After
<button onClick={deleteAlarm} aria-label="Delete alarm">
  <TrashIcon aria-hidden="true" />
</button>
```

**❌ Inaccessible custom components**

```tsx
// Before
<div className="toggle" onClick={toggle}>
  <div className={`slider ${active ? 'active' : ''}`} />
</div>

// After
<button
  role="switch"
  aria-checked={active}
  aria-label="Enable notifications"
  onClick={toggle}
  className="toggle"
>
  <span className={`slider ${active ? 'active' : ''}`} aria-hidden="true" />
</button>
```

### Testing Checklist

**Before Every PR:**

- [ ] Run `npm run test:a11y:unit` - all tests pass
- [ ] Run `npm run test:a11y:e2e` - no critical violations
- [ ] Test keyboard navigation through new features
- [ ] Verify focus indicators are visible
- [ ] Check color contrast meets 4.5:1 minimum
- [ ] Test with screen reader (VoiceOver/NVDA)

**Before Deployment:**

- [ ] Run `npm run test:a11y:all` - full test suite passes
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Manual testing with real assistive technologies
- [ ] Cross-browser accessibility verification

## Resources

### Tools

- 🔧 **[axe DevTools](https://www.deque.com/axe/devtools/)** - Browser extension for accessibility
  testing
- 🎨 **[Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)** - Check color
  contrast ratios
- ⌨️ **[Web Accessibility Evaluation Tools](https://www.w3.org/WAI/ER/tools/)** - Comprehensive list
  of a11y tools
- 📱 **[Mobile Accessibility](https://www.w3.org/WAI/mobile/)** - Mobile-specific accessibility
  guidelines

### Documentation

- 📚 **[WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Complete WCAG 2.1
  reference
- 🏗️ **[ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)** - ARIA patterns and examples
- 🎯 **[WebAIM](https://webaim.org/)** - Practical accessibility guidance
- 🔍 **[A11y Project](https://www.a11yproject.com/)** - Community-driven accessibility resources

### Screen Reader Testing

- 🍎 **VoiceOver (macOS)**: Cmd+F5 to enable
- 🪟 **NVDA (Windows)**: Free download from [nvaccess.org](https://www.nvaccess.org/)
- 📱 **Mobile**: VoiceOver (iOS), TalkBack (Android)

### Internal Resources

- 📖 [Manual QA Checklist](./manual-qa-checklist.md)
- 🧪 [Testing Examples](./a11y-examples.md)
- 🚀 [Quick Start Guide](./a11y-quick-start.md)
- 🎨 [Design System Accessibility](./design-system-a11y.md)

---

**Questions or need help?**

- 💬 Ask in #accessibility Slack channel
- 📧 Email the a11y team
- 🎯 Review our [accessibility testing examples](./a11y-examples.md)

Remember: Accessibility is not a feature, it's a fundamental aspect of good user experience design.
Every user deserves access to effective alarm management! ⏰
