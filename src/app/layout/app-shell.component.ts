import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="shell">
      <header class="top-bar">
        <div class="brand">
          <span class="dot"></span>
          PulseForge
        </div>
        <nav>
          <a mat-button routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a mat-button routerLink="/history" routerLinkActive="active">History</a>
          <a mat-button routerLink="/tts-lab" routerLinkActive="active">TTS Lab</a>
          <a mat-button routerLink="/settings" routerLinkActive="active">Settings</a>
        </nav>
        <div class="profile" *ngIf="user() as current">
          <span>{{ current.name }}</span>
          <button mat-icon-button aria-label="Logout" (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </header>
      <main class="main-panel">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 1.5rem 2rem 2rem;
      }
      .top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        background: rgba(24, 26, 39, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 0.75rem 1.5rem;
        backdrop-filter: blur(16px);
      }
      nav {
        display: flex;
        gap: 0.5rem;
      }
      .brand {
        font-weight: 600;
        letter-spacing: 0.1rem;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: linear-gradient(135deg, #34d399, #60a5fa);
        box-shadow: 0 0 12px rgba(96, 165, 250, 0.8);
      }
      .profile {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }
      .main-panel {
        flex: 1;
        margin-top: 1.5rem;
      }
      a.active {
        color: var(--accent-tech);
      }
    `,
  ],
})
export class AppShellComponent {
  readonly user = computed(() => this.auth.user());

  constructor(private readonly auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
