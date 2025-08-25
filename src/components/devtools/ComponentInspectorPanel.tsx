/**
 * Component Inspector Panel - React Component Debugging
 * 
 * Provides tools for inspecting React components:
 * - Component tree visualization
 * - Props and state inspection
 * - Render count tracking
 * - Performance profiling
 * - Component lifecycle monitoring
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  ChevronRight,
  ChevronDown,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Target,
} from 'lucide-react';

interface ComponentInfo {
  name: string;
  id: string;
  type: 'component' | 'element';
  props: Record<string, any>;
  state?: Record<string, any>;
  children: ComponentInfo[];
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  isExpanded?: boolean;
  depth: number;
  parent?: ComponentInfo;
}

interface ComponentStats {
  totalComponents: number;
  totalRenders: number;
  slowestComponent: string;
  fastestComponent: string;
  averageRenderTime: number;
}

export const ComponentInspectorPanel: React.FC = () => {
  const [componentTree, setComponentTree] = useState<ComponentInfo[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTracking, setIsTracking] = useState(true);
  const [highlightRenders, setHighlightRenders] = useState(false);
  const [showOnlyComponents, setShowOnlyComponents] = useState(true);
  
  const renderCountMapRef = useRef<Map<string, { count: number; times: number[] }>>(new Map());
  const observerRef = useRef<MutationObserver>();

  // Track React components in the DOM
  useEffect(() => {
    if (!isTracking) return;

    const trackComponents = () => {
      const components: ComponentInfo[] = [];
      const componentMap = new Map<string, ComponentInfo>();

      // Find React components by looking for React Fiber nodes
      const findReactComponents = (node: Element, depth = 0): ComponentInfo[] => {
        const nodeComponents: ComponentInfo[] = [];
        
        // Check if this element has React fiber data
        const fiberKey = Object.keys(node).find(key => 
          key.startsWith('__reactInternalInstance') || 
          key.startsWith('__reactFiber') ||
          key.startsWith('_reactInternalFiber')
        );

        if (fiberKey) {
          const fiber = (node as any)[fiberKey];
          if (fiber && fiber.type && typeof fiber.type === 'function') {
            const componentName = fiber.type.displayName || fiber.type.name || 'Unknown';
            const componentId = `${componentName}-${Date.now()}-${Math.random()}`;
            
            const renderStats = renderCountMapRef.current.get(componentName) || { count: 0, times: [] };
            
            const componentInfo: ComponentInfo = {
              name: componentName,
              id: componentId,
              type: 'component',
              props: fiber.memoizedProps || {},
              state: fiber.memoizedState,
              children: [],
              renderCount: renderStats.count,
              lastRenderTime: renderStats.times[renderStats.times.length - 1] || 0,
              averageRenderTime: renderStats.times.length > 0 
                ? renderStats.times.reduce((a, b) => a + b, 0) / renderStats.times.length 
                : 0,
              totalRenderTime: renderStats.times.reduce((a, b) => a + b, 0),
              depth,
              isExpanded: false,
            };

            nodeComponents.push(componentInfo);
            componentMap.set(componentId, componentInfo);
          }
        }

        // Recursively check children (limit depth to prevent performance issues)
        if (depth < 10) {
          Array.from(node.children).forEach(child => {
            const childComponents = findReactComponents(child as Element, depth + 1);
            if (nodeComponents.length > 0) {
              nodeComponents[nodeComponents.length - 1].children.push(...childComponents);
            } else {
              nodeComponents.push(...childComponents);
            }
          });
        }

        return nodeComponents;
      };

      // Start from root element
      const rootElement = document.getElementById('root') || document.body;
      const foundComponents = findReactComponents(rootElement);
      
      setComponentTree(foundComponents);
    };

    // Initial scan
    trackComponents();

    // Set up mutation observer to track changes
    observerRef.current = new MutationObserver(() => {
      trackComponents();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isTracking]);

  // Track render performance
  useEffect(() => {
    if (!isTracking) return;

    // Hook into React DevTools if available
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      const onCommitFiberRoot = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = (...args: any[]) => {
        const [id, root, commitTime] = args;
        
        // Track render times
        const updateRenderStats = (fiber: any, startTime: number) => {
          if (fiber && fiber.type && typeof fiber.type === 'function') {
            const componentName = fiber.type.displayName || fiber.type.name;
            const renderTime = performance.now() - startTime;
            
            const stats = renderCountMapRef.current.get(componentName) || { count: 0, times: [] };
            stats.count++;
            stats.times.push(renderTime);
            
            // Keep only last 50 render times for memory efficiency
            if (stats.times.length > 50) {
              stats.times.shift();
            }
            
            renderCountMapRef.current.set(componentName, stats);
          }
          
          // Recursively update child components
          if (fiber.child) {
            updateRenderStats(fiber.child, startTime);
          }
          if (fiber.sibling) {
            updateRenderStats(fiber.sibling, startTime);
          }
        };

        if (root && root.current) {
          updateRenderStats(root.current, commitTime);
        }
        
        return onCommitFiberRoot?.(...args);
      };

      return () => {
        hook.onCommitFiberRoot = onCommitFiberRoot;
      };
    }
  }, [isTracking]);

  // Highlight renders effect
  useEffect(() => {
    if (!highlightRenders) return;

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes componentRender {
        0% { background-color: rgba(255, 0, 0, 0.3) !important; }
        100% { background-color: transparent !important; }
      }
      
      .react-component-render {
        animation: componentRender 1s ease-out !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [highlightRenders]);

  // Calculate component stats
  const stats: ComponentStats = React.useMemo(() => {
    const flattenComponents = (components: ComponentInfo[]): ComponentInfo[] => {
      return components.reduce((acc, comp) => {
        return [...acc, comp, ...flattenComponents(comp.children)];
      }, [] as ComponentInfo[]);
    };

    const allComponents = flattenComponents(componentTree);
    const totalRenders = Array.from(renderCountMapRef.current.values())
      .reduce((sum, stats) => sum + stats.count, 0);
    
    const renderTimes = Array.from(renderCountMapRef.current.entries())
      .filter(([_, stats]) => stats.times.length > 0);
    
    const slowest = renderTimes.reduce((max, [name, stats]) => {
      const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
      return avgTime > (max.time || 0) ? { name, time: avgTime } : max;
    }, { name: 'None', time: 0 });

    const fastest = renderTimes.reduce((min, [name, stats]) => {
      const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
      return avgTime < (min.time || Infinity) ? { name, time: avgTime } : min;
    }, { name: 'None', time: Infinity });

    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, [_, stats]) => {
          return sum + (stats.times.reduce((a, b) => a + b, 0) / stats.times.length);
        }, 0) / renderTimes.length
      : 0;

    return {
      totalComponents: allComponents.length,
      totalRenders,
      slowestComponent: slowest.name,
      fastestComponent: fastest.name,
      averageRenderTime,
    };
  }, [componentTree, renderCountMapRef.current]);

  // Filter components based on search
  const filterComponents = (components: ComponentInfo[], term: string): ComponentInfo[] => {
    return components.filter(comp => {
      const matchesSearch = comp.name.toLowerCase().includes(term.toLowerCase());
      const filteredChildren = filterComponents(comp.children, term);
      
      return matchesSearch || filteredChildren.length > 0;
    }).map(comp => ({
      ...comp,
      children: filterComponents(comp.children, term),
    }));
  };

  const filteredTree = searchTerm 
    ? filterComponents(componentTree, searchTerm)
    : componentTree;

  const toggleComponentExpansion = (componentId: string) => {
    const updateExpansion = (components: ComponentInfo[]): ComponentInfo[] => {
      return components.map(comp => ({
        ...comp,
        isExpanded: comp.id === componentId ? !comp.isExpanded : comp.isExpanded,
        children: updateExpansion(comp.children),
      }));
    };

    setComponentTree(updateExpansion(componentTree));
  };

  const renderComponentTree = (components: ComponentInfo[]) => {
    return components.map(component => (
      <div key={component.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
            selectedComponent?.id === component.id ? 'bg-blue-100 border border-blue-300' : ''
          }`}
          style={{ paddingLeft: `${component.depth * 16 + 8}px` }}
          onClick={() => setSelectedComponent(component)}
        >
          {component.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleComponentExpansion(component.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {component.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          <Package className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-sm">{component.name}</span>
          
          {component.renderCount > 0 && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {component.renderCount}
            </span>
          )}
          
          {component.averageRenderTime > 16 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              Slow
            </span>
          )}
        </div>
        
        {component.isExpanded && component.children.length > 0 && (
          <div>
            {renderComponentTree(component.children)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Component Inspector</span>
            <span className={`text-xs px-2 py-1 rounded ${isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {isTracking ? 'TRACKING' : 'PAUSED'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`p-2 rounded ${isTracking ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
              title={isTracking ? 'Stop tracking' : 'Start tracking'}
            >
              {isTracking ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={highlightRenders}
              onChange={(e) => setHighlightRenders(e.target.checked)}
            />
            Highlight Renders
          </label>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyComponents}
              onChange={(e) => setShowOnlyComponents(e.target.checked)}
            />
            Components Only
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border border-gray-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalComponents}</div>
          <div className="text-sm text-gray-600">Components</div>
        </div>
        <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{stats.totalRenders}</div>
          <div className="text-sm text-blue-600">Total Renders</div>
        </div>
        <div className="p-3 border border-green-200 bg-green-50 rounded-lg text-center">
          <div className="text-lg font-bold text-green-800">{stats.averageRenderTime.toFixed(1)}ms</div>
          <div className="text-sm text-green-600">Avg Render</div>
        </div>
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-center">
          <div className="text-sm font-bold text-red-800 truncate">{stats.slowestComponent}</div>
          <div className="text-sm text-red-600">Slowest</div>
        </div>
      </div>

      {/* Component Tree and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Component Tree */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Component Tree ({filteredTree.length})</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredTree.length > 0 ? (
              renderComponentTree(filteredTree)
            ) : (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No components match the search' : 'No components detected'}
              </div>
            )}
          </div>
        </div>

        {/* Component Details */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Component Details</h4>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {selectedComponent ? (
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Component Info</h5>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedComponent.name}</div>
                    <div><strong>Type:</strong> {selectedComponent.type}</div>
                    <div><strong>Renders:</strong> {selectedComponent.renderCount}</div>
                    <div><strong>Avg Render Time:</strong> {selectedComponent.averageRenderTime.toFixed(2)}ms</div>
                    <div><strong>Total Render Time:</strong> {selectedComponent.totalRenderTime.toFixed(2)}ms</div>
                    <div><strong>Children:</strong> {selectedComponent.children.length}</div>
                  </div>
                </div>

                {Object.keys(selectedComponent.props).length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Props</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      <pre>{JSON.stringify(selectedComponent.props, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {selectedComponent.state && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">State</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      <pre>{JSON.stringify(selectedComponent.state, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      console.log('Component Details:', selectedComponent);
                    }}
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Log to Console
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a component to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Performance Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use React.memo() for components that render frequently with same props</li>
          <li>• Optimize expensive calculations with useMemo()</li>
          <li>• Avoid creating objects/functions in render methods</li>
          <li>• Use useCallback() for event handlers passed to child components</li>
          <li>• Consider code splitting for large components</li>
          <li>• Monitor render counts and times to identify performance bottlenecks</li>
        </ul>
      </div>
    </div>
  );
};