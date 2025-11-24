import { NestjsGrammyModule } from "@grammyjs/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TelegramUpdate } from "./telegram.update";
import { TelegramService } from "./telegram.service";
import { SpeechModule } from "src/services/speech.module";

@Module({
    imports: [
        ConfigModule.forRoot(), 
        NestjsGrammyModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService], 
            useFactory: async (configService: ConfigService) => ({
                 token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
            })
        }),
        SpeechModule
    ],
    providers: [TelegramUpdate, TelegramService, SpeechModule]
})
export class TelegramModule {}