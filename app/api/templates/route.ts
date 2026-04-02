import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInternalId } from "@/lib/generate-internal-id";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const pipelines = searchParams.get("pipelines");
    const stage = searchParams.get("stage");
    const channel = searchParams.get("channel");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (pipelines) {
      const pipelinesArray = pipelines.split(",").map((p) => p.trim());
      where.pipelines = { hasSome: pipelinesArray };
    }

    if (stage) {
      where.stage = stage;
    }

    if (channel) {
      where.channels = { some: { type: channel } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { internalId: { contains: search, mode: "insensitive" } },
        { templateId: { contains: search, mode: "insensitive" } },
      ];
    }

    const templates = await db.template.findMany({ where });

    return NextResponse.json(templates);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, channels, owner, pipelines, stage } = body;

    if (!name || !owner || !pipelines || pipelines.length === 0) {
      return NextResponse.json(
        { error: "name, owner, and pipelines are required" },
        { status: 400 }
      );
    }

    const templateStage = stage || "negocios";
    const internalId = await generateInternalId();
    const now = formatDate(new Date());

    const initialTransition = {
      from: null,
      to: templateStage,
      date: now,
      by: owner,
      note: "Template criado",
      files: [],
      direction: null,
    };

    const template = await db.template.create({
      data: {
        internalId,
        name,
        channels: channels || [],
        stage: templateStage,
        status: "inProgress",
        owner,
        date: null,
        days: 0,
        pipelines,
        transitions: [initialTransition],
        isUpdate: false,
        parentTemplateId: null,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
