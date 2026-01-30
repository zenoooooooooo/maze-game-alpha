import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/backend/database/connection";
import { verifyApiKey } from "@/lib/verifyApiKey";
import Score from "@/backend/database/models/Score";

export async function GET(req: NextRequest) {
  try {
    if (!verifyApiKey(req)) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid API key" },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const scores = await Score.find();

    return NextResponse.json(
      { message: "Scores fetched successfully", scores },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = 500;
    return NextResponse.json({ message }, { status });
  }
}
