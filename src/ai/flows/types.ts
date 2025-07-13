/**
 * @fileOverview Shared types and schemas for Genkit flows.
 */
import {z} from 'zod';

// Types for generate-saw-pattern flow
export const GenerateSawPatternInputSchema = z.object({
  difficulty: z
    .number()
    .describe(
      'A number representing the difficulty level, increasing linearly over time.'
    ),
});
export type GenerateSawPatternInput = z.infer<
  typeof GenerateSawPatternInputSchema
>;

export const GenerateSawPatternOutputSchema = z.object({
  pattern: z
    .string()
    .describe(
      'A description of the saw blade movement pattern, such as zig-zag, sudden acceleration, homing, teleporting etc.'
    ),
  speedMultiplier: z
    .number()
    .describe(
      'A multiplier for the saw blade speed, increasing with difficulty.'
    ),
});
export type GenerateSawPatternOutput = z.infer<
  typeof GenerateSawPatternOutputSchema
>;

// Types for generate-commentary flow
export const GenerateCommentaryInputSchema = z.object({
  score: z.number().describe('The player current score.'),
  difficulty: z.number().describe('The current difficulty level.'),
  event: z
    .enum(['lostLife', 'levelUp', 'gameStart', 'gameOver', 'nearMiss'])
    .describe('The specific game event that occurred.'),
  playerMessage: z.string().optional().describe('An optional message from the player talking to the AI.'),
});
export type GenerateCommentaryInput = z.infer<
  typeof GenerateCommentaryInputSchema
>;

export const GenerateCommentaryOutputSchema = z.object({
  commentary: z.string().describe('The generated commentary text.'),
});
export type GenerateCommentaryOutput = z.infer<
  typeof GenerateCommentaryOutputSchema
>;
