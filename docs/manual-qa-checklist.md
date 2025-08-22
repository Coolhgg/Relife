# Manual Accessibility QA Checklist ✅

**Relife Alarm App - Manual Testing Checklist for WCAG 2.1 AA Compliance**

This checklist ensures comprehensive manual accessibility testing beyond automated tools. Use this
for every major feature release and before production deployments.

## Pre-Testing Setup

### Testing Environment

- [ ] **Browser Testing**: Chrome, Firefox, Safari, Edge
- [ ] **Screen Readers**: VoiceOver (macOS), NVDA (Windows), TalkBack (Android), VoiceOver (iOS)
- [ ] **Keyboard Only**: Disconnect/ignore mouse for testing session
- [ ] **Zoom Testing**: Set browser to 200% zoom minimum
- [ ] **Color Vision**: Use browser extension to simulate color blindness

### Test User Accounts

- [ ] **Free Tier Account**: Basic alarm functionality
- [ ] **Premium Account**: Advanced features enabled
- [ ] **New User Account**: Onboarding flow experience
- [ ] **RTL Language Account**: Arabic interface testing

---

## Section 1: Keyboard Navigation 🎹

### Tab Navigation

- [ ] **Logical Tab Order**: Tab key follows visual layout left-to-right, top-to-bottom
- [ ] **No Keyboard Traps**: Can always escape from any component using standard keys
- [ ] **Skip Links**: First tab stop allows skipping navigation to main content
- [ ] **Focus Indicators**: Clear visual indication of keyboard focus (minimum 2px outline)
- [ ] **All Interactive Elements**: Every button, link, input, checkbox reachable via keyboard

### Keyboard Shortcuts

- [ ] **Enter Key**: Activates buttons and links consistently
- [ ] **Space Bar**: Activates buttons, checks checkboxes, opens dropdowns
- [ ] **Arrow Keys**: Navigate within components (tabs, menus, radio groups)
- [ ] **Escape Key**: Closes modals, dropdowns, tooltips, returns focus appropriately
- [ ] **Home/End**: Navigate to first/last items in lists where applicable

### Focus Management

- [ ] **Modal Focus**: When modal opens, focus moves to first focusable element
- [ ] **Modal Return**: When modal closes, focus returns to trigger element
- [ ] **Page Navigation**: Focus moves to main content area on page/route changes
- [ ] **Dynamic Content**: Focus management handles dynamically added content
- [ ] **Error Fields**: Focus moves to first field with validation error

**Test Scenarios:**

```
1. Navigate entire app using only Tab, Shift+Tab, Enter, Space, and Arrow keys
2. Create new alarm using only keyboard - verify all steps are accessible
3. Edit existing alarm via keyboard navigation
4. Delete alarm and confirm deletion using only keyboard
5. Navigate settings screens without mouse
6. Test alarm going off - can it be dismissed via keyboard?
```

---

## Section 2: Screen Reader Testing 🔊

### VoiceOver (macOS) - Cmd+F5 to enable

- [ ] **Rotor Navigation**: Use Ctrl+Alt+U to open rotor, test headings, links, forms
- [ ] **Landmark Navigation**: Use Ctrl+Alt+U → Landmarks to navigate page sections
- [ ] **Reading Order**: Content reads in logical order matching visual layout
- [ ] **Heading Structure**: Proper h1-h6 hierarchy announced correctly
- [ ] **Button Labels**: All buttons have descriptive, actionable labels
- [ ] **Form Labels**: Input fields clearly associated with labels
- [ ] **Status Announcements**: Changes announced via live regions

### NVDA (Windows) - Download from nvaccess.org

- [ ] **Browse Mode**: NVDA reads page content naturally
- [ ] **Focus Mode**: Form interactions work properly
- [ ] **Element List**: NVDA+F7 shows headings, links, landmarks
- [ ] **Speech Rate**: Test at different speech speeds
- [ ] **Braille Display**: If available, verify braille output

### Mobile Screen Readers

