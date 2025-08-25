/**
 * Accessibility Panel - A11y Testing and Validation
 * 
 * Provides tools for testing and validating accessibility:
 * - ARIA attributes validation
 * - Color contrast checking
 * - Keyboard navigation testing
 * - Screen reader simulation
 * - Focus management
 * - WCAG compliance checking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Keyboard,
  Volume2,
  Palette,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  MousePointer,
  Headphones,
  Scan,
  RefreshCw,
} from 'lucide-react';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'color-contrast' | 'aria' | 'keyboard' | 'semantic' | 'focus';
  element: string;
  description: string;
  suggestion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  selector?: string;
}

interface ColorContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  passes: {
    aa: boolean;
    aaa: boolean;
    aaLarge: boolean;
    aaaLarge: boolean;
  };
}

interface A11yStats {
  totalChecks: number;
  errors: number;
  warnings: number;
  passed: number;
  score: number;
}

export const AccessibilityPanel: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);
  const [colorContrastResults, setColorContrastResults] = useState<ColorContrastResult[]>([]);
  const [focusVisible, setFocusVisible] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [keyboardNavMode, setKeyboardNavMode] = useState(false);
  
  const scanIntervalRef = useRef<NodeJS.Timeout>();

  // Calculate accessibility stats
  const stats: A11yStats = React.useMemo(() => {
    const errors = issues.filter(issue => issue.type === 'error').length;
    const warnings = issues.filter(issue => issue.type === 'warning').length;
    const totalChecks = issues.length || 1;
    const passed = Math.max(0, totalChecks - errors - warnings);
    const score = Math.round((passed / totalChecks) * 100);

    return {
      totalChecks,
      errors,
      warnings,
      passed,
      score,
    };
  }, [issues]);

  // Color contrast checker
  const checkColorContrast = () => {
    const elements = document.querySelectorAll('*');
    const results: ColorContrastResult[] = [];

    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const ratio = calculateContrastRatio(color, backgroundColor);
        
        if (ratio < 4.5) {
          results.push({
            foreground: color,
            background: backgroundColor,
            ratio,
            passes: {
              aa: ratio >= 4.5,
              aaa: ratio >= 7,
              aaLarge: ratio >= 3,
              aaaLarge: ratio >= 4.5,
            },
          });
        }
      }
    });

    setColorContrastResults(results.slice(0, 20)); // Limit to first 20 for performance
  };

  // Calculate contrast ratio between two colors
  const calculateContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const l1 = getRelativeLuminance(rgb1);
    const l2 = getRelativeLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Parse CSS color to RGB
  const parseColor = (color: string): [number, number, number] | null => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1);
    
    return [imageData.data[0], imageData.data[1], imageData.data[2]];
  };

  // Calculate relative luminance
  const getRelativeLuminance = ([r, g, b]: [number, number, number]): number => {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLum = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLum = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLum = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
  };

  // ARIA attributes scanner
  const scanAriaAttributes = () => {
    const newIssues: AccessibilityIssue[] = [];
    
    // Check for missing alt text on images
    document.querySelectorAll('img').forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        newIssues.push({
          id: `img-alt-${index}`,
          type: 'error',
          category: 'aria',
          element: 'img',
          description: 'Image missing alt text or aria-label',
          suggestion: 'Add meaningful alt text or aria-label to describe the image',
          wcagLevel: 'A',
          selector: `img:nth-child(${index + 1})`,
        });
      }
    });

    // Check for buttons without accessible names
    document.querySelectorAll('button').forEach((button, index) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledby = button.getAttribute('aria-labelledby');
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
        newIssues.push({
          id: `button-name-${index}`,
          type: 'error',
          category: 'aria',
          element: 'button',
          description: 'Button missing accessible name',
          suggestion: 'Add text content, aria-label, or aria-labelledby to the button',
          wcagLevel: 'A',
          selector: `button:nth-child(${index + 1})`,
        });
      }
    });

    // Check for form inputs without labels
    document.querySelectorAll('input').forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
        newIssues.push({
          id: `input-label-${index}`,
          type: 'error',
          category: 'aria',
          element: 'input',
          description: 'Form input missing label',
          suggestion: 'Associate input with a label element or add aria-label',
          wcagLevel: 'A',
          selector: `input:nth-child(${index + 1})`,
        });
      }
    });

    return newIssues;
  };

  // Keyboard navigation scanner
  const scanKeyboardNavigation = () => {
    const newIssues: AccessibilityIssue[] = [];
    
    // Check for interactive elements without proper tabindex
    document.querySelectorAll('div[onclick], span[onclick]').forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      const role = element.getAttribute('role');
      
      if (!tabIndex && !role) {
        newIssues.push({
          id: `keyboard-${index}`,
          type: 'warning',
          category: 'keyboard',
          element: element.tagName.toLowerCase(),
          description: 'Interactive element not keyboard accessible',
          suggestion: 'Add tabindex="0" and appropriate role, or use semantic HTML elements',
          wcagLevel: 'A',
        });
      }
    });

    return newIssues;
  };

  // Comprehensive accessibility scan
  const runAccessibilityScan = async () => {
    setIsScanning(true);
    
    try {
      const ariaIssues = scanAriaAttributes();
      const keyboardIssues = scanKeyboardNavigation();
      
      setIssues([...ariaIssues, ...keyboardIssues]);
      checkColorContrast();
      
      // Simulate additional checks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Accessibility scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Enable focus visualization
  useEffect(() => {
    if (focusVisible) {
      const style = document.createElement('style');
      style.innerHTML = `
        *:focus {
          outline: 3px solid #007acc !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [focusVisible]);

  // Screen reader mode simulation
  useEffect(() => {
    if (screenReaderMode) {
      document.body.style.filter = 'blur(5px)';
      console.log('Screen Reader Mode: Visual content is blurred. Use tab navigation and screen reader to test.');
      
      return () => {
        document.body.style.filter = '';
      };
    }
  }, [screenReaderMode]);

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: AccessibilityIssue['category']) => {
    switch (category) {
      case 'color-contrast':
        return <Palette className="w-4 h-4" />;
      case 'aria':
        return <Eye className="w-4 h-4" />;
      case 'keyboard':
        return <Keyboard className="w-4 h-4" />;
      case 'focus':
        return <Target className="w-4 h-4" />;
      default:
        return <Scan className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Accessibility Scanner</span>
            <span className={`text-xs px-2 py-1 rounded ${
              stats.score >= 90 ? 'bg-green-100 text-green-800' :
              stats.score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              Score: {stats.score}%
            </span>
          </div>
          
          <button
            onClick={runAccessibilityScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>

        {/* Testing Modes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setFocusVisible(!focusVisible)}
            className={`p-2 rounded text-sm flex items-center gap-2 ${
              focusVisible ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'
            }`}
          >
            <Target className="w-4 h-4" />
            Focus Visible
          </button>
          
          <button
            onClick={() => setScreenReaderMode(!screenReaderMode)}
            className={`p-2 rounded text-sm flex items-center gap-2 ${
              screenReaderMode ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'
            }`}
          >
            <Headphones className="w-4 h-4" />
            Screen Reader
          </button>
          
          <button
            onClick={() => setKeyboardNavMode(!keyboardNavMode)}
            className={`p-2 rounded text-sm flex items-center gap-2 ${
              keyboardNavMode ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Keyboard Nav
          </button>
          
          <button
            onClick={checkColorContrast}
            className="p-2 bg-white border border-gray-300 rounded text-sm flex items-center gap-2 hover:bg-gray-50"
          >
            <Palette className="w-4 h-4" />
            Check Contrast
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border border-gray-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalChecks}</div>
          <div className="text-sm text-gray-600">Total Checks</div>
        </div>
        <div className="p-3 border border-green-200 bg-green-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{stats.passed}</div>
          <div className="text-sm text-green-600">Passed</div>
        </div>
        <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{stats.warnings}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{stats.errors}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
      </div>

      {/* Issues List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Accessibility Issues ({issues.length})</h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {issues.map(issue => (
              <div
                key={issue.id}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedIssue?.id === issue.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getIssueIcon(issue.type)}
                  {getCategoryIcon(issue.category)}
                  <span className="font-medium text-sm">{issue.element}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    WCAG {issue.wcagLevel}
                  </span>
                </div>
                <div className="text-sm text-gray-800">{issue.description}</div>
              </div>
            ))}
            
            {issues.length === 0 && !isScanning && (
              <div className="p-8 text-center text-gray-500">
                Run an accessibility scan to see issues
              </div>
            )}
            
            {isScanning && (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Scanning for accessibility issues...
              </div>
            )}
          </div>
        </div>

        {/* Issue Details */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Issue Details</h4>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {selectedIssue ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getIssueIcon(selectedIssue.type)}
                  <span className="font-medium">{selectedIssue.description}</span>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm mb-1">Suggestion</h5>
                  <p className="text-sm text-gray-700">{selectedIssue.suggestion}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Element:</strong> {selectedIssue.element}
                  </div>
                  <div>
                    <strong>Category:</strong> {selectedIssue.category}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedIssue.type}
                  </div>
                  <div>
                    <strong>WCAG Level:</strong> {selectedIssue.wcagLevel}
                  </div>
                </div>
                
                {selectedIssue.selector && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">CSS Selector</h5>
                    <code className="text-xs bg-gray-100 p-2 rounded block">
                      {selectedIssue.selector}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select an issue to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color Contrast Results */}
      {colorContrastResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Color Contrast Issues ({colorContrastResults.length})</h4>
          </div>
          <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
            {colorContrastResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 border rounded"
                      style={{ backgroundColor: result.background }}
                    />
                    <div
                      className="w-6 h-6 border rounded"
                      style={{ backgroundColor: result.foreground }}
                    />
                  </div>
                  <span className="text-sm font-mono">
                    Ratio: {result.ratio.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-1 text-xs">
                  <span className={`px-2 py-1 rounded ${result.passes.aa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    AA
                  </span>
                  <span className={`px-2 py-1 rounded ${result.passes.aaa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    AAA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Accessibility Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ensure color contrast ratio of at least 4.5:1 for normal text</li>
          <li>• Provide alternative text for all images</li>
          <li>• Make all interactive elements keyboard accessible</li>
          <li>• Use semantic HTML elements when possible</li>
          <li>• Provide clear focus indicators</li>
          <li>• Test with actual screen readers and keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
};