import React from 'react';
import { cn } from '../ui/utils';
import { User, Briefcase } from 'lucide-react';

interface LightSwitchProps {
    value: 'user' | 'employee';
    onChange: (value: 'user' | 'employee') => void;
    variant?: 'default' | 'subtle';
    className?: string;
}

export function LightSwitch({ value, onChange, variant = 'default', className }: LightSwitchProps) {
    const isEmployee = value === 'employee';

    if (variant === 'subtle') {
        return (
            <div className={cn("relative flex p-1 rounded-full bg-muted/50 border border-border/50 h-10 w-full max-w-[280px]", className)}>
                {/* Sliding Background */}
                <div
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-card shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isEmployee ? "translate-x-full left-1" : "left-1"
                    )}
                />

                {/* User Button */}
                <button
                    type="button"
                    onClick={() => onChange('user')}
                    className={cn(
                        "z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200",
                        !isEmployee ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Utilizador
                </button>

                {/* Employee Button */}
                <button
                    type="button"
                    onClick={() => onChange('employee')}
                    className={cn(
                        "z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200",
                        isEmployee ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Funcionário
                </button>
            </div>
        );
    }

    // Default Variant (Card Style for Register)
    return (
        <div className={cn("relative flex p-1 rounded-full bg-muted border border-border h-12 w-full max-w-md mx-auto", className)}>
            {/* Sliding Background */}
            <div
                className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isEmployee ? "translate-x-full left-1" : "left-1"
                )}
            />

            {/* User Button */}
            <button
                type="button"
                onClick={() => onChange('user')}
                className={cn(
                    "z-10 flex-1 flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200",
                        !isEmployee ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                Utilizador
            </button>

            {/* Employee Button */}
            <button
                type="button"
                onClick={() => onChange('employee')}
                className={cn(
                    "z-10 flex-1 flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200",
                        isEmployee ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                Funcionário
            </button>
        </div>
    );
}
