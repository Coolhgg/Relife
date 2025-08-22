# Pull Request 🚀

## Summary

<!-- Provide a brief description of your changes -->

## Type of Change

<!-- Check the type of change your PR introduces -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as
      expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI changes
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvements
- [ ] 🧪 Tests
- [ ] 🔒 Security improvements
- [ ] ♿ Accessibility improvements

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Screenshots/Demo

<!-- If applicable, add screenshots, GIFs, or video demos of your changes -->

## Testing

<!-- Describe the tests you've added or run -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices

## Accessibility Testing ♿

<!-- Required for all PRs affecting UI/UX -->

- [ ] **Automated Tests Passing**
  - [ ] `npm run test:a11y:unit` - Jest-axe component tests pass
  - [ ] `npm run test:a11y:e2e` - Playwright accessibility tests pass
  - [ ] No new critical or serious accessibility violations introduced

- [ ] **Manual Accessibility Testing**
  - [ ] Keyboard navigation tested (Tab, Enter, Space, Arrow keys, Escape)
  - [ ] Screen reader tested (VoiceOver, NVDA, or equivalent)
  - [ ] Focus management verified for new interactive elements
  - [ ] Color contrast meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
  - [ ] Touch targets are minimum 44x44px on mobile
  - [ ] Content tested at 200% zoom level

- [ ] **WCAG 2.1 AA Compliance**
  - [ ] All images have appropriate alt text or alt=""
  - [ ] Form inputs have proper labels and associations
  - [ ] Interactive elements have descriptive, accessible names
  - [ ] Error messages are clearly associated with relevant fields
  - [ ] Page/component has proper heading structure (h1-h6)
  - [ ] No information conveyed by color alone

- [ ] **Accessibility Report**
  - [ ] Lighthouse accessibility score ≥ 90 (if applicable)
  - [ ] pa11y WCAG audit passes (if applicable)
  - [ ] Accessibility report artifacts attached or referenced

## Browser Testing

<!-- Check browsers you've tested on -->

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Performance Impact

<!-- Consider performance implications of your changes -->

- [ ] No significant performance regression
- [ ] Bundle size impact assessed
- [ ] Loading time impact assessed
- [ ] Memory usage considered

## Security Review

<!-- For changes that might affect security -->

- [ ] No sensitive data exposed in client-side code
- [ ] Authentication/authorization properly implemented
- [ ] Input validation added where needed
- [ ] No new security vulnerabilities introduced

## Breaking Changes

<!-- If this is a breaking change, describe the impact -->

- [ ] Migration guide provided (if needed)
- [ ] Deprecation notices added (if needed)
- [ ] Documentation updated to reflect changes

## Dependencies

<!-- List any new dependencies or version updates -->

- None
<!-- OR list dependencies:
- Added: `package-name@version` - reason for addition
- Updated: `package-name` from `old-version` to `new-version` - reason for update -->

## Deployment Notes

<!-- Any special instructions for deployment -->

- [ ] No special deployment requirements
- [ ] Database migration required
- [ ] Environment variables updated
- [ ] Feature flags configured
- [ ] Cache clearing required

## Related Issues/PRs

<!-- Link related issues or PRs -->

- Closes #
- Related to #
- Depends on #

---

## Review Checklist (for reviewers) 👀

### Code Quality

- [ ] Code follows established patterns and conventions
- [ ] Proper error handling implemented
- [ ] Code is well-documented where necessary
- [ ] No commented-out code or TODO comments left behind

### Functionality

- [ ] Feature works as described
- [ ] Edge cases considered and handled
- [ ] No regression in existing functionality
- [ ] Performance is acceptable

### Accessibility Review

- [ ] Accessibility testing completed (see checklist above)
- [ ] Manual testing with screen reader performed
- [ ] Keyboard navigation verified
- [ ] Color contrast verified with tools
- [ ] Mobile accessibility tested

### Testing

- [ ] Tests adequately cover new functionality
- [ ] All tests pass in CI
- [ ] Test coverage maintained or improved

### Documentation

- [ ] README updated if needed
- [ ] API documentation updated if needed
- [ ] Internal documentation updated if needed

---

## Additional Notes

<!-- Any additional context, concerns, or notes for reviewers -->

---

**Accessibility Statement**: This PR maintains WCAG 2.1 AA compliance. All new interactive elements
are keyboard accessible, screen reader compatible, and meet color contrast requirements. Automated
accessibility tests pass, and manual testing has been completed with assistive technologies.

<!--
For accessibility questions or support:
- 📖 Review our [Accessibility Guide](../docs/A11Y-Guide.md)
- ✅ Use the [Manual QA Checklist](../docs/manual-qa-checklist.md)
- 💬 Ask in #accessibility Slack channel
-->
