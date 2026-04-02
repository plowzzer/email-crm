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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTransition } from "@/hooks/use-templates";

interface TransitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "advance" | "return";
  templateId: string;
  targetStage: string;
  targetStageLabel?: string;
  onSuccess: () => void;
}

export function TransitionModal({
  open,
  onOpenChange,
  type,
  templateId,
  targetStage,
  targetStageLabel,
  onSuccess,
}: TransitionModalProps) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const transition = useTransition();

  const isReturn = type === "return";
  const title = isReturn
    ? `Devolver para ${targetStageLabel ?? targetStage}`
    : `Avançar para ${targetStageLabel ?? targetStage}`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const uploadedNames: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData();
      formData.append("file", selectedFiles[i]);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedNames.push(data.filename);
        }
      } catch {
        // Upload failed silently for this file
      }
    }

    setFiles((prev) => [...prev, ...uploadedNames]);
    setUploading(false);
  };

  const handleSubmit = () => {
    if (isReturn && !note.trim()) return;

    transition.mutate(
      {
        id: templateId,
        to: targetStage,
        by: "Usuário",
        note: note.trim(),
        files,
        direction: isReturn ? "backward" : undefined,
      },
      {
        onSuccess: () => {
          setNote("");
          setFiles([]);
          onOpenChange(false);
          onSuccess();
        },
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNote("");
      setFiles([]);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transition-note">
              {isReturn ? "Justificativa (obrigatória)" : "Descrição (opcional)"}
            </Label>
            <Textarea
              id="transition-note"
              placeholder={
                isReturn
                  ? "Descreva o motivo da devolução..."
                  : "Adicione uma descrição..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transition-files">Evidências</Label>
            <input
              id="transition-files"
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-muted/80"
            />
            {uploading && (
              <p className="text-xs text-muted-foreground">Enviando...</p>
            )}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {files.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                  >
                    {file}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              transition.isPending || (isReturn && !note.trim()) || uploading
            }
            className={
              isReturn
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }
          >
            {transition.isPending
              ? "Processando..."
              : isReturn
                ? "Devolver"
                : "Avançar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
