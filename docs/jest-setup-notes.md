# Jest Configuration Notes

## Snapshot Serializers

This project does not use @emotion/jest/serializer because:

- No @emotion usage in the codebase (uses TailwindCSS instead)
- Prevents unnecessary dependencies
- Removed in commit: fc9468b0 Merge pull request #115 from Coolhgg/scout/custom-sound-theme-creator

## Running Tests

- 'bun test' - Run all tests
- 'bun run test:coverage' - Run with coverage
- 'bun run test:watch' - Watch mode

## Test Structure

- Component tests: src/components/**tests**/
- Service tests: src/services/**tests**/
- E2E tests: tests/e2e/
