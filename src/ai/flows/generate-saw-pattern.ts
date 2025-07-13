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
  Difficulty 1: steady horizontal movement, speed multiplier 1.5
  Difficulty 2: sudden direction changes, speed multiplier 1.8
  Difficulty 3: accelerates and decelerates randomly, speed multiplier 2.2
  Difficulty 4: fast zig-zag movement, speed multiplier 2.8
  Difficulty 5: sinusoidal wave with changing amplitude, speed multiplier 3.5
  Difficulty 6: homes in on the player slightly, speed multiplier 4.0
  Difficulty 7: complex wave with sudden speed boosts, speed multiplier 4.5
  Difficulty 8: erratic movement with short teleports, speed multiplier 5.0
  Difficulty 9: combination of homing and teleporting, speed multiplier 5.5
  Difficulty 10: extremely erratic, fast, and homing movement, speed multiplier 6.0

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
