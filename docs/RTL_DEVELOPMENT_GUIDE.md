# RTL (Right-to-Left) Development Guide

## Overview

The Relife alarm app now has comprehensive RTL (Right-to-Left) language support for Arabic, Hebrew, Urdu, Persian (Farsi), and Kurdish. This guide explains how to use and develop with the RTL system.

## Supported RTL Languages

- **Arabic (ar)** - العربية 🇸🇦
- **Hebrew (he)** - עברית 🇮🇱
- **Urdu (ur)** - اردو 🇵🇰
- **Persian/Farsi (fa)** - فارسی 🇮🇷
- **Kurdish (ku)** - کوردی 🏴

## Quick Start

### Using RTL Hooks

The easiest way to add RTL support to your components:

```tsx
import { useRTL } from "../components/RTLLayout";

function MyComponent() {
  const { isRTL, direction } = useRTL();

  return (
    <div dir={direction} className={isRTL ? "text-right" : "text-left"}>
      Content adapts to language direction
    </div>
  );
}
```

### Using RTL Components

Pre-built components that handle RTL automatically:

```tsx
import { RTLFlex, RTLText, RTLContainer } from "../components/RTLLayout";

function MyLayout() {
  return (
    <RTLContainer maxWidth="lg" padding="md">
      <RTLFlex direction="row" justify="between">
        <RTLText align="start" size="xl">
          Title Text
        </RTLText>
        <button>Action</button>
      </RTLFlex>
    </RTLContainer>
  );
}
```

## Core Concepts

### Direction Detection

The app automatically detects RTL languages and applies appropriate styling:

```tsx
// Automatic detection based on i18n language
const { isRTL } = useRTL(); // true for ar, he, ur, fa, ku

// Manual override
<Component dir="rtl" />  // Force RTL
<Component dir="ltr" />  // Force LTR
<Component dir="auto" /> // Auto-detect (default)
```

### CSS Classes

Use direction-aware Tailwind classes:

```css
/* RTL-specific classes */
.rtl\:text-right   /* text-right only in RTL */
.ltr\:text-left    /* text-left only in LTR */

/* Direction-aware utilities */
.dir-aware-start          /* left in LTR, right in RTL */
.dir-aware-end            /* right in LTR, left in RTL */
.dir-aware-margin-start   /* margin-left in LTR, margin-right in RTL */
.dir-aware-padding-end    /* padding-right in LTR, padding-left in RTL */
```

### Logical Properties

Use logical CSS properties when possible:

```css
/* Preferred - automatically flips direction */
margin-inline-start: 1rem;
padding-inline-end: 2rem;
border-inline-start: 1px solid;

/* Instead of physical properties */
margin-left: 1rem; /* ❌ Doesn't flip in RTL */
padding-right: 2rem; /* ❌ Doesn't flip in RTL */
border-left: 1px solid; /* ❌ Doesn't flip in RTL */
```

## Available Hooks

### useRTL

Main hook for RTL functionality:

```tsx
const {
  isRTL, // boolean: true if current language is RTL
  direction, // 'ltr' | 'rtl': current text direction
  language, // current language code
  getDirection, // function to get direction for any language
  getFlexDirection, // function to get RTL-aware flex direction
  getTextAlign, // function to get RTL-aware text alignment
  textAlignClass, // function to get Tailwind alignment classes
  flexDirectionClass, // function to get Tailwind flex classes
  getMarginStyle, // function for CSS-in-JS margin styles
  getPaddingStyle, // function for CSS-in-JS padding styles
  getPositionStyle, // function for CSS-in-JS positioning
  getTransformStyle, // function for CSS-in-JS transforms
} = useRTL();
```

### useRTLSpacing

Hook for RTL-aware spacing:

```tsx
const { margin, padding } = useRTLSpacing();

// CSS-in-JS styles
const styles = {
  ...margin.start("1rem"), // margin-left in LTR, margin-right in RTL
  ...padding.end("0.5rem"), // padding-right in LTR, padding-left in RTL
};
```

### useRTLFlex

Hook for RTL-aware flexbox layouts:

```tsx
const { flex } = useRTLFlex();

const containerStyle = {
  display: "flex",
  flexDirection: flex.direction(), // 'row' in LTR, 'row-reverse' in RTL
  justifyContent: flex.justifyContent.start, // 'flex-start' in LTR, 'flex-end' in RTL
};
```

### useRTLText

Hook for RTL-aware typography:

```tsx
const { text } = useRTLText();

return (
  <p
    className={text.alignClass("start")} // 'text-left' in LTR, 'text-right' in RTL
    style={{ direction: text.direction }}
  >
    Text content
  </p>
);
```

