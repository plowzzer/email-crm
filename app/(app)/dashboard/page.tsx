"use client";

import { useMemo } from "react";
import { useAppContext } from "@/providers/context-provider";
import { useTemplates, type Template } from "@/hooks/use-templates";
import { useTeams } from "@/hooks/use-teams";
import { getStages } from "@/lib/get-stages";
import { CHANNEL_STYLES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BarChart3, Clock, CheckCircle, Layers } from "lucide-react";

const CHANNEL_TYPES = ["Email", "SMS", "Push", "WhatsApp"] as const;

function parseDate(dateStr: string): Date {
  // Handle DD/MM/YYYY format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  return new Date(dateStr);
}

function daysBetween(dateA: string, dateB: string): number {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  return Math.abs(Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const { selectedTeam, selectedPipeline } = useAppContext();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();

  // Determine which pipeline keys to filter by
  const pipelineFilter = useMemo(() => {
    if (selectedPipeline && selectedPipeline !== "__all__") {
      return [selectedPipeline];
    }
    if (selectedTeam) {
      const team = teams.find((t) => t.key === selectedTeam);
      return team?.pipelines.map((p) => p.key) ?? [];
    }
    return [];
  }, [selectedTeam, selectedPipeline, teams]);

  // Fetch active templates (inProgress)
  const { data: activeTemplates = [], isLoading: activeLoading } = useTemplates(
    pipelineFilter.length > 0
      ? { pipelines: pipelineFilter, status: "inProgress" }
      : { status: "inProgress" }
  );

  // Fetch all templates (for channel counts and production list)
  const { data: allTemplates = [], isLoading: allLoading } = useTemplates(
    pipelineFilter.length > 0 ? { pipelines: pipelineFilter } : {}
  );

  // Get stages for the selected pipeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stages = useMemo(
    () => getStages(teams as any, selectedTeam, selectedPipeline),
    [teams, selectedTeam, selectedPipeline]
  );

  // Stage counters: count active templates per stage
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const stage of stages) {
      counts[stage.key] = 0;
    }
    for (const tpl of activeTemplates) {
      if (counts[tpl.stage] !== undefined) {
        counts[tpl.stage]++;
      }
    }
    return counts;
  }, [stages, activeTemplates]);

  // Channel counters: count templates that have at least one channel of each type
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of CHANNEL_TYPES) {
      counts[type] = 0;
    }
    for (const tpl of allTemplates) {
      const channelTypesInTemplate = new Set(tpl.channels.map((ch) => ch.type));
      for (const type of CHANNEL_TYPES) {
        if (channelTypesInTemplate.has(type)) {
          counts[type]++;
        }
      }
    }
    return counts;
  }, [allTemplates]);

  // Recently in production: last 5 templates with status=production, sorted by date
  const recentProduction = useMemo(() => {
    const productionTemplates = allTemplates.filter(
      (t) => t.status === "production"
    );

    return productionTemplates
      .sort((a, b) => {
        // Sort by date descending (most recent first)
        // Try to find the last transition to "producao"
        const dateA = getProductionDate(a);
        const dateB = getProductionDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return parseDate(dateB).getTime() - parseDate(dateA).getTime();
      })
      .slice(0, 5);
  }, [allTemplates]);

  // Average time per stage: compute from transitions
  const avgTimePerStage = useMemo(() => {
    const stageDurations: Record<string, number[]> = {};
    for (const stage of stages) {
      stageDurations[stage.key] = [];
    }

    for (const tpl of allTemplates) {
      const transitions = tpl.transitions;
      if (!transitions || transitions.length < 2) continue;

      for (let i = 0; i < transitions.length - 1; i++) {
        const current = transitions[i];
        const next = transitions[i + 1];
        const stageKey = current.to;

        if (stageDurations[stageKey] !== undefined && current.date && next.date) {
          const days = daysBetween(current.date, next.date);
          stageDurations[stageKey].push(days);
        }
      }
    }

    const averages: Record<string, number | null> = {};
    for (const stage of stages) {
      const durations = stageDurations[stage.key];
      if (durations && durations.length > 0) {
        averages[stage.key] = Math.round(
          durations.reduce((sum, d) => sum + d, 0) / durations.length
        );
      } else {
        averages[stage.key] = null;
      }
    }
    return averages;
  }, [stages, allTemplates]);

  // Context label for subtitle
  const contextLabel = useMemo(() => {
    if (!selectedTeam) return null;
    const team = teams.find((t) => t.key === selectedTeam);
    if (!team) return null;
    if (selectedPipeline && selectedPipeline !== "__all__") {
      const pipeline = team.pipelines.find((p) => p.key === selectedPipeline);
      return `${team.label} / ${pipeline?.label ?? selectedPipeline}`;
    }
    return `${team.label} / Todas as pipelines`;
  }, [selectedTeam, selectedPipeline, teams]);

  const isLoading = teamsLoading || activeLoading || allLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Layers className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">
          Selecione um time no seletor acima para visualizar o dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        {contextLabel && (
          <p className="text-sm text-muted-foreground mt-1">{contextLabel}</p>
        )}
      </div>

      {/* Stage counters row */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Templates ativos por etapa
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {stages.map((stage) => (
            <Card key={stage.key} className="relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: stage.color }}
              />
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                  {stage.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stageCounts[stage.key] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Channel counters row */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Templates por canal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CHANNEL_TYPES.map((type) => {
            const style = CHANNEL_STYLES[type];
            return (
              <Card key={type}>
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      {type}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5"
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        borderColor: style.border,
                      }}
                    >
                      {type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{channelCounts[type] ?? 0}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recently in production */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Recentemente em produção
        </h2>
        {recentProduction.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum template em produção encontrado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">Canais</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProduction.map((tpl) => (
                      <tr key={tpl.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs font-medium ${tpl.templateId ? "" : "text-muted-foreground italic"}`}>
                            {tpl.templateId ?? "Sem ID"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/templates/${tpl.id}`}
                            className="text-sm font-medium text-foreground hover:text-blue-600 hover:underline"
                          >
                            {tpl.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {tpl.channels.map((ch) => {
                              const chStyle = CHANNEL_STYLES[ch.type];
                              return (
                                <Badge
                                  key={ch.type}
                                  variant="outline"
                                  className="text-[10px] px-1.5"
                                  style={
                                    chStyle
                                      ? {
                                          backgroundColor: chStyle.bg,
                                          color: chStyle.text,
                                          borderColor: chStyle.border,
                                        }
                                      : undefined
                                  }
                                >
                                  {ch.type}
                                </Badge>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {getProductionDate(tpl) ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Average time per stage */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Tempo médio por etapa (dias)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {stages.map((stage) => {
            const avg = avgTimePerStage[stage.key];
            return (
              <Card key={stage.key} className="relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: stage.color }}
                />
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                    {stage.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {avg !== null ? avg : "-"}
                  </p>
                  {avg !== null && (
                    <p className="text-[10px] text-muted-foreground">dias</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** Get the date a template arrived in production from its transitions or date field */
function getProductionDate(tpl: Template): string | null {
  // First try to find the last transition to "producao"
  const prodTransitions = tpl.transitions?.filter((t) => t.to === "producao");
  if (prodTransitions && prodTransitions.length > 0) {
    return prodTransitions[prodTransitions.length - 1].date;
  }
  // Fall back to the template's date field
  return tpl.date ?? null;
}