- [ ] **TalkBack (Android)**: Swipe navigation, explore by touch
- [ ] **VoiceOver (iOS)**: Swipe navigation, rotor control
- [ ] **Touch Exploration**: Touch and explore interface without activating

**Test Scenarios:**

```
1. Navigate homepage and understand app purpose without seeing screen
2. Create alarm guided only by screen reader announcements
3. Understand alarm status (enabled/disabled) via audio cues
4. Navigate settings and change preferences using only screen reader
5. Receive alarm and understand how to dismiss it via audio
```

### Screen Reader Checklist

- [ ] **Page Titles**: Unique, descriptive titles for each page/view
- [ ] **Headings**: Logical h1-h6 structure describes content hierarchy
- [ ] **Landmarks**: main, nav, aside, footer regions properly identified
- [ ] **Alt Text**: Images have descriptive alt text or alt="" for decorative
- [ ] **Link Purpose**: Link text describes destination/action clearly
- [ ] **Button Labels**: Buttons describe action they perform
- [ ] **Form Instructions**: Clear instructions before form fields
- [ ] **Error Messages**: Errors clearly associated with relevant fields
- [ ] **Status Updates**: Dynamic changes announced to screen readers
- [ ] **Tables**: Proper headers and captions where applicable

---

## Section 3: Visual Assessment 👁️

### Color and Contrast

- [ ] **Contrast Ratios**: Use WebAIM contrast checker, minimum 4.5:1 for normal text
- [ ] **Large Text Contrast**: 3:1 minimum for text 18px+ or 14px+ bold
- [ ] **Interactive Elements**: 3:1 minimum for buttons, form borders, focus indicators
- [ ] **Color Independence**: Information not conveyed by color alone
- [ ] **Dark Mode**: All contrast requirements met in dark theme

### Color Vision Testing

- [ ] **Protanopia**: Red color blindness simulation - all info still accessible
- [ ] **Deuteranopia**: Green color blindness simulation - all info still accessible
- [ ] **Tritanopia**: Blue color blindness simulation - all info still accessible
- [ ] **Monochrome**: Grayscale view - all information distinguishable

### Zoom and Scaling

- [ ] **200% Zoom**: All content and functionality available at 200% browser zoom
- [ ] **400% Zoom**: Content reflows appropriately, no horizontal scrolling needed
- [ ] **Mobile Scaling**: Content scales properly on mobile devices
- [ ] **Text Scaling**: Test with increased OS text size settings

### Layout and Spacing

- [ ] **Touch Targets**: Minimum 44x44px for interactive elements on mobile
- [ ] **Spacing**: Adequate white space between interactive elements
- [ ] **Reading Width**: Text lines not excessively long (45-75 characters)
- [ ] **Responsive Design**: Layout works at different screen sizes

**Test Scenarios:**

```
1. Set browser to 200% zoom and verify all functionality still works
2. Test with high contrast browser/OS mode enabled
3. Use color blindness simulator to ensure critical info isn't color-dependent
4. Test on mobile device with large text accessibility setting enabled
```

---

## Section 4: Mobile Accessibility 📱

### Touch Interaction

- [ ] **Target Size**: All touch targets minimum 44x44px (iOS) or 48x48dp (Android)
- [ ] **Touch Spacing**: Adequate space between touch targets (8px minimum)
- [ ] **Touch Feedback**: Visual/haptic feedback for touch interactions
- [ ] **Gesture Alternatives**: Complex gestures have alternative access methods

### Mobile Screen Readers

- [ ] **TalkBack Navigation**: Swipe right/left to navigate elements
- [ ] **VoiceOver Navigation**: Clean navigation flow through interface
- [ ] **Explore by Touch**: Touch exploration provides clear feedback
- [ ] **Reading Order**: Logical reading order maintained on mobile

### Mobile-Specific Testing

- [ ] **Orientation**: App works in both portrait and landscape
- [ ] **One-Handed Use**: Critical functions reachable with one hand
- [ ] **Voice Control**: Test with iOS Voice Control or Android Voice Access
- [ ] **Switch Control**: Test with external switch navigation if available

