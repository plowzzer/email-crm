export const DEFAULT_STAGES = [
  { key: "negocios", label: "Negócios", color: "#3b82f6" },
  { key: "design", label: "Design", color: "#a855f7" },
  { key: "templateid", label: "TemplateID", color: "#f59e0b" },
  { key: "dev", label: "Desenvolvimento", color: "#10b981" },
  { key: "homol_int", label: "Homol. Interna", color: "#f97316" },
  { key: "homol_integ", label: "Homol. Integrada", color: "#f43f5e" },
  { key: "producao", label: "Produção", color: "#16a34a" },
] as const;

export const CHANNEL_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Email: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  SMS: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  Push: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  WhatsApp: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
};

export const CHANNEL_TYPES = ["Email", "SMS", "Push", "WhatsApp"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export type StageDefinition = {
  key: string;
  label: string;
  color: string;
};
