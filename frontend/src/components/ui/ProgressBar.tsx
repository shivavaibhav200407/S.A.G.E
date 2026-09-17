import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  color?: 'accent' | 'cyan' | 'success' | 'warning';
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  color = 'accent',
  size = 'md',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const colorStyles = {
    accent: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-slate-300">
          {label && <span className="font-medium">{label}</span>}
          {showPercent && <span className="text-slate-400 font-mono">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
