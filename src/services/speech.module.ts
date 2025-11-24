import { Module } from '@nestjs/common';
import { SpeechService } from './speech.sevice';

@Module({
  providers: [SpeechService],
  exports: [SpeechService], 
})
export class SpeechModule {}