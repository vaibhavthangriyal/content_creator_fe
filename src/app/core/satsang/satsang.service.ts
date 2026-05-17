import { Injectable } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { SatsangItem } from '../types';

export interface CreateSatsangPayload {
  mood: string;
  mainTheme: string;
  format?: 'mp3' | 'wav';
  voiceId?: string;
}

@Injectable({ providedIn: 'root' })
export class SatsangService {
  constructor(private readonly api: ApiClientService) {}

  create(payload: CreateSatsangPayload) {
    return this.api.post<SatsangItem>('/satsang', payload);
  }

  history(page = 1, limit = 10) {
    return this.api.get<{ items: SatsangItem[]; total: number; page: number; limit: number }>(
      '/satsang/history',
      { params: { page, limit } },
    );
  }

  findOne(id: string) {
    return this.api.get<SatsangItem>(`/satsang/${id}`);
  }

  downloadAudio(id: string) {
    return this.api.getBlob(`/satsang/${id}/audio`);
  }

  generateVideo(id: string) {
    return this.api.post<SatsangItem>(`/satsang/${id}/video/generate`, {});
  }

  downloadVideo(id: string) {
    return this.api.getBlob(`/satsang/${id}/video`);
  }
}
