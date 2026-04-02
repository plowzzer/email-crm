"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateTemplate } from "@/hooks/use-templates";
import { CHANNEL_TYPES, CHANNEL_STYLES } from "@/lib/constants";

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineKeys: string[];
}

export function CreateTemplateModal({
  open,
  onOpenChange,
  pipelineKeys,
}: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const createTemplate = useCreateTemplate();

  function toggleChannel(ch: string) {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  function buildDefaultContent(type: string) {
    switch (type) {
      case "Email":
        return { subject: "", body: "", sender: "" };
      case "SMS":
        return { text: "" };
      case "Push":
        return { title: "", body: "", deepLink: "" };
      case "WhatsApp":
        return { text: "", whatsappTemplateId: "" };
      default:
        return {};
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !owner.trim() || selectedChannels.length === 0) return;

    const channels = selectedChannels.map((type) => ({
      type,
      content: buildDefaultContent(type),
    }));

    await createTemplate.mutateAsync({
      name: name.trim(),
      owner: owner.trim(),
      channels,
      pipelines: pipelineKeys,
      stage: "negocios",
    });

    setName("");
    setOwner("");
    setSelectedChannels([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Nome da comunicação</Label>
            <Input
              id="tpl-name"
              placeholder="Ex: Boas-vindas Financiamento"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-owner">Responsável</Label>
            <Input
              id="tpl-owner"
              placeholder="Ex: Ana Silva"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Canais</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_TYPES.map((type) => {
                const active = selectedChannels.includes(type);
                const style = CHANNEL_STYLES[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleChannel(type)}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-opacity"
                    style={{
                      backgroundColor: active ? style.bg : "#f1f5f9",
                      color: active ? style.text : "#94a3b8",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: active ? style.border : "#e2e8f0",
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {selectedChannels.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Selecione ao menos um canal.
              </p>
            )}
          </div>

          {pipelineKeys.length > 0 && (
            <div className="space-y-1">
              <Label>Pipelines</Label>
              <div className="flex flex-wrap gap-1">
                {pipelineKeys.map((pk) => (
                  <Badge key={pk} variant="outline" className="text-xs">
                    {pk}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !name.trim() ||
              !owner.trim() ||
              selectedChannels.length === 0 ||
              createTemplate.isPending
            }
            className="bg-[#3b82f6] hover:bg-[#2563eb]"
          >
            {createTemplate.isPending ? "Criando..." : "Criar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
