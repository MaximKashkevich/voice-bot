import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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

        return {
            timestamps: segments.map(seg => `${seg.time} ${seg.content}`).join('\n'),
            cost: "0.00"
        };
    }
}