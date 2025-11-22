import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SpeechService{
    private readonly botToken: string
    private readonly groqToken: string

    constructor(private readonly configService: ConfigService){
        this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
        this.groqToken = configService.getOrThrow<string>('GROQ_API_KEY')
    }
}