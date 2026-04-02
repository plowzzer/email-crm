"use client";

import { CreateTemplateModal } from "@/components/kanban/create-template-modal";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeams } from "@/hooks/use-teams";
import { useTemplates } from "@/hooks/use-templates";
import { CHANNEL_TYPES } from "@/lib/constants";
import { getStages } from "@/lib/get-stages";
import { useAppContext } from "@/providers/context-provider";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function KanbanPage() {
  const { selectedTeam, selectedPipeline } = useAppContext();
  const { data: teams = [] } = useTeams();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Determine which pipeline keys to filter templates by
  const pipelineKeys = useMemo(() => {
    if (!selectedTeam) return [];
    const team = teams.find((t) => t.key === selectedTeam);
    if (!team) return [];
    if (selectedPipeline && selectedPipeline !== "__all__") {
      return [selectedPipeline];
    }
    return team.pipelines.map((p) => p.key);
  }, [teams, selectedTeam, selectedPipeline]);

  // Resolve stages for the selected pipeline
  const stages = useMemo(
    () =>
      getStages(
        teams as Parameters<typeof getStages>[0],
        selectedTeam,
        selectedPipeline,
      ),
    [teams, selectedTeam, selectedPipeline],
  );

  // Fetch only in-progress templates for the relevant pipelines
  const { data: templates = [], isLoading } = useTemplates(
    pipelineKeys.length > 0
      ? { status: "inProgress", pipelines: pipelineKeys }
      : { status: "inProgress" },
  );

  // Client-side filtering by search and channel
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.internalId.toLowerCase().includes(term) ||
          (t.templateId && t.templateId.toLowerCase().includes(term)),
      );
    }

    if (channelFilter) {
      result = result.filter((t) =>
        t.channels.some((c) => c.type === channelFilter),
      );
    }

    return result;
  }, [templates, search, channelFilter]);

  // Group templates by stage
  const templatesByStage = useMemo(() => {
    const map: Record<string, typeof filteredTemplates> = {};
    for (const stage of stages) {
      map[stage.key] = [];
    }
    for (const template of filteredTemplates) {
      if (map[template.stage]) {
        map[template.stage].push(template);
      }
    }
    return map;
  }, [filteredTemplates, stages]);

  // No team selected
  if (!selectedTeam) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Selecione um time para visualizar o kanban.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-104px)] w-full flex-col">
      {/* Title bar — fixed, never scrolls */}
      <div className="mb-4 flex shrink-0 items-center gap-3">
        <h1 className="text-xl font-bold text-foreground">Templates</h1>

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Todos os canais</option>
          {CHANNEL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <Button
          className="gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb]"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      )}

      {/* Kanban board — scrolls both directions */}
      {!isLoading && (
        <div className="min-h-0 w-full flex-1 overflow-auto pb-4">
          <div className="inline-flex h-full gap-4">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                templates={templatesByStage[stage.key] ?? []}
              />
            ))}
          </div>
        </div>
      )}

      <CreateTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        pipelineKeys={pipelineKeys}
      />
    </div>
  );
}