## RTL-Aware Components

### RTLContainer

Responsive container with RTL support:

```tsx
<RTLContainer
  maxWidth="xl" // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none'
  padding="lg" // boolean | 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center={true} // center horizontally
  dir="auto" // 'ltr' | 'rtl' | 'auto'
  as="section" // HTML element type
>
  Content
</RTLContainer>
```

### RTLFlex

Flexbox container with RTL support:

```tsx
<RTLFlex
  direction="row-rtl" // 'row' | 'column' | 'row-reverse' | 'column-reverse' | 'row-rtl'
  justify="start" // 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align="center" // 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  wrap={true} // boolean | 'reverse'
  gap={16} // number | string
  inline={false} // use inline-flex instead of flex
>
  <div>Item 1</div>
  <div>Item 2</div>
</RTLFlex>
```

### RTLGrid

CSS Grid container with RTL support:

```tsx
<RTLGrid
  cols={3} // number | responsive object
  cols={{ sm: 1, md: 2, lg: 3, xl: 4 }} // responsive columns
  gap={16} // number | string | {x: number, y: number}
  autoFlow="rtl-row" // 'row' | 'col' | 'rtl-row' | 'rtl-col'
  justify="start" // 'start' | 'end' | 'center' | 'stretch'
  align="center" // 'start' | 'end' | 'center' | 'stretch'
>
  <div>Grid item</div>
</RTLGrid>
```

### RTLText

Text component with RTL-aware typography:

```tsx
<RTLText
  align="start" // 'start' | 'end' | 'center' | 'justify'
  size="lg" // 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | etc.
  weight="semibold" // 'thin' | 'light' | 'normal' | 'medium' | etc.
  truncate={2} // boolean | number (line clamp)
  dir="auto" // 'ltr' | 'rtl' | 'auto'
  as="h2" // HTML element type
>
  Text content
</RTLText>
```

### RTLForm

Form wrapper with RTL-aware layout:

```tsx
<RTLForm
  layout="vertical" // 'vertical' | 'horizontal' | 'inline'
  gap="md" // 'sm' | 'md' | 'lg'
  labelPosition="auto" // 'auto' | 'start' | 'end' | 'top'
  onSubmit={handleSubmit}
>
  <RTLFormField label="Field Label" error="Error message" required>
    <input type="text" />
  </RTLFormField>
</RTLForm>
```

## Enhanced UI Components

All base UI components now support RTL:

### Button

```tsx
<Button dir="auto">
  <Icon />
  Button Text
</Button>
// Icon automatically positions correctly in RTL/LTR
```

### Card

```tsx
<Card dir="auto">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardAction>
      <button>Action</button> {/* Positions right in LTR, left in RTL */}
    </CardAction>
  </CardHeader>
  <CardFooter>
    <button>Cancel</button>
    <button>Save</button> {/* Button order reverses in RTL */}
  </CardFooter>
</Card>
```

### Dialog

```tsx
<Dialog>
  <DialogContent dir="auto">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle> {/* Text aligns correctly */}
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <button>Cancel</button>
      <button>Save</button> {/* Buttons reorder in RTL */}
    </DialogFooter>
    {/* Close button (×) positions left in RTL, right in LTR */}
  </DialogContent>
</Dialog>
```

### Input

```tsx
<Input
  dir="auto"
  placeholder="Placeholder text" // Aligns correctly in RTL
/>
```

## Testing RTL Components

Use the RTL testing utilities:

```tsx
import {
  renderWithRTL,
  rtlTestHelpers,
  rtlTestScenarios,
} from "../utils/rtl-testing";

describe("MyComponent RTL", () => {
  rtlTestScenarios.testBothDirections(
    () => <MyComponent />,
    (element, isRTL, language) => {
      rtlTestHelpers.expectCorrectDirection(element, isRTL ? "rtl" : "ltr");
      rtlTestHelpers.expectRTLFlexDirection(element, isRTL);
    },
  );

  test("specific RTL behavior", () => {
    const { container } = renderWithRTL(<MyComponent />, { language: "ar" });
    // Test RTL-specific functionality
  });
});
```

## Best Practices

### 1. Use Semantic Direction

Always think in terms of "start" and "end" instead of "left" and "right":

```tsx
// ✅ Good - semantic direction
<div className="text-start pl-start border-l-start">

// ❌ Bad - physical direction
<div className="text-left pl-2 border-l-2">
```

### 2. Test with Real Content

Test your components with actual RTL text, not placeholder content:

