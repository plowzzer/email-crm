import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamKey: string; pipelineKey: string }> }
) {
  try {
    const { teamKey, pipelineKey } = await params;
    const body = await request.json();
    const { stages, jira } = body;

    const team = await db.team.findUnique({ where: { key: teamKey } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const pipelineIndex = team.pipelines.findIndex(
      (p: { key: string }) => p.key === pipelineKey
    );
    if (pipelineIndex === -1) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    const updatedPipelines = [...team.pipelines];
    if (stages !== undefined) {
      updatedPipelines[pipelineIndex] = {
        ...updatedPipelines[pipelineIndex],
        stages,
      };
    }
    if (jira !== undefined) {
      updatedPipelines[pipelineIndex] = {
        ...updatedPipelines[pipelineIndex],
        jira,
      };
    }

    const updatedTeam = await db.team.update({
      where: { key: teamKey },
      data: { pipelines: updatedPipelines },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update pipeline";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamKey: string; pipelineKey: string }> }
) {
  try {
    const { teamKey, pipelineKey } = await params;

    const team = await db.team.findUnique({ where: { key: teamKey } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const pipelineExists = team.pipelines.some((p: { key: string }) => p.key === pipelineKey);
    if (!pipelineExists) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    const filteredPipelines = team.pipelines.filter(
      (p: { key: string }) => p.key !== pipelineKey
    );

    const updatedTeam = await db.team.update({
      where: { key: teamKey },
      data: { pipelines: filteredPipelines },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete pipeline";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
