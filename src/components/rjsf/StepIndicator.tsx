import { FormPage } from '@/services/api/candidaturas/types';
import { cn } from '@/components/ui/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  pages: FormPage[];
  current: number;
}

export function StepIndicator({ pages, current }: StepIndicatorProps) {
  return (
    <div className="relative mb-8">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10" />
      
      <ol className="flex justify-between items-start list-none p-0 m-0">
        {pages.map((page, i) => {
          const isCompleted = i < current;
          const isActive = i === current;
          
          return (
            <li key={page.title} className="flex flex-col items-center group flex-1">
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : isActive
                      ? "bg-background border-primary text-primary shadow-lg shadow-primary/10 scale-110"
                      : "bg-background border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3px]" />
                ) : (
                  <span className="text-sm font-bold">{i + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="mt-3 text-center">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {page.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
