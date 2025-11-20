import { NestjsGrammyModule } from "@grammyjs/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TelegramUpdate } from "./telegram.update";
import { TelegramService } from "./telegram.service";

@Module({
    imports: [
        ConfigModule.forRoot(), 
        NestjsGrammyModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService], 
            useFactory: async (configService: ConfigService) => ({
                 token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
            })
        })
    ],
    providers: [TelegramUpdate, TelegramService]
})
export class TelegramModule {}