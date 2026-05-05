import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TtsService } from '../../core/tts/tts.service';

@Component({
  standalone: true,
  selector: 'app-tts-lab-page',
  imports: [
    NgIf,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="lab-wrap">
      <div class="lab-card">

        <!-- Header -->
        <div class="lab-header">
          <div class="lab-title">
            <span class="mic-dot"></span>
            <div>
              <h1>TTS Lab</h1>
              <p class="subtitle">Vaibhav's voice &middot; XTTS v2 &middot; English + Hinglish</p>
            </div>
          </div>
        </div>

        <!-- Text input -->
        <mat-form-field appearance="outline" class="text-field">
          <mat-label>Enter your text</mat-label>
          <textarea
            matInput
            [(ngModel)]="text"
            rows="7"
            maxlength="10000"
            placeholder="Type in English or Hinglish, e.g. 'Yaar kya hal hai, aaj ka din ekdum fire tha!'"
          ></textarea>
          <mat-hint align="end">{{ text.length }} / 10,000</mat-hint>
        </mat-form-field>

        <!-- Controls row -->
        <div class="controls-row">
          <div class="format-group">
            <span class="label-sm">Format</span>
            <mat-button-toggle-group
              [value]="format()"
              (change)="format.set($event.value)"
              aria-label="Audio format"
            >
              <mat-button-toggle value="mp3">MP3</mat-button-toggle>
              <mat-button-toggle value="wav">WAV</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <button
            mat-flat-button
            class="generate-btn"
            [disabled]="loading() || !text.trim()"
            (click)="generate()"
          >
            <mat-spinner *ngIf="loading()" diameter="18" class="btn-spinner"></mat-spinner>
            <mat-icon *ngIf="!loading()">graphic_eq</mat-icon>
            {{ loading() ? 'Generating...' : 'Generate Voice' }}
          </button>
        </div>

        <!-- Error -->
        <div class="error-banner" *ngIf="error()">
          <mat-icon>error_outline</mat-icon>
          {{ error() }}
        </div>

        <!-- Audio player -->
        <div class="player-card" *ngIf="safeAudioSrc()">
          <div class="player-header">
            <mat-icon class="waveform-icon">graphic_eq</mat-icon>
            <span>Ready to play</span>
            <span class="badge-format">{{ format().toUpperCase() }}</span>
          </div>
          <audio #audioEl [src]="safeAudioSrc()" controls class="audio-el"></audio>
          <button mat-stroked-button class="dl-btn" (click)="download()">
            <mat-icon>download</mat-icon>
            Download {{ format().toUpperCase() }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .lab-wrap {
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .lab-card {
      width: 100%;
      max-width: 760px;
      background: rgba(24, 26, 39, 0.75);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 24px;
      padding: 2rem 2.25rem 2.25rem;
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .lab-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .lab-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mic-dot {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, #34d399, #60a5fa);
      box-shadow: 0 0 20px rgba(96,165,250,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .subtitle {
      margin: 0;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.02em;
    }

    .text-field {
      width: 100%;
    }

    .controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .format-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .label-sm {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .generate-btn {
      background: linear-gradient(135deg, #34d399, #60a5fa) !important;
      color: #0d0e18 !important;
      font-weight: 700;
      letter-spacing: 0.03em;
      padding: 0 1.75rem;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 12px !important;
    }

    .generate-btn:disabled {
      opacity: 0.45;
    }

    .btn-spinner {
      display: inline-block;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.25);
      color: #fca5a5;
      font-size: 0.875rem;
    }

    .player-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .player-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
    }

    .waveform-icon {
      color: #34d399;
      font-size: 1.1rem;
    }

    .badge-format {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(96,165,250,0.15);
      color: #93c5fd;
      letter-spacing: 0.05em;
    }

    .audio-el {
      width: 100%;
      border-radius: 10px;
      accent-color: #60a5fa;
    }

    .dl-btn {
      align-self: flex-start;
      border-color: rgba(255,255,255,0.15) !important;
    }
  `],
})
export class TtsLabPageComponent implements OnDestroy {
  @ViewChild('audioEl') audioElRef?: ElementRef<HTMLAudioElement>;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly ttsService = inject(TtsService);
  private readonly snackBar = inject(MatSnackBar);

  text = '';
  readonly format = signal<'mp3' | 'wav'>('mp3');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private blobUrl = signal<string | null>(null);
  private currentBlob: Blob | null = null;
  private previousUrl: string | null = null;

  // Blob URLs are safe — they reference local memory we created, not external URLs
  readonly safeAudioSrc = computed(() => {
    const url = this.blobUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  generate() {
    const text = this.text.trim();
    if (!text || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    this.ttsService.synthesize(text, this.format()).subscribe({
      next: (blob) => {
        if (this.previousUrl) URL.revokeObjectURL(this.previousUrl);
        const url = URL.createObjectURL(blob);
        this.previousUrl = url;
        this.currentBlob = blob;
        this.blobUrl.set(url);
        this.loading.set(false);
        // Small delay lets Angular render the <audio> element before we play
        setTimeout(() => this.audioElRef?.nativeElement.play(), 80);
      },
      error: () => {
        this.error.set(
          'Synthesis failed. Make sure the TTS service is running on port 8001.',
        );
        this.loading.set(false);
      },
    });
  }

  download() {
    if (!this.previousUrl) return;
    const a = document.createElement('a');
    a.href = this.previousUrl;
    a.download = `tts-output.${this.format()}`;
    a.click();
  }

  ngOnDestroy() {
    if (this.previousUrl) URL.revokeObjectURL(this.previousUrl);
  }
}
