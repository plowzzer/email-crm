"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_STYLES } from "@/lib/constants";
import type { Template } from "@/hooks/use-templates";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/templates/${template.id}`}>
      <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm transition hover:shadow-md">
        {/* IDs + Update indicator */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className={`text-sm font-bold ${template.templateId ? "text-foreground" : "text-muted-foreground italic"}`}>
            {template.templateId ?? "Sem ID"}
          </span>
          {template.isUpdate && (
            <span
              className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "#fffbeb",
                color: "#d97706",
                border: "1px solid #fde68a",
              }}
            >
              [Update]
            </span>
          )}
        </div>

        {/* Name */}
        <p className="mb-2 truncate text-sm text-foreground">{template.name}</p>

        {/* Channel badges */}
        <div className="mb-2 flex flex-wrap gap-1">
          {template.channels.map((channel) => {
            const style = CHANNEL_STYLES[channel.type];
            return (
              <Badge
                key={channel.type}
                variant="outline"
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={
                  style
                    ? {
                        backgroundColor: style.bg,
                        color: style.text,
                        borderColor: style.border,
                      }
                    : undefined
                }
              >
                {channel.type}
              </Badge>
            );
          })}
        </div>

        {/* Owner + Days */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {template.owner}
          </span>
          {template.days > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {template.days}d
            </span>
          )}
        </div>

        {/* Pipeline tags */}
        {template.pipelines.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {template.pipelines.map((pipelineKey) => (
              <span
                key={pipelineKey}
                className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
              >
                {pipelineKey}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
