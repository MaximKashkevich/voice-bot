import { Module } from '@nestjs/common';
import { SpeechService } from './speech.sevice';
import { AiService } from './ai.service';

@Module({
  providers: [SpeechService, AiService],
  exports: [SpeechService, AiService], 
})
export class SpeechModule {}