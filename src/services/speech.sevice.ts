import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class SpeechService {
    private readonly telegramToken: string
    private readonly groqToken: string
    constructor(
        private readonly configService: ConfigService
    ){
        this.telegramToken = configService.getOrThrow<string>("TELEGRAM_BOT_TOKEN")
        this.groqToken = configService.getOrThrow<string>("GROQ_API_KEY")
    }

    async transcribeVoice(file: string){
        const fileUrl = `https://api.telegram.org/file/bot${this.telegramToken}/${file}`

        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer'
        })

        return this.responseGroqApi(response.data)
    }

    async responseGroqApi(voice){
        const formData = new FormData()
        
        const audioBlob = new Blob([voice], { type: 'audio/ogg' });

        formData.append('file', audioBlob, 'audio.ogg');
        formData.append('model', 'whisper-large-v3'); 
        formData.append('language', 'ru')

        const response = await axios.post(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${this.groqToken}`,
                }
            }
        );

        return response.data.text
    }
}