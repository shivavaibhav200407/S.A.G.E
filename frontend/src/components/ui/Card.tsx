import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'none' | 'accent' | 'cyan';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glow = 'none',
  className = '',
  ...props
}) => {
  const glowStyles = {
    none: '',
    accent: 'border-indigo-500/30 shadow-glow-accent',
    cyan: 'border-cyan-500/30 shadow-glow-cyan',
  };

  return (
    <div
      className={`bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 ${
        hoverEffect ? 'hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl' : ''
      } ${glowStyles[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
