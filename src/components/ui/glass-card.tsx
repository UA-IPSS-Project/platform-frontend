import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from "./utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-card/70 backdrop-blur-md rounded-2xl shadow-lg border border-border/60",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

