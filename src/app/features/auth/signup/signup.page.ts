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
  selector: 'app-signup-page',
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
        <h1>Create account</h1>
        <p class="subtitle">Curate news, craft scripts, and publish faster.</p>
        <form [formGroup]="form" (ngSubmit)="signup()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" required />
          </mat-form-field>
          <button mat-flat-button color="primary" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating...' : 'Sign up' }}
          </button>
        </form>
        <p class="helper">
          Already have an account?
          <a routerLink="/login">Log in</a>
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
        background: radial-gradient(circle at 70% 0%, rgba(14, 165, 233, 0.35), transparent 60%),
          var(--surface);
      }
      mat-card {
        width: min(440px, 92vw);
        padding: 2rem;
        background: rgba(16, 18, 28, 0.95);
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.04);
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-top: 1.5rem;
      }
      .subtitle {
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
      .helper {
        margin-top: 1rem;
        color: var(--text-muted);
      }
    `,
  ],
})
export class SignupPageComponent {
  readonly loading = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  signup() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth
      .signup(this.form.value as any)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: () => this.loading.set(false),
      });
  }
}
