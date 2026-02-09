import { anthropic } from "@ai-sdk/anthropic";

const MODEL = "claude-haiku-4-5";

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using placeholder");
    // Return the Anthropic provider anyway - user will get an error
    // but at least the code structure is correct
  }

  return anthropic(MODEL);
}
