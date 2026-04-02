"use client";

import { useAppContext } from "@/providers/context-provider";
import { useTemplates, type Template } from "@/hooks/use-templates";
import { useTeams } from "@/hooks/use-teams";
import { CHANNEL_STYLES, CHANNEL_TYPES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { Search, BookOpen } from "lucide-react";

export default function CatalogoPage() {
  const { selectedTeam, selectedPipeline } = useAppContext();
  const { data: teams = [] } = useTeams();

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("__all__");

  // Determine pipeline keys to filter
  const pipelineKeys: string[] = (() => {
    if (!selectedTeam) return [];
    const team = teams.find((t) => t.key === selectedTeam);
    if (!team) return [];
    if (selectedPipeline && selectedPipeline !== "__all__") {
      return [selectedPipeline];
    }
    return team.pipelines.map((p) => p.key);
  })();

  const { data: templates = [], isLoading } = useTemplates({
    status: "production",
    pipelines: pipelineKeys,
  });

  // Build a lookup from pipeline key to label
  const pipelineLabelMap: Record<string, string> = {};
  teams.forEach((team) => {
    team.pipelines.forEach((p) => {
      pipelineLabelMap[p.key] = p.label;
    });
  });

  // Client-side filtering
  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(q);
      const matchesInternalId = template.internalId.toLowerCase().includes(q);
      const matchesTemplateId =
        template.templateId?.toLowerCase().includes(q) ?? false;
      if (!matchesName && !matchesInternalId && !matchesTemplateId) {
        return false;
      }
    }

    // Channel filter
    if (channelFilter && channelFilter !== "__all__") {
      const hasChannel = template.channels.some(
        (ch) => ch.type === channelFilter
      );
      if (!hasChannel) return false;
    }

    return true;
  });

  // No team selected state
  if (!selectedTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-muted-foreground">
          Selecione um time
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um time no seletor acima para visualizar o catálogo de
          templates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-slate-700" />
        <h1 className="text-2xl font-bold text-slate-900">
          Catálogo de Templates
        </h1>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID interno ou ID externo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value ?? "__all__")}>
          <SelectTrigger className="w-50">
            <SelectValue placeholder="Todos os canais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos os canais</SelectItem>
            {CHANNEL_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} templates em produção
        </p>
      )}

      {/* Empty state */}
      {!isLoading && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum template encontrado no catálogo
          </p>
        </div>
      )}

      {/* Grid of cards */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.id}`}
              className="block"
            >
              <Card className="border border-[#e2e8f0] bg-white p-4 shadow-sm transition hover:shadow-md rounded-lg">
                <CardContent className="p-0 space-y-3">
                  {/* IDs */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${template.templateId ? "text-slate-900" : "text-slate-400 italic"}`}>
                      {template.templateId ?? "Sem ID"}
                    </span>
                  </div>

                  {/* Name + Update badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {template.isUpdate && (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium"
                        style={{
                          backgroundColor: "#fffbeb",
                          color: "#d97706",
                          borderColor: "#fde68a",
                        }}
                      >
                        [Update]
                      </Badge>
                    )}
                    <span className="text-sm font-medium text-slate-800 leading-tight">
                      {template.name}
                    </span>
                  </div>

                  {/* Channel badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {template.channels.map((ch) => {
                      const style = CHANNEL_STYLES[ch.type];
                      return (
                        <Badge
                          key={ch.type}
                          variant="outline"
                          className="text-xs font-medium"
                          style={{
                            backgroundColor: style?.bg,
                            color: style?.text,
                            borderColor: style?.border,
                          }}
                        >
                          {ch.type}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Pipeline tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {template.pipelines.map((pKey) => (
                      <Badge
                        key={pKey}
                        variant="secondary"
                        className="text-xs text-muted-foreground"
                      >
                        {pipelineLabelMap[pKey] || pKey}
                      </Badge>
                    ))}
                  </div>

                  {/* Production date */}
                  {template.date && (
                    <p className="text-xs text-muted-foreground">
                      Em produção desde: {template.date}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
