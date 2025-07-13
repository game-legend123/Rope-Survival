'use server';

/**
 * @fileOverview A flow for generating saw blade movement patterns with increasing difficulty.
 *
 * - generateSawPattern - A function that generates saw blade movement patterns.
 * - GenerateSawPatternInput - The input type for the generateSawPattern function.
 * - GenerateSawPatternOutput - The return type for the generateSawPattern function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSawPatternInputSchema = z.object({
  difficulty: z
    .number()
    .describe(
      'A number representing the difficulty level, increasing linearly over time.'
    ),
});
export type GenerateSawPatternInput = z.infer<typeof GenerateSawPatternInputSchema>;

const GenerateSawPatternOutputSchema = z.object({
  pattern: z
    .string()
    .describe(
      'A description of the saw blade movement pattern, such as zig-zag, sudden acceleration, etc.'
    ),
  speedMultiplier: z
    .number()
    .describe(
      'A multiplier for the saw blade speed, increasing with difficulty.'
    ),
});
export type GenerateSawPatternOutput = z.infer<typeof GenerateSawPatternOutputSchema>;

export async function generateSawPattern(
  input: GenerateSawPatternInput
): Promise<GenerateSawPatternOutput> {
  return generateSawPatternFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSawPatternPrompt',
  input: {schema: GenerateSawPatternInputSchema},
  output: {schema: GenerateSawPatternOutputSchema},
  prompt: `You are an expert game designer, tasked with creating increasingly challenging saw blade movement patterns for a survival game.

  The difficulty level is: {{{difficulty}}}

  Based on the difficulty level, generate a new saw blade movement pattern and a corresponding speed multiplier. The pattern should become more complex and the speed should increase as the difficulty increases linearly.  Respond using JSON format.

  Difficulty 1: steady horizontal movement, speed multiplier 1.0
  Difficulty 2: sudden direction changes, speed multiplier 1.2
  Difficulty 3: double speed, speed multiplier 2.0
  Difficulty 4: zig-zag movement, speed multiplier 2.5
  Difficulty 5: accelerated zig-zag, speed multiplier 3.0
  Difficulty 6: sinusoidal wave, speed multiplier 3.5
  Difficulty 7: complex wave, speed multiplier 4.0
  Difficulty 8: erratic movement, speed multiplier 4.5
  Difficulty 9: very erratic movement, speed multiplier 5.0
  Difficulty 10: extremely erratic movement, speed multiplier 5.5

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
