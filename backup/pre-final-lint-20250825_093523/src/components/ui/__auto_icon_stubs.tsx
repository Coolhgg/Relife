/**
 * Auto-generated icon stubs for missing Lucide icons
 * Created by Scout auto-fix process
 * TODO(manual): Import these properly from lucide-react or replace with existing icons
 */

import React from 'react';

// Icon stub component that renders a placeholder
const IconStub: React.FC<{ name: string; className?: string; size?: number }> = ({
  name,
  className = '',
  size = 24,
}) => (
  <div
    className={`inline-block ${className}`}
    style={{
      width: size,
      height: size,
      border: '1px dashed #ccc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
    }}
    title={`TODO: Replace with ${name} icon from lucide-react`}
  >
    {name.slice(0, 2)}
  </div>
);

// Missing Lucide icon stubs
export const Heart: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="Heart" {...props} />
);

export const Lightbulb: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="Lightbulb" {...props} />
);

export const Loader2: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="Loader2" {...props} />
);

export const MessageSquare: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="MessageSquare" {...props} />
);

export const Sparkles: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="Sparkles" {...props} />
);

export const TrendingUp: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="TrendingUp" {...props} />
);

export const Users: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="Users" {...props} />
);

export const Zap: React.FC<{ className?: string; size?: number }> = props => (
  <IconStub name="Zap" {...props} />
);
