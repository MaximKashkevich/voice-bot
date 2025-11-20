import { Injectable } from '@nestjs/common';
import { InjectBot, Start, Update } from '@grammyjs/nestjs';
import { Bot, Context } from 'grammy';

@Update()
@Injectable()
export class TelegramUpdate {
  constructor(
    @InjectBot() private readonly bot: Bot<Context>,
  ) {}

  @Start()
  async onStart(ctx: Context): Promise<void> {
    await ctx.reply(
      'Привет! Отправь мне голосовое сообщение, а я расставлю тайм-коды.',
    );
  }
}