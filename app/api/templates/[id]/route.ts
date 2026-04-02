import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const updatedTemplate = await db.template.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