**Test Scenarios:**

```
1. Create and manage alarms using only TalkBack/VoiceOver on mobile
2. Test alarm dismissal with screen reader active
3. Verify all settings accessible via mobile screen reader
4. Test app with large text accessibility setting enabled
```

---

## Section 5: Content and Language 🗣️

### Language Support

- [ ] **Language Declaration**: HTML lang attribute set correctly
- [ ] **Multi-language**: Interface properly translates in supported languages
- [ ] **RTL Languages**: Arabic interface displays and functions correctly
- [ ] **Text Direction**: Content flows correctly in RTL languages

### Content Clarity

- [ ] **Plain Language**: Instructions and labels use clear, simple language
- [ ] **Error Messages**: Errors are specific and provide correction guidance
- [ ] **Help Text**: Contextual help available for complex interactions
- [ ] **Abbreviations**: Acronyms and abbreviations explained on first use

### Reading Level

- [ ] **Comprehension**: Average user can understand instructions
- [ ] **Jargon**: Technical terms explained or avoided
- [ ] **Consistency**: Terminology used consistently throughout app

**Test Scenarios:**

```
1. Test app in Arabic (RTL) mode - verify layout and functionality
2. Review all error messages for clarity and actionability
3. Verify alarm setup instructions are clear for non-technical users
4. Test with someone unfamiliar with the app - can they complete tasks?
```

---

## Section 6: Timing and Motion 🕐

### Time-Based Content

- [ ] **No Time Limits**: Or provide way to extend/remove time limits
- [ ] **Pause Control**: User can pause auto-updating content
- [ ] **Content Changes**: User can control timing of content changes

### Animation and Motion

- [ ] **Motion Preferences**: Respect prefers-reduced-motion OS setting
- [ ] **Essential Motion**: Only use motion when essential for understanding
- [ ] **Pause Animation**: Provide controls to pause non-essential animations
- [ ] **No Flashing**: No content flashes more than 3 times per second

### Auto-Playing Content

- [ ] **No Auto-Play**: Media doesn't auto-play with sound
- [ ] **User Control**: Easy controls to stop/start auto-playing content
- [ ] **Background Audio**: No unexpected background audio

**Test Scenarios:**

```
1. Enable "reduce motion" OS setting and verify animations are reduced
2. Test with auto-playing content disabled in browser
3. Verify alarm sounds can be stopped/controlled by user
4. Check that no content unexpectedly flashes or moves
```

---

## Section 7: Forms and Data Entry 📝

### Form Structure

- [ ] **Fieldsets**: Related form fields grouped with fieldset/legend
- [ ] **Required Fields**: Clearly marked and indicated to screen readers
- [ ] **Label Association**: Every input has proper label association
- [ ] **Instructions**: Clear instructions provided before form fields

### Validation and Errors

- [ ] **Inline Validation**: Real-time validation doesn't interfere with completion
- [ ] **Error Summary**: List of errors at top of form when submitted
- [ ] **Error Association**: Errors clearly linked to specific fields
- [ ] **Error Recovery**: Clear guidance on how to fix errors

### Input Assistance

- [ ] **Format Examples**: Show expected format for complex inputs (time, phone)
- [ ] **Autocomplete**: Proper autocomplete attributes for personal information
- [ ] **Input Types**: Correct input types (email, tel, number) for mobile keyboards
- [ ] **Character Limits**: Clear indication of character/word limits

**Test Scenarios:**

```
1. Create alarm with invalid data and verify error handling
2. Test form completion using only keyboard navigation
3. Submit form with errors and verify error messages are clear
4. Test form with screen reader - all fields properly announced
```

---

## Section 8: Critical User Flows 🎯

### Onboarding Flow

- [ ] **Welcome Screen**: Purpose and navigation clear
- [ ] **First Alarm**: Can create first alarm using assistive tech
- [ ] **Permissions**: Permission requests clear and accessible
- [ ] **Skip Options**: Can skip optional onboarding steps

