# Jest/ts-jest Version Compatibility Analysis

## Current State

### Package Versions (from package.json)
- **jest**: `^30.0.5` (devDependencies)
- **ts-jest**: `^29.2.5` (devDependencies)
- **@types/jest**: `^30.0.0` (devDependencies)

### Problem Identified
❌ **INCOMPATIBLE VERSIONS**: Jest v30 is not fully supported by ts-jest v29.x

## Research Findings

### ts-jest Support Status
- **Current stable ts-jest version**: 29.4.1 (latest on npm as of Aug 2024)
- **Jest 30 support**: ⚠️ **In Development** 
  - Recent merged PR from 2 weeks ago: "Update Jest packages to ^30.0.5" (#4964)
  - Active development but not yet in stable release
  - Multiple PRs working on Jest 30 compatibility

### Jest 30 Requirements
- **Node.js**: Minimum v18.x (drops support for 14, 16, 19, 21)
- **TypeScript**: Minimum v5.4
- **Breaking changes**: Removed alias matcher functions (`toBeCalled` → `toHaveBeenCalled`)

## Recommended Solution

### Option 1: Downgrade Jest to v29 (RECOMMENDED)
```json
{
  "jest": "^29.7.0",
  "ts-jest": "^29.2.5",
  "@types/jest": "^29.5.12"
}
```

**Pros:**
- ✅ Fully compatible and stable
- ✅ Well-tested combination
- ✅ No configuration changes needed

**Cons:**
- Missing Jest 30 performance improvements

### Option 2: Wait for ts-jest v30 (NOT RECOMMENDED)
- ts-jest team is working on Jest 30 support
- No official release date announced
- Current state: experimental/development

## Next Steps

1. **Downgrade Jest to v29.x** for immediate compatibility
2. **Update lockfile** to reflect version changes
3. **Run tests** to verify functionality
4. **Monitor ts-jest releases** for future Jest 30 support

## Compatible Version Matrix

| Jest Version | ts-jest Version | Status | Recommended |
|--------------|----------------|--------|-------------|
| ^30.0.x      | ^29.2.x        | ❌ Incompatible | No |
| ^29.7.x      | ^29.2.x        | ✅ Compatible   | **Yes** |
| ^29.7.x      | ^29.4.x        | ✅ Compatible   | **Yes** |

## Files to Update

1. `package.json` - Update Jest version to ^29.7.0
2. `package-lock.json` - Regenerate after version change
3. `jest.config.js` - Verify configuration compatibility (likely no changes needed)

---
*Analysis completed: $(date)*
*Next step: Proceed with Step 1 - Align Dependency Versions*