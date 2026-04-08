import React from 'react';
import { cn } from "../../ui/utils";
import { GlassCard } from "../../ui/glass-card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CatalogSectionProps {
  title: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  onDeleteCategory?: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function CatalogSection({
  title,
  count,
  isOpen,
  onToggle,
  onDeleteCategory,
  children,
  actions
}: CatalogSectionProps) {
  return (
    <GlassCard className={cn(
      "border-border/40 transition-all duration-500 relative focus-within:z-50",
      isOpen ? "shadow-2xl ring-1 ring-primary/10 overflow-visible z-10" : "shadow-sm opacity-90 overflow-hidden z-0"
    )}>
      <div 
        className={cn(
          "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors",
          isOpen && "bg-muted/40 border-b border-border/40"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            isOpen ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
          )}>
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-lg tracking-tight uppercase">{title}</h3>
            {count !== undefined && (
              <p className="text-xs text-muted-foreground font-medium">
                {count} {count === 1 ? 'item' : 'itens'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
          {onDeleteCategory && (
            <button
              onClick={onDeleteCategory}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Remover Categoria"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className={cn("transition-[overflow] duration-500", isOpen ? "overflow-visible" : "overflow-hidden")}>
          <div className="p-6 space-y-6 bg-gradient-to-b from-transparent to-accent/5">
            {children}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
