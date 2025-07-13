'use server';
/**
 * @fileOverview A simple flow to test the Gemini API connection.
 *
 * - testApi - A function that tests the API and returns a status.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {TestApiOutputSchema, type TestApiOutput} from './types';

export async function testApi(): Promise<TestApiOutput> {
  return testApiFlow();
}

const testApiFlow = ai.defineFlow(
  {
    name: 'testApiFlow',
    inputSchema: z.void(),
    outputSchema: TestApiOutputSchema,
  },
  async () => {
    try {
      const {text} = await ai.generate({
        prompt: 'Say "Hello"',
        model: 'googleai/gemini-2.0-flash',
        config: {temperature: 0},
      });

      if (text) {
        return {success: true, message: 'Kết nối API Gemini thành công!'};
      } else {
        throw new Error('No text returned from API.');
      }
    } catch (error: any) {
      console.error('API Test Failed:', error);
      return {
        success: false,
        message: `Kiểm tra API thất bại: ${error.message}`,
      };
    }
  }
);