```tsx
// ✅ Test with real Arabic text
const arabicText = "مرحباً بكم في تطبيق المنبه الذكي";

// ❌ Don't test with Latin placeholder
const placeholder = "Lorem ipsum dolor sit amet";
```

### 3. Consider Icon Direction

Some icons need to flip direction in RTL:

```tsx
// Icons that should flip: arrows, navigation, directional content
<ChevronLeftIcon className="rtl:scale-x-[-1]" />

// Icons that shouldn't flip: people, objects, universal symbols
<UserIcon /> // No need to flip
```

### 4. Handle Mixed Content

When mixing RTL and LTR content:

```tsx
<RTLText dir="rtl">
  النص العربي {/* RTL text */}
  <span dir="ltr">English text</span> {/* Embedded LTR */}
  المزيد من النص العربي
</RTLText>
```

### 5. Use Logical Properties

Leverage CSS logical properties in your styles:

```css
/* ✅ Good - automatically adapts to direction */
.my-component {
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
  border-inline-start: 1px solid #ccc;
}

/* ❌ Bad - fixed direction */
.my-component {
  margin-left: 1rem;
  padding-right: 0.5rem;
  border-left: 1px solid #ccc;
}
```

## Debugging RTL Issues

### 1. Use RTL Development Tools

Add this debug component to visualize RTL states:

```tsx
function RTLDebugger() {
  const { isRTL, direction, language } = useRTL();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50">
      Lang: {language} | Dir: {direction} | RTL: {isRTL ? "✓" : "✗"}
    </div>
  );
}
```

### 2. Common Issues and Solutions

#### Icons not flipping:

```tsx
// Add transform utility
<Icon className="rtl:scale-x-[-1]" />
```

#### Text alignment not working:

```tsx
// Use semantic classes instead of physical
<div className="text-start rtl:text-right ltr:text-left" />
```

#### Spacing issues:

```tsx
// Use directional utilities
<div className="ms-4 me-2" /> // margin-start, margin-end
```

#### Flex direction problems:

```tsx
// Use RTL-aware flex
<div className="flex ltr:flex-row rtl:flex-row-reverse" />
```

## Performance Considerations

The RTL system is designed for optimal performance:

1. **Direction detection** happens once per language change
2. **CSS classes** use native CSS selectors (no JS calculations)
3. **Logical properties** are handled by the browser
4. **Hooks** use React.useMemo for expensive calculations

Monitor performance with the testing utilities:

```tsx
import { rtlPerformanceHelpers } from "../utils/rtl-testing";

const results = await rtlPerformanceHelpers.measureRTLPerformance(
  () => <MyComponent />,
  100, // iterations
);

console.log("RTL vs LTR performance:", results);
```

## Migration Guide

### From Physical to Logical Properties

Replace physical properties with logical ones:

```diff
- margin-left: 1rem;
+ margin-inline-start: 1rem;

- padding-right: 0.5rem;
+ padding-inline-end: 0.5rem;

- border-left: 1px solid;
+ border-inline-start: 1px solid;

- left: 0;
+ inset-inline-start: 0;
```

### From Fixed Direction Classes

Replace fixed direction classes with RTL-aware ones:

```diff
- <div className="text-left ml-4 border-l-2">
+ <div className="text-start ms-4 border-s-2">

- <div className="float-right pr-2">
+ <div className="float-end pe-2">

- <div className="flex flex-row justify-end">
+ <RTLFlex direction="row" justify="end">
```

## Troubleshooting

### Common Issues

1. **Text not aligning correctly**: Check if you're using semantic classes (`text-start`) vs physical (`text-left`)

2. **Icons in wrong position**: Ensure flex containers use RTL-aware direction classes

3. **Animations not flipping**: Add RTL-specific transform utilities

4. **Form labels misaligned**: Use `RTLForm` component or RTL-aware form hooks

5. **Third-party components**: Wrap in `RTLContainer` or manually add `dir` attributes

### Getting Help

- Check the test files for usage examples
- Use the debug tools to inspect RTL state
- Review the RTL utilities documentation
- Test with multiple RTL languages to ensure consistency

## Future Improvements

The RTL system will continue to evolve:

- **Additional RTL languages** (as requested)
- **More Tailwind utilities** for common RTL patterns
- **Better debugging tools** for development
- **Performance optimizations** based on usage patterns
- **Accessibility improvements** for screen readers

## Resources

- [CSS Logical Properties Specification](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [RTL Styling Guidelines](https://rtlstyling.com/)
- [Arabic Typography Guidelines](https://www.w3.org/International/articles/arabic-typography/)
- [Hebrew Web Typography](https://www.w3.org/International/articles/hebrew-typography/)
