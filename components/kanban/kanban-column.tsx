"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { TemplateCard } from "@/components/kanban/template-card";
import type { Template } from "@/hooks/use-templates";

interface KanbanColumnProps {
  stage: { key: string; label: string; color: string };
  templates: Template[];
}

export function KanbanColumn({ stage, templates }: KanbanColumnProps) {
  return (
    <div className="flex w-70 shrink-0 flex-col rounded-lg bg-slate-50">
      {/* Column header with colored top border */}
      <div
        className="shrink-0 rounded-t-lg border-b border-slate-200 px-3 py-3"
        style={{ borderTop: `4px solid ${stage.color}` }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {stage.label}
          </h3>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: stage.color }}
          >
            {templates.length}
          </span>
        </div>
      </div>

      {/* Scrollable cards area */}
      <ScrollArea className="min-h-0 flex-1 p-2">
        <div className="flex flex-col gap-2">
          {templates.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Nenhum template
            </p>
          ) : (
            templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
