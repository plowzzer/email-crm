"use client";

import {
  useTemplate,
  useRequestUpdate,
  useUpdateTemplate,
} from "@/hooks/use-templates";
import { useTeams, type Team } from "@/hooks/use-teams";
import { getStages } from "@/lib/get-stages";
import { DEFAULT_STAGES, CHANNEL_STYLES } from "@/lib/constants";
import { ChannelTabs } from "@/components/template-detail/channel-tabs";
import { Timeline } from "@/components/template-detail/timeline";
import { TransitionModal } from "@/components/template-detail/transition-modal";
import { HistoryTable } from "@/components/template-detail/history-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftCircle,
  RefreshCw,
  ExternalLink,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

function resolveStages(teams: Team[], templatePipelines: string[]) {
  // Find the team and pipeline that this template belongs to
  for (const team of teams) {
    for (const pipeline of team.pipelines) {
      if (templatePipelines.includes(pipeline.key)) {
        const stages = getStages(
          teams as Parameters<typeof getStages>[0],
          team.key,
          pipeline.key
        );
        return { stages, team, pipeline };
      }
    }
  }
  // Fallback to default stages
  return { stages: [...DEFAULT_STAGES], team: null, pipeline: null };
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: template, isLoading, refetch } = useTemplate(id);
  const { data: teams = [] } = useTeams();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"advance" | "return">("advance");
  const [targetStage, setTargetStage] = useState("");
  const [targetStageLabel, setTargetStageLabel] = useState("");
  const requestUpdate = useRequestUpdate();

  // Inline edit for external templateId
  const [editingTemplateId, setEditingTemplateId] = useState(false);
  const [templateIdDraft, setTemplateIdDraft] = useState("");
  const updateTemplate = useUpdateTemplate();
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditingTemplateId = () => {
    setTemplateIdDraft(template?.templateId ?? "");
    setEditingTemplateId(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditingTemplateId = () => {
    setEditingTemplateId(false);
    setTemplateIdDraft("");
  };

  const saveTemplateId = () => {
    if (!template) return;
    const value = templateIdDraft.trim() || null;
    if (value === (template.templateId ?? null)) {
      cancelEditingTemplateId();
      return;
    }
    updateTemplate.mutate(
      { id: template.id, templateId: value },
      { onSuccess: () => setEditingTemplateId(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">
          Template não encontrado.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const { stages, pipeline } = resolveStages(teams, template.pipelines);
  const currentStageIndex = stages.findIndex((s) => s.key === template.stage);
  const currentStageObj = stages[currentStageIndex];
  const isFirstStage = currentStageIndex === 0;
  const isLastStage = currentStageIndex === stages.length - 1;
  const isInProgress = template.status === "inProgress";
  const isProduction = template.status === "production";

  const nextStage =
    currentStageIndex < stages.length - 1
      ? stages[currentStageIndex + 1]
      : null;
  const prevStage =
    currentStageIndex > 0 ? stages[currentStageIndex - 1] : null;

  const handleAdvance = () => {
    if (!nextStage) return;
    setModalType("advance");
    setTargetStage(nextStage.key);
    setTargetStageLabel(nextStage.label);
    setModalOpen(true);
  };

  const handleReturn = () => {
    if (!prevStage) return;
    setModalType("return");
    setTargetStage(prevStage.key);
    setTargetStageLabel(prevStage.label);
    setModalOpen(true);
  };

  const handleTransitionSuccess = () => {
    refetch();
  };

  // Build Jira URL if pipeline has jira config
  const jiraConfig = pipeline?.jira;
  const jiraUrl = jiraConfig
    ? `${jiraConfig.baseUrl}/secure/CreateIssueDetails!init.jspa?pid=${jiraConfig.pid}&issuetype=${jiraConfig.issueType}&summary=${encodeURIComponent(`${template.internalId} - ${template.name}`)}&description=${encodeURIComponent(`Template vindo do CommHub. Pipeline: ${pipeline?.label ?? "N/A"}. Link: ${typeof window !== "undefined" ? window.location.href : ""}`)}`
    : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} size="sm">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              {/* ID */}
              <div className="flex items-center gap-2">
                {editingTemplateId ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      ref={inputRef}
                      value={templateIdDraft}
                      onChange={(e) => setTemplateIdDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTemplateId();
                        if (e.key === "Escape") cancelEditingTemplateId();
                      }}
                      placeholder="ID externo..."
                      className="h-7 w-40 text-sm"
                      disabled={updateTemplate.isPending}
                    />
                    <button
                      onClick={saveTemplateId}
                      disabled={updateTemplate.isPending}
                      className="rounded p-0.5 text-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditingTemplateId}
                      disabled={updateTemplate.isPending}
                      className="rounded p-0.5 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ) : template.templateId ? (
                  <button
                    onClick={startEditingTemplateId}
                    className="group inline-flex items-center gap-1 text-xl font-bold hover:text-muted-foreground transition-colors"
                  >
                    {template.templateId}
                    <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <button
                    onClick={startEditingTemplateId}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/40 px-2 py-0.5 text-sm text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Definir ID externo
                  </button>
                )}
              </div>

              {/* Name */}
              <h1 className="text-lg font-semibold">{template.name}</h1>

              {/* Update indicator */}
              {template.isUpdate && template.parentTemplateId && (
                <p className="text-sm text-amber-600 font-medium">
                  <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
                  Update de {template.parentTemplateId}
                </p>
              )}

              {/* Channel badges */}
              <div className="flex flex-wrap gap-1.5">
                {template.channels.map((ch) => {
                  const style = CHANNEL_STYLES[ch.type];
                  return (
                    <span
                      key={ch.type}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={
                        style
                          ? {
                              backgroundColor: style.bg,
                              color: style.text,
                              borderColor: style.border,
                              borderWidth: "1px",
                              borderStyle: "solid",
                            }
                          : undefined
                      }
                    >
                      {ch.type}
                    </span>
                  );
                })}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {/* Stage badge */}
                {currentStageObj && (
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: currentStageObj.color }}
                  >
                    {currentStageObj.label}
                  </span>
                )}

                {/* Status badge */}
                <Badge variant={isInProgress ? "secondary" : "default"}>
                  {isInProgress ? "Em andamento" : "Em produção"}
                </Badge>

                {/* Owner */}
                <span>
                  Responsável: <strong>{template.owner}</strong>
                </span>

                {/* Days in stage */}
                {isInProgress && template.days > 0 && (
                  <span>
                    {template.days} dia{template.days !== 1 ? "s" : ""} na etapa
                  </span>
                )}

                {/* Production date */}
                {isProduction && template.date && (
                  <span>Em produção desde {template.date}</span>
                )}
              </div>

              {/* Pipeline badges */}
              {template.pipelines.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {template.pipelines.map((pk) => (
                    <Badge key={pk} variant="outline" className="text-xs">
                      {pk}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {isInProgress && nextStage && (
                <Button
                  onClick={handleAdvance}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <ArrowRight className="mr-1 h-4 w-4" />
                  Avançar
                </Button>
              )}
              {isInProgress && !isFirstStage && prevStage && (
                <Button
                  onClick={handleReturn}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  <ArrowLeftCircle className="mr-1 h-4 w-4" />
                  Devolver
                </Button>
              )}
              {isProduction && (
                <Button
                  className="bg-amber-500 text-white hover:bg-amber-600"
                  disabled={requestUpdate.isPending}
                  onClick={async () => {
                    const updated = await requestUpdate.mutateAsync({
                      id: template.id,
                      by: template.owner,
                      note: `Solicitação de update do template ${template.internalId}`,
                    });
                    router.push(`/templates/${updated.id}`);
                  }}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  {requestUpdate.isPending ? "Criando..." : "Solicitar Update"}
                </Button>
              )}
              {jiraUrl && (
                <a
                  href={jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Jira
                </a>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso no Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline
            currentStage={template.stage}
            stages={stages}
            transitions={template.transitions}
          />
        </CardContent>
      </Card>

      {/* Channel Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <ChannelTabs
            channels={template.channels}
            templateId={template.id}
            onUpdate={() => refetch()}
          />
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transições</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryTable transitions={template.transitions} />
        </CardContent>
      </Card>

      {/* Transition Modal */}
      <TransitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        templateId={template.id}
        targetStage={targetStage}
        targetStageLabel={targetStageLabel}
        onSuccess={handleTransitionSuccess}
      />
    </div>
  );
}
