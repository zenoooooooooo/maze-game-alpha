import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/backend/database/connection";
import { verifyApiKey } from "@/lib/verifyApiKey";
import Score from "@/backend/database/models/Score";

export async function POST(req: NextRequest) {
  try {
    if (!verifyApiKey(req)) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid API key" },
        { status: 401 },
      );
    }

    const { username, difficulty, score, time } = await req.json();

    await connectToDatabase();

    const newScore = new Score({
      username,
      difficulty,
      score,
      time,
    });

    await newScore.save()
    
    return NextResponse.json(
      { message: "Score added successfully" },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = 500;
    return NextResponse.json({ message }, { status });
  }
}
