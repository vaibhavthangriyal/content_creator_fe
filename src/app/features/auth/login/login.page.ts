import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card>
        <h1>Welcome back</h1>
        <p class="subtitle">Log in to continue generating premium content.</p>
        <form [formGroup]="form" (ngSubmit)="login()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password" required />
          </mat-form-field>
          <button mat-flat-button color="primary" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in...' : 'Login' }}
          </button>
        </form>
        <p class="helper">
          Need an account?
          <a routerLink="/signup">Create one</a>
        </p>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-container {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        background: radial-gradient(circle at top, rgba(76, 29, 149, 0.4), transparent 60%),
          var(--surface);
      }
      mat-card {
        width: min(420px, 90vw);
        padding: 2rem;
        background: rgba(15, 16, 27, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-top: 1.5rem;
      }
      button {
        align-self: flex-start;
      }
      .helper {
        margin-top: 1rem;
        color: var(--text-muted);
      }
      h1 {
        margin: 0;
        font-size: 2rem;
      }
      .subtitle {
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class LoginPageComponent {
  readonly loading = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  login() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth
      .login(this.form.value as any)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: () => this.loading.set(false),
      });
  }
}
