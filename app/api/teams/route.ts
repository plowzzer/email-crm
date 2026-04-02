import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const teams = await db.team.findMany();
    return NextResponse.json(teams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch teams";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, label } = body;

    if (!key || !label) {
      return NextResponse.json(
        { error: "key and label are required" },
        { status: 400 }
      );
    }

    const team = await db.team.create({
      data: {
        key,
        label,
        pipelines: [],
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
