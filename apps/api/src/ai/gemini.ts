import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { env } from "../config/env";
import { SYSTEM_PROMPT, buildUserPrompt } from "./promptBuilder";
import type { LLMProvider, PaperRequest } from "./types";

/** Gemini response schema (controlled generation → guaranteed JSON shape). */
const PAPER_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    intro: { type: SchemaType.STRING },
    header: {
      type: SchemaType.OBJECT,
      properties: {
        schoolName: { type: SchemaType.STRING },
        subject: { type: SchemaType.STRING },
        grade: { type: SchemaType.STRING },
        timeAllowedMins: { type: SchemaType.INTEGER },
        instructions: { type: SchemaType.STRING },
      },
      required: ["schoolName", "subject", "grade", "timeAllowedMins", "instructions"],
    },
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          instruction: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING },
                type: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: ["mcq", "short", "diagram", "numerical"],
                },
                difficulty: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: ["easy", "medium", "hard"],
                },
                marks: { type: SchemaType.INTEGER },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                answer: { type: SchemaType.STRING },
              },
              required: ["text", "type", "difficulty", "marks", "answer"],
            },
          },
        },
        required: ["title", "instruction", "questions"],
      },
    },
  },
  required: ["title", "intro", "header", "sections"],
};

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private client: GoogleGenerativeAI;

  constructor() {
    if (!env.geminiApiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set but LLM_PROVIDER=gemini. Set the key or use LLM_PROVIDER=mock."
      );
    }
    this.client = new GoogleGenerativeAI(env.geminiApiKey);
  }

  async generatePaper(req: PaperRequest, repairNote?: string): Promise<unknown> {
    let user = buildUserPrompt(req);
    if (repairNote) user += `\n\nIMPORTANT — fix this from the previous attempt: ${repairNote}`;

    const model = this.client.getGenerativeModel({
      model: env.geminiModel,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: PAPER_SCHEMA,
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(user);
    const text = result.response.text();
    return JSON.parse(text);
  }
}
