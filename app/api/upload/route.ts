export const runtime = "nodejs";

// app/api/upload/route.ts
// ⚠️  LOCAL FILESYSTEM — development only.
// Files are saved to /public/uploads and served at /uploads/<filename>.
// Switch to Cloudinary / S3 before going to production.

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Allowed MIME types → file extension
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size check
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // Type check
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WEBP and PDF are allowed." },
        { status: 400 }
      );
    }

    // Make sure the upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Unique filename so nothing gets overwritten
    const filename = `${randomUUID()}.${ext}`;
    const filepath  = path.join(UPLOAD_DIR, filename);

    // Write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Next.js serves everything in /public at the root URL
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 200 });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message ?? "File upload failed. Please try again." },
      { status: 500 }
    );
  }
}