import { InjectBot } from "@grammyjs/nestjs";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Api, Bot, Context } from "grammy";
import { AiService } from "src/services/ai.service";
import { SpeechService } from "src/services/speech.sevice";

@Injectable()
export class TelegramService {
    private readonly botToken: string;

    constructor(
        @InjectBot() private readonly bot: Bot<Context>,
        private readonly configService: ConfigService,
        private readonly speechService: SpeechService,
        private readonly aiService: AiService
    ) {
        this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    }

    async processVoiceMessage(ctx: Context) {
        const voice = ctx.msg?.voice;
        const duration = voice?.duration;

        // 👇 Проверяем, что duration существует
        if (!duration) {
            await ctx.reply('❌ Не удалось определить длительность голосового сообщения');
            return;
        }

        let progressMessageId: number | undefined;
        let interval: NodeJS.Timeout | undefined;
        let percent = 10;

        try {
            const file = await ctx.getFile();
            
            if (!file.file_path) {
                throw new Error('Не удалось получить путь к файлу');
            }

            await ctx.reply(`🎤 Длина голосового сообщения: ${duration} секунд`);

            const progressMessage = await ctx.reply(this.renderProgress(percent));
            progressMessageId = progressMessage.message_id;

            interval = setInterval(async () => {
                if (percent < 90) {
                    percent += 5;
                    
                    const currentChatId = ctx.chat?.id;
                    const currentMessageId = progressMessageId;
                    
                    if (currentChatId && currentMessageId) {
                        try {
                            await this.updateProgress(
                                ctx.api,
                                currentChatId,
                                currentMessageId,
                                percent
                            )
                        } catch (editError) {
                            console.error('Failed to edit message:', editError);
                        }
                    }
                }
            }, 1000);

            const transcription = await this.speechService.transcribeVoice(file.file_path);

            const { cost, timestamps } = await this.aiService.generateTimestamps(transcription, duration)
  
            clearInterval(interval);
            
            if (ctx.chat?.id && progressMessageId) {
                await this.updateProgress(
                    ctx.api,
                    ctx.chat.id,
                    progressMessageId,
                    100
                );
            }

            // await ctx.reply(`📝 Распознанный текст:\n${transcription}`);
            await ctx.reply(`⏰ Таймкоды:\n${timestamps}`);
            await ctx.reply(`💰 Стоимость обработки: ${cost}`);

        } catch (error) {
            clearInterval(interval);
            console.log(error);
            
            if (ctx.chat?.id && progressMessageId) {
                await ctx.api.editMessageText(
                    ctx.chat.id,
                    progressMessageId,
                    "❌ Ошибка при обработке"
                );
            }
            
            await ctx.reply('⚠️ Ошибка при обработке голосового сообщения');
        }
    }

    private async updateProgress(
        api: Api,
        chatId: number,
        messageId: number,
        percent: number
    ){
        await api.editMessageText(chatId, messageId, this.renderProgress(percent))
    }

    private renderProgress(percent: number): string {
        const totalBlocks = 10;
        const blockChar = '🟦';
        const emptyBlockChar = '⬜️';
        
        const filledBlocks = Math.max(1, Math.round((percent / 100) * totalBlocks));
        const emptyBlocks = totalBlocks - filledBlocks;

        return `🔄 Обработка аудио...\n` +
               `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
               `┃${blockChar.repeat(filledBlocks)}${emptyBlockChar.repeat(emptyBlocks)}┃ ${percent}%\n` +
               `┗━━━━━━━━━━━━━━━━━━━━┛`;
    }
}