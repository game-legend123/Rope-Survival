'use server';

import { generateSawPattern, GenerateSawPatternInput, GenerateSawPatternOutput } from '@/ai/flows/generate-saw-pattern';

export async function getNewSawPattern(input: GenerateSawPatternInput): Promise<GenerateSawPatternOutput> {
  try {
    const result = await generateSawPattern(input);
    return result;
  } catch (error) {
    console.error("Error generating saw pattern:", error);
    // Return a default or fallback pattern in case of an error
    return {
      pattern: 'steady horizontal',
      speedMultiplier: input.difficulty * 0.5 + 0.5, // Simple fallback
    };
  }
}