### Alarm Management

- [ ] **Create Alarm**: Full alarm creation accessible via keyboard/SR
- [ ] **Edit Alarm**: Can modify existing alarms accessibly
- [ ] **Delete Alarm**: Clear confirmation process for deletion
- [ ] **Enable/Disable**: Toggle alarm status clearly indicated
- [ ] **Alarm Sounds**: Preview and selection of alarm sounds accessible

### Alarm Experience

- [ ] **Alarm Rings**: Clear indication when alarm is active
- [ ] **Dismiss Options**: Multiple ways to dismiss alarm (tap, key, etc.)
- [ ] **Snooze Function**: Snooze option clearly available and indicated
- [ ] **Volume Control**: Alarm volume can be controlled by user

### Settings and Preferences

- [ ] **Navigation**: All settings accessible via keyboard/screen reader
- [ ] **Changes Saved**: Clear confirmation when settings are saved
- [ ] **Default Values**: Sensible defaults that work for accessibility
- [ ] **Account Management**: Profile and account settings accessible

**Critical Flow Test:**

```
Complete End-to-End Test:
1. New user onboarding using only assistive technology
2. Create first alarm with specific time and sound
3. Enable alarm and wait for it to trigger
4. Dismiss alarm using keyboard/screen reader
5. Edit alarm settings and save changes
6. Delete alarm with confirmation
7. Navigate to settings and modify preferences

This test should be completable using only:
- Keyboard navigation
- Screen reader
- Mobile accessibility features
```

---

## Section 9: Documentation and Help 📚

### Built-in Help

- [ ] **Context Help**: Help available at point of need
- [ ] **Accessible Format**: Help text accessible to screen readers
- [ ] **Clear Language**: Help uses plain language principles
- [ ] **Multiple Formats**: Help available in multiple formats if needed

### Error Recovery

- [ ] **Recovery Guidance**: Clear steps to recover from errors
- [ ] **Contact Options**: Way to get human help if needed
- [ ] **Accessibility Support**: Specific accessibility support information

---

## Testing Report Template

### Test Summary

- **Date**: [Date of testing]
- **Tester**: [Name and role]
- **Test Environment**: [Browser, OS, assistive tech used]
- **Features Tested**: [List of features/flows tested]

### Results Summary

- **Passed**: ** / ** criteria
- **Failed**: \_\_ criteria (list critical failures)
- **Notes**: [Additional observations]

### Critical Issues Found

| Issue | Severity                 | Component | Description | Impact |
| ----- | ------------------------ | --------- | ----------- | ------ |
|       | Critical/High/Medium/Low |           |             |        |

### Recommendations

1. **Immediate Fixes**: [Issues that block accessibility]
2. **Short-term Improvements**: [Issues to address soon]
3. **Long-term Enhancements**: [Nice-to-have improvements]

### Sign-off

- [ ] **Ready for Release**: All critical and high severity issues resolved
- [ ] **Needs Work**: Critical issues prevent release
- [ ] **Follow-up Required**: Schedule additional testing

---

## Frequency Guidelines

### Every PR/Feature

- [ ] Run automated accessibility tests
- [ ] Basic keyboard navigation check
- [ ] Screen reader smoke test on changed components

### Weekly/Sprint

- [ ] Full manual keyboard testing
- [ ] Complete screen reader testing of new features
- [ ] Color contrast verification

### Pre-Release

- [ ] Complete this manual checklist
- [ ] Multi-device testing (mobile + desktop)
- [ ] Real user testing with assistive technology users
- [ ] Cross-browser accessibility verification

### Quarterly

- [ ] Complete accessibility audit
- [ ] User research with accessibility users
- [ ] Training updates for development team
- [ ] Accessibility roadmap review

---

**Remember**: This checklist supplements, not replaces, automated testing. Both are essential for
comprehensive accessibility coverage!

For questions or assistance:

- 💬 #accessibility Slack channel
- 📧 Email accessibility team
- 📖 Review [Accessibility Guide](./A11Y-Guide.md)
