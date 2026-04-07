import type { HTMLAttributes, ReactNode } from 'react';
import { GlassCard } from '../ui/glass-card';
import { cn } from '../ui/utils';

type CandidaturasCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CandidaturasCard({ children, className, ...props }: CandidaturasCardProps) {
  return (
    <GlassCard className={cn('border-border/60 bg-card/80', className)} {...props}>
      {children}
    </GlassCard>
  );
}