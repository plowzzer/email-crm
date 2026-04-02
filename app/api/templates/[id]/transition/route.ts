import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    const { to, by, note, files, direction } = body;

    if (!to || !by) {
      return NextResponse.json(
        { error: "to and by are required" },
        { status: 400 }
      );
    }

    if (direction === "backward" && (!note || note.trim() === "")) {
      return NextResponse.json(
        { error: "note is required for backward transitions (devolutions)" },
        { status: 400 }
      );
    }

    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const from = template.stage;
    const now = formatDate(new Date());

    const newTransition = {
      from,
      to,
      date: now,
      by,
      note: note || "",
      files: files || [],
      direction: direction || null,
    };

    const isProduction = to === "producao";
    const newStatus = isProduction ? "production" : "inProgress";
    const newDate = isProduction ? now : template.date;

    const updatedTemplate = await db.template.update({
      where: { id },
      data: {
        stage: to,
        status: newStatus,
        date: newDate,
        days: 0,
        transitions: {
          push: newTransition,
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to transition template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
