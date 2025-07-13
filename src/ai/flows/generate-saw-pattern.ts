'use server';

/**
 * @fileOverview A flow for generating saw blade movement patterns with increasing difficulty.
 *
 * - generateSawPattern - A function that generates saw blade movement patterns.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateSawPatternInputSchema,
  GenerateSawPatternOutputSchema,
  type GenerateSawPatternInput,
  type GenerateSawPatternOutput,
} from './types';

export async function generateSawPattern(
  input: GenerateSawPatternInput
): Promise<GenerateSawPatternOutput> {
  return generateSawPatternFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSawPatternPrompt',
  input: {schema: GenerateSawPatternInputSchema},
  output: {schema: GenerateSawPatternOutputSchema},
  prompt: `You are an expert game designer, tasked with creating increasingly challenging and frustrating saw blade movement patterns for a survival game. The goal is to make the player feel challenged and even a little bit angry.

  The difficulty level is: {{{difficulty}}}

  Based on the difficulty level, generate a new saw blade movement pattern and a corresponding speed multiplier. The pattern should become more complex, unpredictable, and downright unfair as the difficulty increases linearly. Respond using JSON format.

  Here are some examples of frustrating patterns, you can create your own variations.
  - Difficulty 1-2: 'steady' - simple back and forth movement. speed multiplier 1.5
  - Difficulty 3-4: 'accelerated' - movement with random speed changes. speed multiplier 2.2
  - Difficulty 5-7: 'homing' - slightly homes in on the player. speed multiplier 3.5
  - Difficulty 8 and above: 'relentless homing with random reversal'. The saw moves very fast, constantly adjusting its position to home in on the player's ball. At random intervals, it will abruptly reverse its direction, making it extremely unpredictable. The speed multiplier should be very high, starting at 4.5 and increasing with difficulty.

  Generate a pattern for difficulty {{{difficulty}}}. If the difficulty is 8 or higher, you MUST use the 'relentless homing with random reversal' pattern.

  Output in JSON format:
  {
    "pattern": "description of the saw blade movement pattern",
    "speedMultiplier": speed multiplier for the saw blade
  }`,
});

const generateSawPatternFlow = ai.defineFlow(
  {
    name: 'generateSawPatternFlow',
    inputSchema: GenerateSawPatternInputSchema,
    outputSchema: GenerateSawPatternOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    