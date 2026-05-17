import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { generateSatsangCanvasVideo } from '../../core/satsang/canvas-video';
import { SatsangService } from '../../core/satsang/satsang.service';
import { SatsangItem } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-satsang-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
  ],
  template: `
    <section class="satsang-page">
      <mat-card class="form-card">
        <h2>Guruji's Satsang</h2>
        <p class="sub">Choose mood and main theme, then generate Hindi satsang script + voice.</p>
        <a mat-button routerLink="/satsang/history">Open History</a>

        <form [formGroup]="form" (ngSubmit)="generate()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Mood</mat-label>
            <mat-select formControlName="mood">
              <mat-option *ngFor="let option of moods" [value]="option">{{ option }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Main Theme</mat-label>
            <mat-select formControlName="mainTheme">
              <mat-option *ngFor="let theme of themes" [value]="theme">{{ theme }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="form.controls.mainTheme.value === 'Other'">
            <mat-label>Custom Theme</mat-label>
            <input matInput formControlName="customTheme" placeholder="e.g. Dhairya in family conflict" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Voice</mat-label>
            <input matInput formControlName="voiceId" placeholder="e.g. Kore" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Audio Format</mat-label>
            <mat-select formControlName="format">
              <mat-option value="wav">WAV</mat-option>
              <mat-option value="mp3">MP3</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="loading() || form.invalid">
              {{ loading() ? 'Generating...' : 'Generate Satsang' }}
            </button>
          </div>
        </form>
      </mat-card>

      <mat-card class="result-card" *ngIf="current() as satsang">
        <div class="result-head">
          <h3>{{ satsang.mainTheme }}</h3>
          <span>{{ satsang.mood }}</span>
        </div>

        <audio *ngIf="audioUrl()" class="audio" controls [src]="audioUrl()"></audio>
        <video *ngIf="videoUrl()" class="video" controls [src]="videoUrl()"></video>

        <div class="result-actions">
          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="generateAudio()"
            [disabled]="loading() || !current() || audioGenerated()"
          >
            {{ audioGenerated() ? 'Audio Generated' : 'Generate Audio' }}
          </button>
          <button mat-stroked-button type="button" (click)="downloadCurrent()" [disabled]="!current()">
            Download Audio
          </button>
          <button
            mat-flat-button
            color="accent"
            type="button"
            (click)="generateVideo()"
            [disabled]="loading() || !current() || videoGenerated()"
          >
            {{ videoGenerated() ? 'Video Generated' : 'Generate Video' }}
          </button>
          <button mat-stroked-button type="button" (click)="downloadVideo()" [disabled]="!current()">
            Download Video
          </button>
        </div>

        <pre class="script">{{ satsang.script }}</pre>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .satsang-page { display: grid; gap: 1rem; }
      .form-card, .result-card {
        background: rgba(17, 24, 39, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .sub { opacity: 0.8; margin-bottom: 1rem; }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
      }
      .actions { grid-column: 1 / -1; }
      .result-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
      .audio { width: 100%; margin: 0.75rem 0; }
      .video { width: 100%; margin: 0.75rem 0; border-radius: 10px; }
      .result-actions { margin-bottom: 0.75rem; }
      .script {
        white-space: pre-wrap;
        background: rgba(0,0,0,0.22);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 1rem;
        line-height: 1.7;
        max-height: 60vh;
        overflow: auto;
      }
    `,
  ],
})
export class SatsangPageComponent implements OnDestroy {
  private readonly satsangService = inject(SatsangService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly current = signal<SatsangItem | null>(null);
  readonly audioBlob = signal<Blob | null>(null);
  readonly audioUrl = signal<string | null>(null);
  readonly audioGenerated = signal(false);
  readonly videoBlob = signal<Blob | null>(null);
  readonly videoUrl = signal<string | null>(null);
  readonly videoGenerated = signal(false);

  readonly moods = [
    'Shant',
    'Sad',
    'Tensed',
    'Depressed',
    'Crying',
    'Karuna',
    'Prerna',
    'Utsah',
    'Gehra Chintan',
  ];

  readonly themes = [
    'Financial problem',
    'In-laws fights',
    'Office problems',
    'Problem in son\'s life',
    'Relationship stress',
    'Health anxiety',
    'Fear of future',
    'Loneliness',
    'Anger and guilt',
    'Parenting pressure',
    'Career confusion',
    'Family misunderstandings',
    'Loss and grief',
    'Faith during tough times',
    'Other',
  ];

  readonly form = new FormGroup({
    mood: new FormControl<string>('Shant', { nonNullable: true, validators: [Validators.required] }),
    mainTheme: new FormControl<string>('Financial problem', { nonNullable: true, validators: [Validators.required, Validators.maxLength(180)] }),
    customTheme: new FormControl<string>('', { nonNullable: true, validators: [Validators.maxLength(180)] }),
    voiceId: new FormControl<string>('Kore', { nonNullable: true }),
    format: new FormControl<'mp3' | 'wav'>('wav', { nonNullable: true }),
  });

  generate() {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    const value = this.form.getRawValue();
    const selectedTheme =
      value.mainTheme === 'Other'
        ? value.customTheme.trim()
        : value.mainTheme;
    if (!selectedTheme) {
      this.loading.set(false);
      this.snackBar.open('Please enter a custom theme.', 'Close', {
        duration: 2500,
      });
      return;
    }
    this.satsangService
      .create({
        mood: value.mood,
        mainTheme: selectedTheme,
        voiceId: value.voiceId?.trim() || undefined,
        format: value.format,
      })
      .subscribe({
        next: (result) => {
          this.current.set(result);
          this.audioGenerated.set(false);
          this.videoGenerated.set(Boolean(result.videoGeneratedAt));
          this.clearAudioState();
          this.clearVideoState();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Satsang generation failed. Check Gemini config.', 'Close', {
            duration: 3500,
          });
        },
      });
  }

  private fetchAudio(id: string) {
    this.satsangService.downloadAudio(id).subscribe({
      next: (blob) => {
        const prev = this.audioUrl();
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        this.audioBlob.set(blob);
        this.audioUrl.set(URL.createObjectURL(blob));
        this.audioGenerated.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Generated script saved, but audio fetch failed.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  downloadCurrent() {
    const satsang = this.current();
    if (!satsang) return;
    this.satsangService.downloadAudio(satsang._id).subscribe({
      next: (blob) => {
        this.triggerDownload(
          blob,
          `guruji-satsang-${satsang.mood.toLowerCase().replace(/\s+/g, '-')}.${satsang.format}`,
        );
      },
      error: () => {
        this.snackBar.open('Download failed. Please try again.', 'Close', {
          duration: 2500,
        });
      },
    });
  }

  generateAudio() {
    const satsang = this.current();
    if (!satsang || this.loading() || this.audioGenerated()) {
      return;
    }
    this.loading.set(true);
    this.fetchAudio(satsang._id);
  }

  generateVideo() {
    const satsang = this.current();
    if (!satsang || this.loading() || this.videoGenerated()) {
      return;
    }
    this.loading.set(true);
    const useBlob = (audio: Blob) => {
      generateSatsangCanvasVideo({ audioBlob: audio, width: 1920, height: 1080, fps: 30 })
        .then((video) => {
          const prev = this.videoUrl();
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          this.videoBlob.set(video);
          this.videoUrl.set(URL.createObjectURL(video));
          this.videoGenerated.set(true);
          this.loading.set(false);
        })
        .catch(() => {
          this.loading.set(false);
          this.snackBar.open('Canvas video generation failed in this browser.', 'Close', {
            duration: 3000,
          });
        });
    };

    const existingAudio = this.audioBlob();
    if (existingAudio) {
      useBlob(existingAudio);
      return;
    }

    this.satsangService.downloadAudio(satsang._id).subscribe({
      next: (audio) => {
        useBlob(audio);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Audio fetch failed. Generate audio first.', 'Close', {
          duration: 2600,
        });
      },
    });
  }

  downloadVideo() {
    const satsang = this.current();
    const localVideo = this.videoBlob();
    if (localVideo) {
      this.triggerDownload(localVideo, `guruji-satsang-video-${satsang?._id ?? 'local'}.webm`);
      return;
    }
    if (!satsang) {
      return;
    }
    this.satsangService.downloadVideo(satsang._id).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `guruji-satsang-video-${satsang._id}.mp4`);
      },
      error: () => {
        this.snackBar.open('Video download failed. Generate video first.', 'Close', {
          duration: 2600,
        });
      },
    });
  }

  private clearAudioState() {
    const prev = this.audioUrl();
    if (prev) {
      URL.revokeObjectURL(prev);
    }
    this.audioUrl.set(null);
    this.audioBlob.set(null);
  }

  private clearVideoState() {
    const prev = this.videoUrl();
    if (prev) {
      URL.revokeObjectURL(prev);
    }
    this.videoUrl.set(null);
    this.videoBlob.set(null);
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }

  ngOnDestroy() {
    this.clearAudioState();
    this.clearVideoState();
  }
}
