import { NextRequest, NextResponse } from "next/server";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface AnalysisRequest {
  reflection: string;
  checkpointPrompt: string;
  sectionTitle: string;
  scriptureAnchors?: string[];
}

interface AnalysisResponse {
  scores: {
    depth: number;
    specificity: number;
    honesty: number;
    alignment: number;
  };
  summary: string;
  sharpeningQuestions: Array<{
    question: string;
    context: string;
  }>;
  routing: "publish" | "journal" | "thread" | "review";
}

/**
 * POST /api/analyze-reflection
 * Analyze user reflection using Claude AI
 *
 * Request body:
 * {
 *   reflection: string,
 *   checkpointPrompt: string,
 *   sectionTitle: string,
 *   scriptureAnchors?: string[]
 * }
 *
 * Response:
 * {
 *   scores: { depth, specificity, honesty, alignment },
 *   summary: string,
 *   sharpeningQuestions: [...],
 *   routing: "publish" | "journal" | "thread" | "review"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as AnalysisRequest;

    const { reflection, checkpointPrompt, sectionTitle, scriptureAnchors = [] } = body;

    if (!reflection || !checkpointPrompt || !sectionTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare analysis prompt for Claude
    const analysisPrompt = `You are an expert spiritual formation mentor analyzing a user's reflection response.

## Context
- Section: ${sectionTitle}
- Reflection Prompt: ${checkpointPrompt}
- Scripture Anchors: ${scriptureAnchors.join(", ") || "None specified"}

## User's Reflection
${reflection}

## Analysis Task
Analyze this reflection across four dimensions and provide detailed feedback. Return your response as valid JSON (no markdown, pure JSON).

Evaluate the reflection on these dimensions (0.0 to 1.0):
1. **Depth**: Does it go beyond surface-level? Is there genuine wrestling with the material?
2. **Specificity**: Are there concrete examples, personal details, and particulars (not generic statements)?
3. **Honesty**: Is the reflection vulnerable, authentic, and truthful? Does it acknowledge struggle or doubt?
4. **Alignment**: Does the reflection connect meaningfully to Scripture and Christian formation principles?

Based on these scores, determine routing:
- publish (avg >= 0.8): Ready to share publicly
- journal (0.6 <= avg < 0.8): Save privately for personal growth
- thread (0.4 <= avg < 0.6): Continue with sharpening prompts
- review (avg < 0.4): Needs revision

## Response Format
Return ONLY valid JSON with this structure:
{
  "scores": {
    "depth": 0.0-1.0,
    "specificity": 0.0-1.0,
    "honesty": 0.0-1.0,
    "alignment": 0.0-1.0
  },
  "summary": "Brief feedback (2-3 sentences) about their reflection's strengths and growth areas",
  "sharpeningQuestions": [
    {
      "question": "A specific question to deepen their reflection",
      "context": "Why this question matters (1-2 sentences)"
    }
  ],
  "routing": "publish" | "journal" | "thread" | "review"
}

Generate 2-3 sharpening questions that are specific to their reflection and help them go deeper.`;

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-20250805",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Claude API Error]", response.status, error);
      return NextResponse.json(
        { error: "Analysis failed" },
        { status: 500 }
      );
    }

    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const textContent = result.content?.[0]?.text || "";

    // Parse JSON from Claude response
    let analysis: AnalysisResponse;
    try {
      analysis = JSON.parse(textContent);
    } catch (parseError) {
      console.error("[JSON Parse Error]", parseError, "Content:", textContent);
      // Fallback response if parsing fails
      return NextResponse.json({
        scores: {
          depth: 0.5,
          specificity: 0.5,
          honesty: 0.5,
          alignment: 0.5,
        },
        summary:
          "Your reflection shows thoughtful engagement with the material. Consider adding more specific examples from your own experience.",
        sharpeningQuestions: [
          {
            question: "How does this reflection connect to your own life story?",
            context: "Making personal connections helps deepen spiritual understanding.",
          },
        ],
        routing: "journal" as const,
      });
    }

    // Validate response structure
    if (
      !analysis.scores ||
      !analysis.summary ||
      !analysis.sharpeningQuestions ||
      !analysis.routing
    ) {
      throw new Error("Invalid analysis response structure");
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[Analysis API Error]", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
