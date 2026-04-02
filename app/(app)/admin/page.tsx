"use client";

import { useTeams, type Team, type Pipeline, type Stage } from "@/hooks/use-teams";
import { DEFAULT_STAGES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Settings,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const FIXED_FIRST = "negocios";
const FIXED_LAST = "producao";
const INTERMEDIATE_KEYS: string[] = DEFAULT_STAGES.filter(
  (s) => s.key !== FIXED_FIRST && s.key !== FIXED_LAST
).map((s) => s.key);

function stageByKey(key: string): Stage {
  const found = DEFAULT_STAGES.find((s) => s.key === key);
  return found
    ? { key: found.key, label: found.label, color: found.color }
    : { key, label: key, color: "#94a3b8" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const { data: teams = [], isLoading } = useTeams();
  const queryClient = useQueryClient();

  // --- Dialog state ---
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);

  // --- Team form ---
  const [newTeamLabel, setNewTeamLabel] = useState("");
  const [newTeamKey, setNewTeamKey] = useState("");

  // --- Pipeline form ---
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null);
  const [newPipelineLabel, setNewPipelineLabel] = useState("");
  const [newPipelineKey, setNewPipelineKey] = useState("");

  // --- Stage editor ---
  const [editingPipeline, setEditingPipeline] = useState<{
    teamKey: string;
    pipelineKey: string;
    pipelineLabel: string;
  } | null>(null);
  const [enabledIntermediates, setEnabledIntermediates] = useState<string[]>(
    []
  );
  const [stageSaving, setStageSaving] = useState(false);

  // --- Loading flags ---
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [creatingPipeline, setCreatingPipeline] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);
  const [deletingPipeline, setDeletingPipeline] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Helpers to find selected team/pipeline
  // -----------------------------------------------------------------------

  const selectedTeam: Team | undefined = teams.find(
    (t) => t.key === selectedTeamKey
  );

  // -----------------------------------------------------------------------
  // API actions
  // -----------------------------------------------------------------------

  async function handleCreateTeam() {
    if (!newTeamLabel.trim()) return;
    setCreatingTeam(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newTeamKey || toSlug(newTeamLabel), label: newTeamLabel }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao criar time");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setNewTeamLabel("");
      setNewTeamKey("");
      setTeamDialogOpen(false);
    } finally {
      setCreatingTeam(false);
    }
  }

  async function handleDeleteTeam(teamKey: string) {
    if (!confirm("Tem certeza que deseja excluir este time? Todas as pipelines associadas serão removidas."))
      return;
    setDeletingTeam(teamKey);
    try {
      const res = await fetch(`/api/teams/${teamKey}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao excluir time");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      if (selectedTeamKey === teamKey) {
        setSelectedTeamKey(null);
        setEditingPipeline(null);
      }
    } finally {
      setDeletingTeam(null);
    }
  }

  async function handleCreatePipeline() {
    if (!selectedTeamKey || !newPipelineLabel.trim()) return;
    setCreatingPipeline(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeamKey}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newPipelineKey || toSlug(newPipelineLabel),
          label: newPipelineLabel,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao criar pipeline");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setNewPipelineLabel("");
      setNewPipelineKey("");
      setPipelineDialogOpen(false);
    } finally {
      setCreatingPipeline(false);
    }
  }

  async function handleDeletePipeline(teamKey: string, pipelineKey: string) {
    if (!confirm("Tem certeza que deseja excluir esta pipeline?")) return;
    setDeletingPipeline(pipelineKey);
    try {
      const res = await fetch(
        `/api/teams/${teamKey}/pipelines/${pipelineKey}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao excluir pipeline");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      if (editingPipeline?.pipelineKey === pipelineKey) {
        setEditingPipeline(null);
      }
    } finally {
      setDeletingPipeline(null);
    }
  }

  function openStageEditor(teamKey: string, pipeline: Pipeline) {
    // Determine current enabled intermediates & their order
    if (pipeline.stages && pipeline.stages.length > 0) {
      // Extract intermediate keys in order from the custom stages
      const intermediates = pipeline.stages
        .filter((s) => s.key !== FIXED_FIRST && s.key !== FIXED_LAST)
        .map((s) => s.key);
      setEnabledIntermediates(intermediates);
    } else {
      // Default stages — all intermediates enabled in default order
      setEnabledIntermediates([...INTERMEDIATE_KEYS]);
    }
    setEditingPipeline({
      teamKey,
      pipelineKey: pipeline.key,
      pipelineLabel: pipeline.label,
    });
  }

  function toggleIntermediate(key: string) {
    setEnabledIntermediates((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      // When enabling, add at the position it appears in INTERMEDIATE_KEYS
      const newList = [...prev, key];
      return newList.sort(
        (a, b) => INTERMEDIATE_KEYS.indexOf(a) - INTERMEDIATE_KEYS.indexOf(b)
      );
    });
  }

  function moveIntermediate(key: string, direction: "up" | "down") {
    setEnabledIntermediates((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  async function handleSaveStages() {
    if (!editingPipeline) return;
    setStageSaving(true);
    try {
      let stages: Stage[] = [];
      if (enabledIntermediates.length > 0) {
        stages = [
          stageByKey(FIXED_FIRST),
          ...enabledIntermediates.map(stageByKey),
          stageByKey(FIXED_LAST),
        ];
      }
      // If empty, send [] which means "use default"
      const res = await fetch(
        `/api/teams/${editingPipeline.teamKey}/pipelines/${editingPipeline.pipelineKey}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stages }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao salvar etapas");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setEditingPipeline(null);
    } finally {
      setStageSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestão</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------------------------------------------------------- */}
        {/* Section 1: Teams */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Times</CardTitle>
            <Button
              size="sm"
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              onClick={() => {
                setNewTeamLabel("");
                setNewTeamKey("");
                setTeamDialogOpen(true);
              }}
            >
              <Plus className="size-4 mr-1" />
              Novo Time
            </Button>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum time cadastrado.
              </p>
            ) : (
              <ul className="divide-y">
                {teams.map((team) => (
                  <li
                    key={team.key}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{team.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.key} &middot; {team.pipelines.length}{" "}
                        {team.pipelines.length === 1 ? "pipeline" : "pipelines"}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      disabled={deletingTeam === team.key}
                      onClick={() => handleDeleteTeam(team.key)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Section 2: Pipelines */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle>Pipelines</CardTitle>
              {selectedTeamKey && (
                <Button
                  size="sm"
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                  onClick={() => {
                    setNewPipelineLabel("");
                    setNewPipelineKey("");
                    setPipelineDialogOpen(true);
                  }}
                >
                  <Plus className="size-4 mr-1" />
                  Nova Pipeline
                </Button>
              )}
            </div>
            {/* Team selector */}
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <button
                  key={team.key}
                  onClick={() => {
                    setSelectedTeamKey(team.key);
                    setEditingPipeline(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedTeamKey === team.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {team.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeamKey ? (
              <p className="text-sm text-muted-foreground">
                Selecione um time acima para ver suas pipelines.
              </p>
            ) : !selectedTeam || selectedTeam.pipelines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pipeline neste time.
              </p>
            ) : (
              <ul className="divide-y">
                {selectedTeam.pipelines.map((pipeline) => (
                  <li
                    key={pipeline.key}
                    className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <button
                      className="min-w-0 text-left hover:underline"
                      onClick={() =>
                        openStageEditor(selectedTeamKey, pipeline)
                      }
                    >
                      <p className="font-medium truncate">{pipeline.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {pipeline.key}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {pipeline.stages && pipeline.stages.length > 0
                            ? `${pipeline.stages.length} ${pipeline.stages.length === 1 ? "etapa" : "etapas"}`
                            : "Pipeline padrão"}
                        </Badge>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          openStageEditor(selectedTeamKey, pipeline)
                        }
                      >
                        <Settings className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        disabled={deletingPipeline === pipeline.key}
                        onClick={() =>
                          handleDeletePipeline(selectedTeamKey, pipeline.key)
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Stage Configuration */}
      {/* ------------------------------------------------------------------ */}
      {editingPipeline && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Etapas &mdash; {editingPipeline.pipelineLabel}
            </CardTitle>
            <Button
              size="sm"
              className="bg-[#16a34a] hover:bg-[#15803d] text-white"
              disabled={stageSaving}
              onClick={handleSaveStages}
            >
              {stageSaving ? "Salvando..." : "Salvar"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Ative ou desative etapas intermediárias e reordene-as livremente.
              Negócios (primeira) e Produção (última) são fixas.
            </p>

            <ul className="space-y-2">
              {/* Fixed: Negócios */}
              <li className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: stageByKey(FIXED_FIRST).color }}
                />
                <span className="font-medium text-sm flex-1">
                  {stageByKey(FIXED_FIRST).label}
                </span>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="size-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  Fixa
                </span>
              </li>

              {/* Intermediate stages */}
              {enabledIntermediates.map((key, idx) => {
                const stage = stageByKey(key);
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                  >
                    <GripVertical className="size-4 text-muted-foreground shrink-0" />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium text-sm flex-1">
                      {stage.label}
                    </span>
                    <input
                      type="checkbox"
                      checked
                      onChange={() => toggleIntermediate(key)}
                      className="size-4 accent-primary"
                    />
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={idx === 0}
                        onClick={() => moveIntermediate(key, "up")}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={idx === enabledIntermediates.length - 1}
                        onClick={() => moveIntermediate(key, "down")}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}

              {/* Disabled intermediates (not currently enabled) */}
              {INTERMEDIATE_KEYS.filter(
                (k) => !enabledIntermediates.includes(k)
              ).map((key) => {
                const stage = stageByKey(key);
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 px-3 py-2 opacity-60"
                  >
                    <GripVertical className="size-4 text-muted-foreground shrink-0 invisible" />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium text-sm flex-1">
                      {stage.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleIntermediate(key)}
                      className="size-4 accent-primary"
                    />
                    <div className="w-[52px]" />
                  </li>
                );
              })}

              {/* Fixed: Produção */}
              <li className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: stageByKey(FIXED_LAST).color }}
                />
                <span className="font-medium text-sm flex-1">
                  {stageByKey(FIXED_LAST).label}
                </span>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="size-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  Fixa
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Dialog: New Team */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-label">Nome</Label>
              <Input
                id="team-label"
                placeholder="Ex: Auto PF"
                value={newTeamLabel}
                onChange={(e) => {
                  setNewTeamLabel(e.target.value);
                  setNewTeamKey(toSlug(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-key">Slug (key)</Label>
              <Input
                id="team-key"
                placeholder="auto_pf"
                value={newTeamKey}
                onChange={(e) => setNewTeamKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Gerado automaticamente a partir do nome. Pode ser editado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTeamDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              disabled={!newTeamLabel.trim() || creatingTeam}
              onClick={handleCreateTeam}
            >
              {creatingTeam ? "Criando..." : "Criar Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Dialog: New Pipeline */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={pipelineDialogOpen} onOpenChange={setPipelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-label">Nome</Label>
              <Input
                id="pipeline-label"
                placeholder="Ex: Financiamento de Auto"
                value={newPipelineLabel}
                onChange={(e) => {
                  setNewPipelineLabel(e.target.value);
                  setNewPipelineKey(toSlug(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline-key">Slug (key)</Label>
              <Input
                id="pipeline-key"
                placeholder="financiamento_auto"
                value={newPipelineKey}
                onChange={(e) => setNewPipelineKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Gerado automaticamente a partir do nome. Pode ser editado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPipelineDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              disabled={!newPipelineLabel.trim() || creatingPipeline}
              onClick={handleCreatePipeline}
            >
              {creatingPipeline ? "Criando..." : "Criar Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
