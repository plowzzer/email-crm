import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamKey: string }> }
) {
  try {
    const { teamKey } = await params;
    const body = await request.json();
    const { key, label, stages, jira } = body;

    if (!key || !label) {
      return NextResponse.json(
        { error: "key and label are required" },
        { status: 400 }
      );
    }

    const team = await db.team.findUnique({ where: { key: teamKey } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const newPipeline = {
      key,
      label,
      stages: stages ?? [],
      jira: jira ?? null,
    };

    const updatedTeam = await db.team.update({
      where: { key: teamKey },
      data: {
        pipelines: {
          push: newPipeline,
        },
      },
    });

    return NextResponse.json(updatedTeam, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add pipeline";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
