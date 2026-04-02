import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInternalId } from "@/lib/generate-internal-id";

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { by, note } = body;

    if (!by) {
      return NextResponse.json(
        { error: "by is required" },
        { status: 400 }
      );
    }

    const original = await db.template.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const newInternalId = await generateInternalId();
    const now = formatDate(new Date());

    const updateName = original.name.startsWith("[Update] ")
      ? original.name
      : `[Update] ${original.name}`;

    const initialTransition = {
      from: null,
      to: "negocios",
      date: now,
      by,
      note: note || `Solicitação de update do template ${original.internalId}`,
      files: [],
      direction: null,
    };

    const newTemplate = await db.template.create({
      data: {
        internalId: newInternalId,
        templateId: original.templateId,
        name: updateName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channels: original.channels as any,
        stage: "negocios",
        status: "inProgress",
        owner: by,
        date: null,
        days: 0,
        pipelines: original.pipelines,
        transitions: [initialTransition],
        isUpdate: true,
        parentTemplateId: original.internalId,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create update template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
