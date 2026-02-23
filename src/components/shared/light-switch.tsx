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
            <div className={cn("relative flex p-1 rounded-full bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 h-10 w-full max-w-[280px]", className)}>
                {/* Sliding Background */}
                <div
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-700 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isEmployee ? "translate-x-full left-1" : "left-1"
                    )}
                />

                {/* User Button */}
                <button
                    type="button"
                    onClick={() => onChange('user')}
                    className={cn(
                        "z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200",
                        !isEmployee ? "text-purple-700 dark:text-purple-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                >
                    <User className="w-3.5 h-3.5" />
                    Utilizador
                </button>

                {/* Employee Button */}
                <button
                    type="button"
                    onClick={() => onChange('employee')}
                    className={cn(
                        "z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200",
                        isEmployee ? "text-purple-700 dark:text-purple-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                >
                    <Briefcase className="w-3.5 h-3.5" />
                    Funcionário
                </button>
            </div>
        );
    }

    // Default Variant (Card Style for Register)
    return (
        <div className={cn("relative flex p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-12 w-full max-w-md mx-auto", className)}>
            {/* Sliding Background */}
            <div
                className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-purple-600 shadow-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isEmployee ? "translate-x-full left-1" : "left-1"
                )}
            />

            {/* User Button */}
            <button
                type="button"
                onClick={() => onChange('user')}
                className={cn(
                    "z-10 flex-1 flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200",
                    !isEmployee ? "text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
            >
                <User className="w-4 h-4" />
                Utilizador
            </button>

            {/* Employee Button */}
            <button
                type="button"
                onClick={() => onChange('employee')}
                className={cn(
                    "z-10 flex-1 flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200",
                    isEmployee ? "text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
            >
                <Briefcase className="w-4 h-4" />
                Funcionário
            </button>
        </div>
    );
}
