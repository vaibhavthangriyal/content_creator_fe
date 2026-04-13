import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../core/users/users.service';
import { User } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <mat-card>
      <h1>Content defaults</h1>
      <p class="helper">We use these values every time you generate a new package.</p>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Language</mat-label>
            <mat-select formControlName="preferredLanguage">
              <mat-option value="english">English</mat-option>
              <mat-option value="hinglish">Hinglish</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tone</mat-label>
            <mat-select formControlName="preferredTone">
              <mat-option value="neutral">Neutral</mat-option>
              <mat-option value="dramatic">Dramatic</mat-option>
              <mat-option value="excited">Excited</mat-option>
              <mat-option value="educational">Educational</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Platform focus</mat-label>
            <mat-select formControlName="preferredPlatformFocus">
              <mat-option value="youtube">YouTube</mat-option>
              <mat-option value="instagram">Instagram</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Video type</mat-label>
            <mat-select formControlName="preferredVideoType">
              <mat-option value="explainer">Explainer</mat-option>
              <mat-option value="news">News</mat-option>
              <mat-option value="story">Narrative</mat-option>
              <mat-option value="deep-dive">Deep dive</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <button mat-flat-button color="primary" [disabled]="saving()">
          {{ saving() ? 'Saving...' : 'Save preferences' }}
        </button>
      </form>
    </mat-card>
  `,
  styles: [
    `
      mat-card {
        background: rgba(13, 15, 24, 0.85);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.04);
        padding: 2rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }
      .helper {
        color: var(--text-muted);
      }
    `,
  ],
})
export class SettingsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    preferredLanguage: ['english'],
    preferredTone: ['neutral'],
    preferredPlatformFocus: ['youtube'],
    preferredVideoType: ['explainer'],
  });

  readonly saving = signal(false);

  constructor(private readonly usersService: UsersService) {}

  ngOnInit() {
    this.usersService.getPreferences().subscribe((user) => {
      this.form.patchValue({
        preferredLanguage: user.preferredLanguage,
        preferredTone: user.preferredTone,
        preferredPlatformFocus: user.preferredPlatformFocus,
        preferredVideoType: user.preferredVideoType,
      });
    });
  }

  save() {
    this.saving.set(true);
    this.usersService
      .updatePreferences(this.form.getRawValue() as Partial<User>)
      .subscribe({
        next: () => this.saving.set(false),
        error: () => this.saving.set(false),
      });
  }
}
