import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { generateSatsangCanvasVideo } from '../../core/satsang/canvas-video';
import { SatsangService } from '../../core/satsang/satsang.service';
import { SatsangItem } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-satsang-history-page',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="history-page">
      <div class="head">
        <h2>Guruji Satsang History</h2>
        <a mat-stroked-button routerLink="/satsang">Create New</a>
      </div>

      <mat-card class="list-card">
        <ng-container *ngIf="!loading(); else loadingTpl">
          <div *ngIf="items().length; else emptyTpl" class="list">
            <article class="item" *ngFor="let row of items()">
              <div class="meta">
                <h3>{{ row.mainTheme }}</h3>
                <p>{{ row.mood }} • {{ row.createdAt | date:'medium' }}</p>
              </div>
              <button mat-flat-button color="primary" (click)="open(row)">Open</button>
            </article>
          </div>
        </ng-container>
      </mat-card>

      <mat-card class="detail-card" *ngIf="selected() as satsang">
        <h3>{{ satsang.mainTheme }}</h3>
        <p class="muted">{{ satsang.mood }} • {{ satsang.createdAt | date:'medium' }}</p>
        <audio *ngIf="audioUrl()" controls class="audio" [src]="audioUrl()"></audio>
        <video *ngIf="videoUrl()" controls class="video" [src]="videoUrl()"></video>
        <div class="actions">
          <button
            mat-flat-button
            color="primary"
            (click)="generateAudio()"
            [disabled]="loadingAudio() || !selected() || audioGenerated()"
          >
            {{ audioGenerated() ? 'Audio Generated' : 'Generate Audio' }}
          </button>
          <button mat-stroked-button (click)="download()" [disabled]="!selected()">
            Download Audio
          </button>
          <button
            mat-flat-button
            color="accent"
            (click)="generateVideo()"
            [disabled]="loadingVideo() || !selected() || videoGenerated()"
          >
            {{ videoGenerated() ? 'Video Generated' : 'Generate Video' }}
          </button>
          <button mat-stroked-button (click)="downloadVideo()" [disabled]="!selected()">
            Download Video
          </button>
        </div>
        <pre class="script">{{ satsang.script }}</pre>
      </mat-card>

      <ng-template #loadingTpl>
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      </ng-template>

      <ng-template #emptyTpl>
        <p class="empty">No satsang history yet.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `
      .history-page { display: grid; gap: 1rem; }
      .head { display: flex; justify-content: space-between; align-items: center; }
      .list-card, .detail-card {
        background: rgba(17, 24, 39, 0.7);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .list { display: grid; gap: 0.6rem; }
      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.7rem;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .meta h3 { margin: 0 0 0.25rem; }
      .meta p, .muted { margin: 0; opacity: 0.75; }
      .audio { width: 100%; margin: 0.8rem 0; }
      .video { width: 100%; margin: 0.8rem 0; border-radius: 10px; }
      .actions { display: flex; gap: 0.6rem; margin-bottom: 0.8rem; }
      .script {
        margin-top: 0.8rem;
        white-space: pre-wrap;
        max-height: 55vh;
        overflow: auto;
        background: rgba(0, 0, 0, 0.24);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 1rem;
      }
      .loading, .empty { display: grid; place-items: center; min-height: 120px; }
    `,
  ],
})
export class SatsangHistoryPageComponent implements OnDestroy {
  private readonly satsangService = inject(SatsangService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly items = signal<SatsangItem[]>([]);
  readonly selected = signal<SatsangItem | null>(null);
  readonly audioBlob = signal<Blob | null>(null);
  readonly audioUrl = signal<string | null>(null);
  readonly audioGenerated = signal(false);
  readonly loadingAudio = signal(false);
  readonly videoBlob = signal<Blob | null>(null);
  readonly videoUrl = signal<string | null>(null);
  readonly videoGenerated = signal(false);
  readonly loadingVideo = signal(false);

  constructor() {
    this.satsangService.history(1, 25).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load satsang history', 'Close', { duration: 3000 });
      },
    });
  }

  open(item: SatsangItem) {
    this.selected.set(item);
    this.audioGenerated.set(false);
    this.videoGenerated.set(Boolean(item.videoGeneratedAt));
    this.clearAudioState();
    this.clearVideoState();
  }

  generateAudio() {
    const item = this.selected();
    if (!item || this.loadingAudio() || this.audioGenerated()) {
      return;
    }
    this.loadingAudio.set(true);
    this.satsangService.downloadAudio(item._id).subscribe({
      next: (blob) => {
        const prev = this.audioUrl();
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        this.audioBlob.set(blob);
        this.audioUrl.set(URL.createObjectURL(blob));
        this.audioGenerated.set(true);
        this.loadingAudio.set(false);
      },
      error: () => {
        this.loadingAudio.set(false);
        this.snackBar.open('Failed to load satsang audio', 'Close', { duration: 3000 });
      },
    });
  }

  private clearAudioState() {
    const prev = this.audioUrl();
    if (prev) {
      URL.revokeObjectURL(prev);
    }
    this.audioBlob.set(null);
    this.audioUrl.set(null);
  }

  private clearVideoState() {
    const prev = this.videoUrl();
    if (prev) {
      URL.revokeObjectURL(prev);
    }
    this.videoBlob.set(null);
    this.videoUrl.set(null);
  }

  download() {
    const item = this.selected();
    if (!item) {
      return;
    }
    this.satsangService.downloadAudio(item._id).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `guruji-satsang-${item._id}.${item.format}`);
      },
      error: () => {
        this.snackBar.open('Download failed. Please try again.', 'Close', {
          duration: 2500,
        });
      },
    });
  }

  generateVideo() {
    const item = this.selected();
    if (!item || this.loadingVideo() || this.videoGenerated()) {
      return;
    }
    this.loadingVideo.set(true);
    const useAudio = (audio: Blob) => {
      generateSatsangCanvasVideo({ audioBlob: audio, width: 1920, height: 1080, fps: 30 })
        .then((video) => {
          const prev = this.videoUrl();
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          this.videoBlob.set(video);
          this.videoUrl.set(URL.createObjectURL(video));
          this.videoGenerated.set(true);
          this.loadingVideo.set(false);
        })
        .catch(() => {
          this.loadingVideo.set(false);
          this.snackBar.open('Canvas video generation failed in this browser.', 'Close', {
            duration: 3000,
          });
        });
    };

    const existingAudio = this.audioBlob();
    if (existingAudio) {
      useAudio(existingAudio);
      return;
    }

    this.satsangService.downloadAudio(item._id).subscribe({
      next: (audio) => useAudio(audio),
      error: () => {
        this.loadingVideo.set(false);
        this.snackBar.open('Audio fetch failed. Generate audio first.', 'Close', {
          duration: 2600,
        });
      },
    });
  }

  downloadVideo() {
    const item = this.selected();
    const localVideo = this.videoBlob();
    if (localVideo) {
      this.triggerDownload(localVideo, `guruji-satsang-video-${item?._id ?? 'local'}.webm`);
      return;
    }
    if (!item) {
      return;
    }
    this.satsangService.downloadVideo(item._id).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `guruji-satsang-video-${item._id}.mp4`);
      },
      error: () => {
        this.snackBar.open('Video download failed. Generate video first.', 'Close', {
          duration: 2600,
        });
      },
    });
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
