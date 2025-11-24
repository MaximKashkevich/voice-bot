import { InjectBot } from "@grammyjs/nestjs";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Bot, Context } from "grammy";
import { SpeechService } from "src/services/speech.sevice";

@Injectable()
export class TelegramService {
    private readonly botToken: string;

    constructor(
        @InjectBot() private readonly bot: Bot<Context>,
        private readonly configService: ConfigService,
        private readonly speechService: SpeechService
    ) {
        this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    }

    async processVoiceMessage(ctx: Context) {
        const voice = ctx.msg?.voice;
        const duration = voice?.duration;

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
                            await ctx.api.editMessageText(
                                currentChatId,
                                currentMessageId,
                                this.renderProgress(percent)
                            );
                        } catch (editError) {
                            console.error('Failed to edit message:', editError);
                        }
                    }
                }
            }, 1000);

            const transcription = await this.speechService.transcribeVoice(file.file_path);
  
            clearInterval(interval);
            
            if (ctx.chat?.id && progressMessageId) {
                await ctx.api.editMessageText(
                    ctx.chat.id,
                    progressMessageId,
                    "✅ Транскрибация завершена!"
                );
            }

            await ctx.reply(`📝 Распознанный текст:\n${transcription}`);

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