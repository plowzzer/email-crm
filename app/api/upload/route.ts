import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });

    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedFileNames: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${timestamp}-${originalName}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filePath = path.join(UPLOADS_DIR, uniqueName);
      await writeFile(filePath, buffer);

      uploadedFileNames.push(uniqueName);
    }

    return NextResponse.json({ files: uploadedFileNames }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
