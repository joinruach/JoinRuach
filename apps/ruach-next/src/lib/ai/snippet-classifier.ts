import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type SnippetType =
  | "parable"
  | "idea"
  | "teaching"
  | "quote"
  | "outline"
  | "prayer"
  | "script"
  | "dream"
  | "warning";

export interface ClassificationResult {
  title: string | null;
  type: SnippetType;
  topics: string[];
  summary: string | null;
  scripture_refs: string[];
}

interface ClassifyInput {
  body: string;
  hintTitle?: string;
  hintType?: SnippetType;
}

const CLASSIFICATION_SYSTEM_PROMPT = `You are a content librarian for Ruach Ministries, a biblical teaching platform.

Your job is to classify and enrich raw text snippets into structured metadata.

Return ONLY valid JSON with no additional commentary. The JSON must match this exact structure:
{
  "title": "Concise title (max 70 chars)",
  "type": "parable|idea|teaching|quote|outline|prayer|script|dream|warning",
  "topics": ["tag1", "tag2", "tag3"],
  "summary": "One sentence summary",
  "scripture_refs": ["Reference 1", "Reference 2"]
}

Requirements:
- Keep meaning faithful to the original
- title: max 70 characters, capture the essence
- type: choose ONE that best fits the content
- topics: 3-8 relevant tags (use lowercase, hyphens for multi-word)
- summary: 1-2 sentences max
- scripture_refs: only include if CLEARLY relevant in the text (max 3), use standard format like "James 4:17"

If uncertain about scripture references, leave the array empty rather than guessing.`;

/**
 * Classify raw text using Claude AI
 * Returns structured metadata for the snippet
 */
export async function classifySnippet(
  input: ClassifyInput
): Promise<ClassificationResult> {
  const { body, hintTitle, hintType } = input;

  // Build user prompt with hints if provided
  let userPrompt = `Classify and enrich this raw text:\n\n"""${body}"""`;

  if (hintTitle || hintType) {
    userPrompt += "\n\nHints provided by user:";
    if (hintTitle) userPrompt += `\n- Suggested title: "${hintTitle}"`;
    if (hintType) userPrompt += `\n- Suggested type: "${hintType}"`;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      temperature: 0.3,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const result = JSON.parse(contentBlock.text) as ClassificationResult;

    // Validate the result has required fields
    if (!result.type || !result.topics || !Array.isArray(result.topics)) {
      throw new Error("Invalid classification result from Claude");
    }

    // Use hints as fallbacks if Claude didn't provide values
    return {
      title: result.title || hintTitle || null,
      type: result.type || hintType || "idea",
      topics: result.topics,
      summary: result.summary || null,
      scripture_refs: result.scripture_refs || [],
    };
  } catch (error) {
    console.error("Error classifying snippet with Claude:", error);

    // Return safe fallback on error
    return {
      title: hintTitle || null,
      type: hintType || "idea",
      topics: [],
      summary: null,
      scripture_refs: [],
    };
  }
}
