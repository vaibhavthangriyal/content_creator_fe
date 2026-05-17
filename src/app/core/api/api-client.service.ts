import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: { params?: Record<string, any> }) {
    const params = this.createParams(options?.params);
    return this.http
      .get(`${this.baseUrl}${path}`, { params })
      .pipe(map((res) => this.unwrap<T>(res)));
  }

  post<T>(path: string, body: unknown) {
    return this.http
      .post(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => this.unwrap<T>(res)));
  }

  patch<T>(path: string, body: unknown) {
    return this.http
      .patch(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => this.unwrap<T>(res)));
  }

  delete<T>(path: string) {
    return this.http
      .delete(`${this.baseUrl}${path}`)
      .pipe(map((res) => this.unwrap<T>(res)));
  }

  postBlob(path: string, body: unknown) {
    return this.http.post(`${this.baseUrl}${path}`, body, {
      responseType: 'blob',
    });
  }

  getBlob(path: string) {
    return this.http.get(`${this.baseUrl}${path}`, {
      responseType: 'blob',
    });
  }

  private createParams(params?: Record<string, any>) {
    if (!params) {
      return new HttpParams();
    }
    return Object.keys(params).reduce((httpParams, key) => {
      if (params[key] === undefined || params[key] === null) {
        return httpParams;
      }
      return httpParams.append(key, params[key]);
    }, new HttpParams());
  }

  private unwrap<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as T;
    }
    return response as T;
  }
}
