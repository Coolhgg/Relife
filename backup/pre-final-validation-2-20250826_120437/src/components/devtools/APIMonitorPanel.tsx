/**
 * API Monitor Panel - Track API Calls and Responses
 *
 * Monitors and displays:
 * - HTTP requests and responses
 * - Request/response times
 * - Error tracking
 * - Response status codes
 * - Request payloads and headers
 * - Mock API responses for testing
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Trash2,
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';

interface APICall {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  status: number;
  statusText: string;
  duration: number;
  timestamp: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

interface APIStats {
  total: number;
  success: number;
  errors: number;
  pending: number;
  averageResponseTime: number;
}

export const APIMonitorPanel: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<APICall[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedCall, setSelectedCall] = useState<APICall | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'success' | 'error' | 'pending'
  >('all');
  const [filterMethod, setFilterMethod] = useState<
    'all' | 'GET' | 'POST' | 'PUT' | 'DELETE'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');

  const originalFetchRef = useRef<typeof fetch>();
  const pendingRequests = useRef<Map<string, number>>(new Map());

  // Intercept fetch calls
  useEffect(() => {
    if (!isMonitoring) return;

    // Store original fetch
    if (!originalFetchRef.current) {
      originalFetchRef.current = window.fetch;
    }

    // Create intercepted fetch
    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const url = input instanceof Request ? input.url : input.toString();
      const method = (init?.method || 'GET').toUpperCase() as APICall['method'];
      const requestId = `${Date.now()}-${Math.random()}`;

      const startTime = performance.now();
      pendingRequests.current.set(requestId, startTime);

      try {
        const requestHeaders: Record<string, string> = {};
        if (init?.headers) {
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        }

        const response = await originalFetchRef.current!(input, init);
        const endTime = performance.now();
        const duration = endTime - startTime;

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseBody;
        try {
          const clonedResponse = response.clone();
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            responseBody = await clonedResponse.json();
          } else {
            responseBody = await clonedResponse.text();
          }
        } catch (error) {
          responseBody = 'Unable to parse response body';
        }

        const apiCall: APICall = {
          id: requestId,
          method,
          url,
          status: response.status,
          statusText: response.statusText,
          duration,
          timestamp: Date.now(),
          requestHeaders,
          responseHeaders,
          requestBody: init?.body ? JSON.stringify(init.body) : undefined,
          responseBody,
        };

        setApiCalls(prev => [apiCall, ...prev.slice(0, 99)]); // Keep last 100 calls
        pendingRequests.current.delete(requestId);

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const apiCall: APICall = {
          id: requestId,
          method,
          url,
          status: 0,
          statusText: 'Network Error',
          duration,
          timestamp: Date.now(),
          requestHeaders: {},
          responseHeaders: {},
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        setApiCalls(prev => [apiCall, ...prev.slice(0, 99)]);
        pendingRequests.current.delete(requestId);

        throw error;
      }
    };

    return () => {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
    };
  }, [isMonitoring]);

  // Calculate stats
  const stats: APIStats = React.useMemo(() => {
    const success = apiCalls.filter(
      call => call.status >= 200 && call.status < 300
    ).length;
    const errors = apiCalls.filter(
      call => call.status >= 400 || call.status === 0
    ).length;
    const pending = pendingRequests.current.size;
    const avgTime =
      apiCalls.length > 0
        ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
        : 0;

    return {
      total: apiCalls.length,
      success,
      errors,
      pending,
      averageResponseTime: avgTime,
    };
  }, [apiCalls]);

  // Filter API calls
  const filteredCalls = apiCalls.filter(call => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'success' && (call.status < 200 || call.status >= 300))
        return false;
      if (filterStatus === 'error' && call.status < 400 && call.status !== 0)
        return false;
      if (filterStatus === 'pending' && !pendingRequests.current.has(call.id))
        return false;
    }

    if (filterMethod !== 'all' && call.method !== filterMethod) return false;

    if (searchTerm && !call.url.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;

    return true;
  });

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-red-600 bg-red-100';
    if (status < 200) return 'text-blue-600 bg-blue-100';
    if (status < 300) return 'text-green-600 bg-green-100';
    if (status < 400) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-blue-600 bg-blue-100',
      POST: 'text-green-600 bg-green-100',
      PUT: 'text-orange-600 bg-orange-100',
      DELETE: 'text-red-600 bg-red-100',
      PATCH: 'text-purple-600 bg-purple-100',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const exportData = () => {
    const data = JSON.stringify(apiCalls, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-calls-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe
              className={`w-5 h-5 ${isMonitoring ? 'text-green-500' : 'text-gray-400'}`}
            />
            <span className="font-medium">API Monitor</span>
            <span
              className={`text-xs px-2 py-1 rounded ${isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
            >
              {isMonitoring ? 'INTERCEPTING' : 'PAUSED'}
            </span>
          </div>

          <input
            type="text"
            placeholder="Filter by URL..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-2 rounded ${isMonitoring ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
            title={isMonitoring ? 'Pause monitoring' : 'Resume monitoring'}
          >
            {isMonitoring ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setApiCalls([])}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={exportData}
            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            title="Export data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-3 border border-gray-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="p-3 border border-green-200 bg-green-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{stats.success}</div>
          <div className="text-sm text-green-600">Success</div>
        </div>
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{stats.errors}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
        <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">
            {stats.averageResponseTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-blue-600">Avg Time</div>
        </div>
      </div>

      {/* API Calls List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calls List */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">API Calls ({filteredCalls.length})</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredCalls.map(call => (
              <div
                key={call.id}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedCall?.id === call.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedCall(call)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${getMethodColor(call.method)}`}
                    >
                      {call.method}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(call.status)}`}
                    >
                      {call.status || 'ERR'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {call.duration.toFixed(0)}ms
                  </div>
                </div>

                <div className="text-sm font-mono text-gray-800 truncate">
                  {call.url.replace(/^https?:\/\/[^\/]+/, '')}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {new Date(call.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {filteredCalls.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No API calls match the current filters
              </div>
            )}
          </div>
        </div>

        {/* Call Details */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Request Details</h4>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {selectedCall ? (
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Request Info</h5>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>URL:</strong> {selectedCall.url}
                    </div>
                    <div>
                      <strong>Method:</strong> {selectedCall.method}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedCall.status}{' '}
                      {selectedCall.statusText}
                    </div>
                    <div>
                      <strong>Duration:</strong> {selectedCall.duration.toFixed(2)}ms
                    </div>
                    <div>
                      <strong>Time:</strong>{' '}
                      {new Date(selectedCall.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {Object.keys(selectedCall.requestHeaders).length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Request Headers</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                      {Object.entries(selectedCall.requestHeaders).map(
                        ([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {value}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedCall.requestBody && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Request Body</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      <pre>
                        {typeof selectedCall.requestBody === 'string'
                          ? selectedCall.requestBody
                          : JSON.stringify(selectedCall.requestBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {Object.keys(selectedCall.responseHeaders).length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Response Headers</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                      {Object.entries(selectedCall.responseHeaders).map(
                        ([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {value}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedCall.responseBody && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Response Body</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      <pre>
                        {typeof selectedCall.responseBody === 'string'
                          ? selectedCall.responseBody
                          : JSON.stringify(selectedCall.responseBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedCall.error && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-red-600">Error</h5>
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-sm text-red-800">
                      {selectedCall.error}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select an API call to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
