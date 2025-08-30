/**
 * Security utilities for handling sensitive data and preventing common vulnerabilities
 */

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  fallback: T
): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Validate and sanitize API keys and secrets
 */
export function validateApiKey(
  key: string | undefined,
  keyType: string
): string | undefined {
  if (!key) {
    return undefined;
  }

  // Check for placeholder/template values
  const placeholders = [
    'your_',
    'test_your_',
    'example',
    'placeholder',
    'demo',
    'xxx',
    '123456',
    'abcdef'
  ];

  const lowerKey = key.toLowerCase();
  const hasPlaceholder = placeholders.some(p => lowerKey.includes(p));

  if (hasPlaceholder) {
    console.warn(`Warning: ${keyType} appears to be a placeholder value`);
    return undefined;
  }

  // Basic validation for key format
  if (key.length < 10) {
    console.warn(`Warning: ${keyType} seems too short to be valid`);
    return undefined;
  }

  return key;
}

/**
 * Safely access localStorage with error handling
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set localStorage with error handling
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting localStorage for key "${key}":`, error);
    return false;
  }
}

/**
 * Create safe innerHTML content (for static content only)
 * WARNING: Never use with user-generated content
 */
export function createSafeStaticHTML(
  element: HTMLElement,
  staticHTML: string
): void {
  // Only allow specific safe HTML for loading screens
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = staticHTML;
  
  // Remove any script tags or event handlers
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  const elementsWithEvents = tempDiv.querySelectorAll('[onclick], [onload], [onerror], [onmouseover]');
  elementsWithEvents.forEach(el => {
    el.removeAttribute('onclick');
    el.removeAttribute('onload');
    el.removeAttribute('onerror');
    el.removeAttribute('onmouseover');
  });
  
  // Use textContent for any user data
  element.innerHTML = tempDiv.innerHTML;
}

/**
 * Validate environment variable URL
 */
export function validateEnvUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  
  try {
    const parsedUrl = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.warn(`Invalid protocol in URL: ${url}`);
      return fallback;
    }
    return url;
  } catch {
    console.warn(`Invalid URL: ${url}, using fallback: ${fallback}`);
    return fallback;
  }
}

/**
 * Sanitize and validate environment variable strings
 */
export function validateEnvString(
  value: string | undefined,
  fallback: string,
  options: {
    maxLength?: number;
    allowedPattern?: RegExp;
    keyType?: string;
  } = {}
): string {
  const { maxLength = 1000, allowedPattern, keyType } = options;

  if (!value) return fallback;
  if (typeof value !== 'string') return fallback;

  // Check for placeholder values if it's an API key
  if (keyType) {
    const validated = validateApiKey(value, keyType);
    if (!validated) return fallback;
    value = validated;
  }

  // Validate length
  if (value.length > maxLength) {
    console.warn(`Value exceeded max length of ${maxLength}, truncating`);
    return value.substring(0, maxLength);
  }

  // Validate pattern if provided
  if (allowedPattern && !allowedPattern.test(value)) {
    console.warn(`Value does not match allowed pattern, using fallback`);
    return fallback;
  }

  return value;
}