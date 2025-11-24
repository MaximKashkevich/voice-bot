import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { TELEGRAM_API } from "../constants";

@Injectable()
export class SpeechService {
    private readonly botToken: string;
    private readonly groqToken: string;

    constructor(private readonly configService: ConfigService) {
        this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
        this.groqToken = configService.getOrThrow<string>('GROQ_API_KEY');
    }

    async transcribeVoice(filePath: string): Promise<string> {
        const fileUrl = `${TELEGRAM_API}/file/bot${this.botToken}/${filePath}`;
        
        const fileResponse = await axios.get(fileUrl, {
            responseType: 'arraybuffer'
        });

        return await this.sendToGroq(fileResponse.data);
    }

    private async sendToGroq(audioBuffer: ArrayBuffer): Promise<string> {
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });
        
        formData.append('file', audioBlob, 'audio.ogg');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'ru');

        const response = await axios.post(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${this.groqToken}`,
                },
                timeout: 30000
            }
        );

        return response.data.text;
    }
} 