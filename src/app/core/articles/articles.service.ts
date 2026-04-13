import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import { Article } from '../types';

export interface ArticleResponse {
  items: Article[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  constructor(private readonly api: ApiClientService) {}

  list(params: Record<string, any>) {
    return this.api.get<ArticleResponse>('/articles', { params });
  }

  findOne(id: string): Observable<Article> {
    return this.api.get<Article>(`/articles/${id}`);
  }

  refresh(category: string) {
    return this.api.post<{ inserted: number }>(`/articles/refresh`, {
      category,
    });
  }
}
