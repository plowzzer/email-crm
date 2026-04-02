import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ChannelContent {
  subject?: string;
  body?: string;
  sender?: string;
  text?: string;
  title?: string;
  deepLink?: string;
  whatsappTemplateId?: string;
}

export interface Channel {
  type: string;
  content: ChannelContent;
}

export interface Transition {
  from: string | null;
  to: string;
  date: string;
  by: string;
  note: string;
  files: string[];
  direction?: string;
}

export interface Template {
  id: string;
  internalId: string;
  templateId: string | null;
  name: string;
  channels: Channel[];
  stage: string;
  status: string;
  owner: string;
  date: string | null;
  days: number;
  pipelines: string[];
  transitions: Transition[];
  isUpdate: boolean;
  parentTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFilters {
  status?: string;
  pipelines?: string[];
  stage?: string;
  channel?: string;
  search?: string;
}

function buildQueryString(filters: TemplateFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.pipelines?.length)
    params.set("pipelines", filters.pipelines.join(","));
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery<Template[]>({
    queryKey: ["templates", filters],
    queryFn: async () => {
      const res = await fetch(`/api/templates${buildQueryString(filters)}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

export function useTemplate(id: string | null) {
  return useQuery<Template>({
    queryKey: ["template", id],
    queryFn: async () => {
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) throw new Error("Failed to fetch template");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Template>) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["template", variables.id] });
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Template>) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      to: string;
      by: string;
      note: string;
      files?: string[];
      direction?: string;
    }) => {
      const res = await fetch(`/api/templates/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to transition");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["template"] });
    },
  });
}

export function useRequestUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      by,
      note,
    }: {
      id: string;
      by: string;
      note: string;
    }) => {
      const res = await fetch(`/api/templates/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ by, note }),
      });
      if (!res.ok) throw new Error("Failed to request update");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
