import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ASSISTANT_ID = process.env.ASSISTANT_ID || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const { prompt } = JSON.parse(event.body || '{}');

        // Step 3: Add a Message to the Thread
        const messageResponse = await axios.post(
            `https://api.openai.com/v1/assistants/${ASSISTANT_ID}/threads/messages`,
            {
                role: "user",
                content: prompt,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );

        const messageId = messageResponse.data.id;

        // Step 4: Create a Run
        const runResponse = await axios.post(
            `https://api.openai.com/v1/assistants/${ASSISTANT_ID}/threads/runs`,
            {
                thread_id: messageId,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );

        const assistantMessage = runResponse.data.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: assistantMessage }),
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};