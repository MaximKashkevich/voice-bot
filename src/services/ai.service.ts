import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { buildTimestampUserPrompt, TIMESTAMP_SYSTEM_PROMPT } from "src/prompts/timestamp.prompts";

@Injectable()
export class AiService {
    private readonly groqToken: string;
    
    constructor(
        private readonly configService: ConfigService
    ) {
        this.groqToken = configService.getOrThrow<string>("GROQ_API_KEY");
    }

    async generateTimestamps(text: string, audioDurationSec: number): Promise<{
        timestamps: string; cost: string;
    }> {
        const maxSegments = 10;
        const words = text.split(/\s+/);
        const wordsPerSegment = Math.ceil(words.length / maxSegments);
        const secondsPerSegment = Math.floor(audioDurationSec / maxSegments);

        const segments: { time: string; content: string }[] = []; 

        for (let i = 0; i < maxSegments; i++) {
            const fromSec = i * secondsPerSegment;
            const fromMin = String(Math.floor(fromSec / 60)).padStart(2, '0');
            const fromSecRest = String(fromSec % 60).padStart(2, '0');
            const time = `${fromMin}:${fromSecRest}`;

            const start = i * wordsPerSegment;
            const end = start + wordsPerSegment;
            const content = words.slice(start, end).join(' ');

            if (content.trim()) {
                segments.push({ time, content }); 
            }
        }

        const preparedText = segments.map(({content}) => content).join('\n')

        const systemMessage = TIMESTAMP_SYSTEM_PROMPT
        const userMessage = buildTimestampUserPrompt(preparedText)

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: systemMessage
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.groqToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiTimestamps = response.data.choices[0].message.content;

        return {
            timestamps: aiTimestamps,
            cost: "0.00"
        };
    }
}