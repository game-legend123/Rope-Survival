'use server';

import {generateSawPattern} from '@/ai/flows/generate-saw-pattern';
import {generateCommentary} from '@/ai/flows/generate-commentary';
import {testApi} from '@/ai/flows/testApi';
import type {
  GenerateSawPatternInput,
  GenerateSawPatternOutput,
  GenerateCommentaryInput,
  GenerateCommentaryOutput,
  TestApiOutput,
} from '@/ai/flows/types';

export async function getNewSawPattern(
  input: GenerateSawPatternInput
): Promise<GenerateSawPatternOutput> {
  try {
    const result = await generateSawPattern(input);
    return result;
  } catch (error) {
    console.error('Error generating saw pattern:', error);
    // Return a default or fallback pattern in case of an error
    return {
      pattern: 'steady horizontal',
      speedMultiplier: input.difficulty * 0.5 + 0.5, // Simple fallback
    };
  }
}

export async function getAICommentary(
  input: GenerateCommentaryInput
): Promise<GenerateCommentaryOutput> {
  try {
    const result = await generateCommentary(input);
    return result;
  } catch (error) {
    console.error('Error getting AI commentary:', error);
    return {commentary: '...'};
  }
}

export async function checkApiStatus(): Promise<TestApiOutput> {
  return await testApi();
}
