'use server';
/**
 * @fileOverview A flow for generating in-game commentary based on player performance.
 *
 * - generateCommentary - A function that generates commentary.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateCommentaryInputSchema,
  GenerateCommentaryOutputSchema,
  type GenerateCommentaryInput,
  type GenerateCommentaryOutput,
} from './types';

export async function generateCommentary(
  input: GenerateCommentaryInput
): Promise<GenerateCommentaryOutput> {
  return commentaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommentaryPrompt',
  input: {schema: GenerateCommentaryInputSchema},
  output: {schema: GenerateCommentaryOutputSchema},
  prompt: `You are a sassy and witty AI game commentator for a survival game. Your job is to provide short, punchy commentary on the player's performance. You can be encouraging, mocking, or just state facts with a bit of attitude. Your comments must be in Vietnamese.

  Here is the current game state:
  - Event: {{{event}}}
  - Score: {{{score}}}
  - Difficulty: {{{difficulty}}}

  Generate a comment based on the event:

  - If the event is 'gameStart': Give some cocky "advice". (e.g., "Bắt đầu rồi à? Để xem trụ được bao lâu.", "Nhớ thở nhé, tân binh.")
  - If the event is 'levelUp': Comment on the increasing difficulty, maybe with a hint of sarcasm. (e.g., "Tưởng thế là khó à? Chờ xem.", "Cấp độ {{{difficulty}}}! Chúc may mắn, bạn sẽ cần nó đấy.")
  - If the event is 'lostLife': Mock the player's mistake. Be brutal but funny. (e.g., "Ôi không! Cái cưa bén quá à?", "Đó gọi là "kỹ năng né" à? Tệ thật.", "Trông có vẻ đau đấy.")
  - If the event is 'gameOver': Give a final, dismissive comment on their score. (e.g., "Điểm cuối: {{{score}}}. Hơi thất vọng.", "Thua rồi à? Thôi, không phải ai cũng chơi hay được.")
  - If the event is 'nearMiss': Comment on their close call, maybe they were lucky. (e.g., "Suýt nữa thì xong! Đúng là ăn rùa.", "Pha đó là kỹ năng hay là cầu nguyện thế?")

  Keep the commentary short, under 15 words. Respond in JSON format.`,
});

const commentaryFlow = ai.defineFlow(
  {
    name: 'commentaryFlow',
    inputSchema: GenerateCommentaryInputSchema,
    outputSchema: GenerateCommentaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    