import { Injectable } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { User } from '../types';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly api: ApiClientService) {}

  getPreferences() {
    return this.api.get<User>('/users/preferences');
  }

  updatePreferences(body: Partial<User>) {
    return this.api.patch<User>('/users/preferences', body);
  }
}
