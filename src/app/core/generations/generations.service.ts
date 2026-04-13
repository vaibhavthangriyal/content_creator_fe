import { Injectable } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { Generation, ShareGenerationPayload } from '../types';

@Injectable({ providedIn: 'root' })
export class GenerationsService {
  constructor(private readonly api: ApiClientService) {}

  create(body: any) {
    return this.api.post<Generation>('/generations', body);
  }

  history(params: Record<string, any>) {
    return this.api.get<{ items: Generation[]; total: number }>(
      '/generations/history',
      { params },
    );
  }

  findOne(id: string) {
    return this.api.get<Generation>(`/generations/${id}`);
  }

  regenerate(id: string, body: any) {
    return this.api.post<Generation>(`/generations/${id}/regenerate`, body);
  }

  toggleSave(id: string, saved: boolean) {
    return this.api.patch<Generation>(`/generations/${id}/save`, { saved });
  }

  updateMeta(id: string, payload: { tags?: string[]; notes?: string }) {
    return this.api.patch<Generation>(`/generations/${id}/meta`, payload);
  }

  createShareLink(id: string) {
    return this.api.post<{ shareUrl: string; expiresAt: string }>(
      `/generations/${id}/share`,
      {},
    );
  }

  revokeShareLink(id: string) {
    return this.api.delete<{ revoked: boolean }>(`/generations/${id}/share`);
  }

  getShared(token: string) {
    return this.api.get<ShareGenerationPayload>(`/generations/share/${token}`);
  }

  delete(id: string) {
    return this.api.delete(`/generations/${id}`);
  }

  downloadVoice(id: string, body: { text?: string; language?: string; format?: string; speed?: number }) {
    return this.api.postBlob(`/generations/${id}/voice`, body ?? {});
  }
}
