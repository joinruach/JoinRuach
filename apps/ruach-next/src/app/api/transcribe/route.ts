import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

/**
 * POST /api/transcribe
 * Transcribe audio files using OpenAI's Whisper API
 *
 * Request:
 * - multipart/form-data with "audio" field containing audio file
 *
 * Response:
 * - { text: string } - transcribed text
 */
export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Whisper API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append("file", audioFile, audioFile.name);
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", "en");

    // Call Whisper API
    const whisperResponse = await fetch(WHISPER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error("[Whisper Error]", error);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    const result = (await whisperResponse.json()) as { text: string };

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("[Transcription API Error]", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
