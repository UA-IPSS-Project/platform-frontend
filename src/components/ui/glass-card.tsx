import React from 'react';
import { cn } from "./utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

