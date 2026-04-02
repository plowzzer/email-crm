"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTemplate } from "@/hooks/use-templates";
import type { Channel, ChannelContent } from "@/hooks/use-templates";
import { useEffect, useState } from "react";

interface EditChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  channel: Channel;
  allChannels: Channel[];
  onSuccess: () => void;
}

const FIELD_CONFIG: Record<
  string,
  { key: keyof ChannelContent; label: string; type: "input" | "textarea" }[]
> = {
  Email: [
    { key: "sender", label: "Remetente", type: "input" },
    { key: "subject", label: "Assunto", type: "input" },
    { key: "body", label: "Corpo", type: "textarea" },
  ],
  SMS: [{ key: "text", label: "Texto", type: "textarea" }],
  Push: [
    { key: "title", label: "Título", type: "input" },
    { key: "body", label: "Corpo", type: "textarea" },
    { key: "deepLink", label: "Deep Link", type: "input" },
  ],
  WhatsApp: [
    { key: "text", label: "Texto", type: "textarea" },
    { key: "whatsappTemplateId", label: "WhatsApp Template ID", type: "input" },
  ],
};

export function EditChannelModal({
  open,
  onOpenChange,
  templateId,
  channel,
  allChannels,
  onSuccess,
}: EditChannelModalProps) {
  const [draft, setDraft] = useState<ChannelContent>({});
  const updateTemplate = useUpdateTemplate();

  useEffect(() => {
    if (open) {
      setDraft({ ...channel.content });
    }
  }, [open, channel.content]);

  const fields = FIELD_CONFIG[channel.type] ?? [];

  const handleChange = (key: keyof ChannelContent, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const updatedChannels = allChannels.map((ch) =>
      ch.type === channel.type ? { ...ch, content: draft } : ch,
    );
    updateTemplate.mutate(
      { id: templateId, channels: updatedChannels },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar conteúdo — {channel.type}</DialogTitle>
          <DialogDescription>
            Altere os campos abaixo e salve para atualizar o conteúdo do canal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  value={(draft[field.key] as string) ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={5}
                />
              ) : (
                <Input
                  id={field.key}
                  value={(draft[field.key] as string) ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum campo configurado para o canal {channel.type}.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateTemplate.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateTemplate.isPending}>
            {updateTemplate.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
