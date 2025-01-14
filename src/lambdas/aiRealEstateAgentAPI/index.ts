import axios from 'axios';
import OpenAI from 'openai';
import {
    extractErrorMessage,
    getOpenAI,
    getThread,
    waitForRunCompletion,
  } from './utils';
import { createResponse } from '../utils/lambdaUtils';
  
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ASSISTANT_ID = process.env.ASSISTANT_ID || '';

export default async function handler(request: any) {
    try {
      const openai = getOpenAI(OPENAI_API_KEY);
  
      const { userQuery } = (await request.json()) as { userQuery: string };
      const thread = await getThread(openai);
  
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: userQuery,
      });
  
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID as string,
      });
  
      const result = await waitForRunCompletion(run.id, thread.id);
  
      return createResponse(200, result.messages.data);
    } catch (err: unknown) {
      console.error('Error: ', err);
      const errorResponse = extractErrorMessage(err);
      return createResponse(500, errorResponse);
    }
}