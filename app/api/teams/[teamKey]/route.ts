import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamKey: string }> }
) {
  try {
    const { teamKey } = await params;

    const team = await db.team.findUnique({ where: { key: teamKey } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await db.team.delete({ where: { key: teamKey } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
