import { InjectBot } from "@grammyjs/nestjs";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Bot, Context } from "grammy";

@Injectable()
export class TelegramService{
    private readonly botToken: string

    constructor(
        @InjectBot() private readonly bot: Bot<Context>,
        private readonly configService: ConfigService

    ){
        this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
    }

   async processVoiceMessage(ctx: Context) {
        const voice = ctx.msg?.voice
        const duration = voice?.duration

        let progressMessageId: number | undefined
        let interval: NodeJS.Timeout | undefined
        let percent = 10 

        try{
            const file = await ctx.getFile()
            await ctx.reply(`🎤Длина голосового сообщени ${duration}`)

            const progressMessage = await ctx.reply(this.renderProgress(percent))
            progressMessageId = progressMessage.message_id

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
        // clearInterval(interval)
        } catch(error){
            clearInterval(interval)
            console.log(error)
            ctx.reply('⚠️Ошибка при обработке голосового сообщения')
        }
    }

   private renderProgress(percent: number):string{
    const totalBlocks = 10 
    const blockChar = '🟦'
    const emptyBlockChar =  '⬜'
    
    const filedBlocks = Math.max(1, Math.round((percent / 100)) * totalBlocks)
    const emptyBlocks = totalBlocks - filedBlocks

    return `🔄Прогресс [${blockChar.repeat(filedBlocks)}${emptyBlockChar.repeat(emptyBlocks)}] ${percent}%`
   }
}