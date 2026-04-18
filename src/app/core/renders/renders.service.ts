import { Injectable } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

export interface IllustratorRenderPayload {
  templateId: string;
  heading: string;
  body: string;
  imageUrl: string;
  format?: 'png' | 'jpg' | 'jpeg';
  width?: number;
  height?: number;
  quality?: number;
  imageFit?: 'contain' | 'cover';
}

export interface IllustratorTemplate {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RendersService {
  constructor(private readonly api: ApiClientService) {}

  renderIllustrator(payload: IllustratorRenderPayload) {
    return this.api.postBlob('/renders/illustrator', payload);
  }

  listTemplates() {
    return this.api.get<IllustratorTemplate[]>('/renders/templates');
  }

  createTemplate(payload: {
    name: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
  }) {
    return this.api.post<IllustratorTemplate>('/renders/templates', payload);
  }
}
