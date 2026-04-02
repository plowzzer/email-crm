"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EditChannelModal } from "@/components/template-detail/edit-channel-modal";
import { Pencil } from "lucide-react";
import { type ReactNode, useState } from "react";

/**
 * Highlights ${VARIABLE} patterns as styled badges within text.
 */
function highlightVars(text: string): ReactNode {
  const parts = text.split(/(\$\{[^}]+\})/g);
  return parts.map((part, i) =>
    /^\$\{[^}]+\}$/.test(part) ? (
      <span
        key={i}
        className="inline-flex items-center rounded bg-violet-100 px-1.5 py-0.5 font-mono text-xs font-medium text-violet-700 ring-1 ring-violet-300"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

interface ChannelContent {
  subject?: string;
  body?: string;
  sender?: string;
  text?: string;
  title?: string;
  deepLink?: string;
  whatsappTemplateId?: string;
}

interface Channel {
  type: string;
  content: ChannelContent;
}

interface ChannelTabsProps {
  channels: Channel[];
  templateId?: string;
  onUpdate?: () => void;
}

function EmailContent({ content }: { content: ChannelContent }) {
  return (
    <div className="space-y-4">
      {content.sender && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Remetente
          </span>
          <p className="mt-1 text-sm">{highlightVars(content.sender)}</p>
        </div>
      )}
      {content.subject && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Assunto
          </span>
          <p className="mt-1 text-sm font-medium">{highlightVars(content.subject)}</p>
        </div>
      )}
      {content.body && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Corpo
          </span>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-white p-4 text-sm">
            {highlightVars(content.body)}
          </p>
        </div>
      )}
    </div>
  );
}

function SMSContent({ content }: { content: ChannelContent }) {
  const charCount = content.text?.length ?? 0;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Texto
          </span>
          <span
            className={`text-xs ${
              charCount > 160
                ? "font-medium text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {charCount}/160 caracteres
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-white p-4 text-sm">
          {content.text && highlightVars(content.text)}
        </p>
      </div>
    </div>
  );
}

function PushContent({ content }: { content: ChannelContent }) {
  return (
    <div className="space-y-4">
      {content.title && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Título
          </span>
          <p className="mt-1 text-sm font-medium">{highlightVars(content.title)}</p>
        </div>
      )}
      {content.body && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Corpo
          </span>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-white p-4 text-sm">
            {highlightVars(content.body)}
          </p>
        </div>
      )}
      {content.deepLink && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Deep Link
          </span>
          <p className="mt-1 text-sm font-mono text-blue-600 break-all">
            {highlightVars(content.deepLink)}
          </p>
        </div>
      )}
    </div>
  );
}

function WhatsAppContent({ content }: { content: ChannelContent }) {
  return (
    <div className="space-y-4">
      {content.text && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Texto
          </span>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-white p-4 text-sm">
            {highlightVars(content.text)}
          </p>
        </div>
      )}
      {content.whatsappTemplateId && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            WhatsApp Template ID
          </span>
          <p className="mt-1 text-sm font-mono">{content.whatsappTemplateId}</p>
        </div>
      )}
    </div>
  );
}

const contentRenderers: Record<
  string,
  React.ComponentType<{ content: ChannelContent }>
> = {
  Email: EmailContent,
  SMS: SMSContent,
  Push: PushContent,
  WhatsApp: WhatsAppContent,
};

export function ChannelTabs({ channels, templateId, onUpdate }: ChannelTabsProps) {
  const [editChannel, setEditChannel] = useState<Channel | null>(null);

  if (channels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum canal configurado para este template.
      </p>
    );
  }

  return (
    <>
      <Tabs defaultValue={channels[0].type}>
        <TabsList variant="line">
          {channels.map((channel) => (
            <TabsTrigger key={channel.type} value={channel.type}>
              {channel.type}
            </TabsTrigger>
          ))}
        </TabsList>
        {channels.map((channel) => {
          const Renderer = contentRenderers[channel.type];
          return (
            <TabsContent key={channel.type} value={channel.type} className="pt-4">
              {templateId && (
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditChannel(channel)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar conteúdo
                  </Button>
                </div>
              )}
              {Renderer ? (
                <Renderer content={channel.content} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Conteúdo indisponível para o canal {channel.type}.
                </p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {editChannel && templateId && (
        <EditChannelModal
          open={!!editChannel}
          onOpenChange={(open) => {
            if (!open) setEditChannel(null);
          }}
          templateId={templateId}
          channel={editChannel}
          allChannels={channels}
          onSuccess={() => onUpdate?.()}
        />
      )}
    </>
  );
}
