/**
 * API Key Management Component
 * Provides a user interface for creating, viewing, and managing API keys
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  Shield,
  Calendar,
  Globe,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import APIKeyManagementService, {
  APIKey,
  CreateAPIKeyRequest,
  APIKeyScope,
} from '../services/api-key-management';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface APIKeyManagementProps {
  className?: string;
}

const SCOPE_DESCRIPTIONS: Record<APIKeyScope, string> = {
  read: 'Read access to your data and settings',
  write: 'Write access to modify your data',
  admin: 'Full administrative access (use with caution)',
  parameter_read: 'Read AI model parameters',
  parameter_write: 'Modify AI model parameters',
  analytics_read: 'Access to analytics and reports',
  user_management: 'Manage user accounts and permissions',
};

const ENVIRONMENT_DESCRIPTIONS = {
  development: 'For development and testing',
  staging: 'For staging and pre-production testing',
  production: 'For live production use',
};

const APIKeyManagement: React.FC<APIKeyManagementProps> = ({ className }) => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAPIKeyRequest>({
    name: '',
    scopes: ['read'],
    purpose: '',
    environment: 'production',
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    rateLimitPerDay: 10000,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize API key service
  const apiKeyService = React.useMemo(() => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    return APIKeyManagementService.getInstance(supabase);
  }, []);

  // Load API keys
  const loadAPIKeys = useCallback(async () => {
    if (!user?.id || !apiKeyService) return;

    try {
      setLoading(true);
      const keys = await apiKeyService.listAPIKeys(user.id);
      setApiKeys(keys);
    } catch (err) {
      setError(`Failed to load API keys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, apiKeyService]);

  useEffect(() => {
    loadAPIKeys();
  }, [loadAPIKeys]);

  // Create new API key
  const handleCreateKey = async () => {
    if (!user?.id || !apiKeyService) return;

    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (formData.scopes.length === 0) {
      errors.scopes = 'At least one scope is required';
    }
    if (formData.rateLimitPerMinute! <= 0) {
      errors.rateLimitPerMinute = 'Must be greater than 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const { apiKey, key } = await apiKeyService.createAPIKey(user.id, formData);
      setNewKeyVisible(key);
      setShowCreateDialog(false);

      // Reset form
      setFormData({
        name: '',
        scopes: ['read'],
        purpose: '',
        environment: 'production',
        rateLimitPerMinute: 60,
        rateLimitPerHour: 1000,
        rateLimitPerDay: 10000,
      });
      setFormErrors({});

      // Reload keys
      await loadAPIKeys();
    } catch (err) {
      setError(`Failed to create API key: ${err.message}`);
    }
  };

  // Revoke API key
  const handleRevokeKey = async (keyId: string) => {
    if (!user?.id || !apiKeyService) return;

    if (
      !confirm(
        'Are you sure you want to revoke this API key? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await apiKeyService.revokeAPIKey(user.id, keyId);
      await loadAPIKeys();
    } catch (err) {
      setError(`Failed to revoke API key: ${err.message}`);
    }
  };

  // Rotate API key
  const handleRotateKey = async (keyId: string) => {
    if (!user?.id || !apiKeyService) return;

    if (
      !confirm(
        'Are you sure you want to rotate this API key? The old key will be revoked.'
      )
    ) {
      return;
    }

    try {
      const { key } = await apiKeyService.rotateAPIKey(user.id, keyId);
      setNewKeyVisible(key);
      await loadAPIKeys();
    } catch (err) {
      setError(`Failed to rotate API key: ${err.message}`);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  if (!apiKeyService) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              API key management is not available. Please check your configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6" />
            API Keys
          </h2>
          <p className="text-muted-foreground">
            Manage API keys to access your account programmatically
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="keyName">Name *</Label>
                <Input
                  id="keyName"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My API Key"
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Purpose */}
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose || ''}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Describe what this API key will be used for..."
                  rows={2}
                />
              </div>

              {/* Environment */}
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, environment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENVIRONMENT_DESCRIPTIONS).map(([env, desc]) => (
                      <SelectItem key={env} value={env}>
                        <div>
                          <div className="capitalize font-medium">{env}</div>
                          <div className="text-sm text-muted-foreground">{desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scopes */}
              <div>
                <Label>Permissions *</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {Object.entries(SCOPE_DESCRIPTIONS).map(([scope, description]) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        id={scope}
                        checked={formData.scopes.includes(scope as APIKeyScope)}
                        onCheckedChange={checked => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              scopes: [...formData.scopes, scope as APIKeyScope],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              scopes: formData.scopes.filter(s => s !== scope),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={scope} className="flex flex-col">
                        <span className="font-medium capitalize">
                          {scope.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                {formErrors.scopes && (
                  <p className="text-sm text-destructive mt-1">{formErrors.scopes}</p>
                )}
              </div>

              {/* Rate Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rateLimitMinute">Per Minute</Label>
                  <Input
                    id="rateLimitMinute"
                    type="number"
                    value={formData.rateLimitPerMinute}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rateLimitPerMinute: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="rateLimitHour">Per Hour</Label>
                  <Input
                    id="rateLimitHour"
                    type="number"
                    value={formData.rateLimitPerHour}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rateLimitPerHour: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="rateLimitDay">Per Day</Label>
                  <Input
                    id="rateLimitDay"
                    type="number"
                    value={formData.rateLimitPerDay}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rateLimitPerDay: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey}>Create API Key</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Key Display */}
      {newKeyVisible && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">API Key Created Successfully!</p>
              <p className="text-sm">
                Please copy your API key now. You won't be able to see it again for
                security reasons.
              </p>
              <div className="flex items-center space-x-2 font-mono text-sm bg-white p-3 rounded border">
                <code className="flex-1 break-all">{newKeyVisible}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newKeyVisible)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewKeyVisible(null)}
              >
                I've saved the key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="mb-6 border-destructive">
          <AlertDescription>{error}</AlertDescription>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* API Keys List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No API keys found</p>
                <p className="text-sm text-muted-foreground">
                  Create your first API key to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map(key => (
              <Card key={key.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-lg">{key.keyName}</CardTitle>
                        <CardDescription>
                          {key.keyPrefix}••••••••••••{key.keySuffix}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={key.status === 'active' ? 'default' : 'destructive'}
                      >
                        {key.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRotateKey(key.id)}
                        disabled={key.status !== 'active'}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={key.status !== 'active'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Purpose */}
                  {key.purpose && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Purpose</h4>
                      <p className="text-sm text-muted-foreground">{key.purpose}</p>
                    </div>
                  )}

                  {/* Scopes */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Permissions</h4>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map(scope => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {key.usageCount.toLocaleString()} calls
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {key.rateLimitPerMinute}/min
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground capitalize">
                        {key.environment}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {key.lastUsedAt
                          ? format(key.lastUsedAt, 'MMM d, yyyy')
                          : 'Never used'}
                      </span>
                    </div>
                  </div>

                  {/* Expiration */}
                  {key.expiresAt && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Expires: </span>
                      <span
                        className={
                          key.expiresAt < new Date()
                            ? 'text-destructive'
                            : key.expiresAt <
                                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                        }
                      >
                        {format(key.expiresAt, 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default APIKeyManagement;
