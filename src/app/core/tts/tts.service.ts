import { Injectable } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

@Injectable({ providedIn: 'root' })
export class TtsService {
  constructor(private readonly api: ApiClientService) {}

  synthesize(text: string, format: 'mp3' | 'wav' = 'mp3', language = 'en') {
    return this.api.postBlob('/tts/synthesize', { text, format, language });
  }
}
