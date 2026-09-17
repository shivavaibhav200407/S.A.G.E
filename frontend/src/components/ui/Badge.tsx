import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-medium gap-1',
    md: 'text-sm px-3 py-1 font-medium gap-1.5',
  };

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    accent: 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30',
    cyan: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30',
    success: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-500/30',
    error: 'bg-rose-950/80 text-rose-300 border border-rose-500/30',
    purple: 'bg-purple-950/80 text-purple-300 border border-purple-500/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
