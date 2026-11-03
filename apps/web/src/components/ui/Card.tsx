import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export function Card({ className = '', hoverLift = false, children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-obsidian-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm transition-all duration-200 ${
        hoverLift ? 'hover:-translate-y-1 hover:shadow-md hover:border-chizmo-300 dark:hover:border-chizmo-800' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
