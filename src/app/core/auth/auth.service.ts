import { Injectable, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiClientService } from '../api/api-client.service';
import { User } from '../types';

interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'cf_token';
  private readonly userSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly user = computed(() => this.userSignal());
  readonly token = computed(() => this.tokenSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(
    private readonly api: ApiClientService,
    private readonly router: Router,
  ) {
    const storedToken = this.readStorage();
    if (storedToken) {
      this.tokenSignal.set(storedToken);
      this.fetchProfile().subscribe();
    }

    effect(() => {
      const token = this.tokenSignal();
      if (token) {
        localStorage.setItem(this.tokenKey, token);
      } else {
        localStorage.removeItem(this.tokenKey);
      }
    });
  }

  signup(payload: { name: string; email: string; password: string }) {
    return this.api.post<AuthResponse>('/auth/signup', payload).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  login(payload: { email: string; password: string }) {
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  logout() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  fetchProfile() {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => this.userSignal.set(user)),
    );
  }

  private setSession(response: AuthResponse) {
    this.tokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
  }

  private readStorage() {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.tokenKey);
  }
}
