import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { GenerationsService } from '../../core/generations/generations.service';
import { ShareGenerationPayload } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-share-view-page',
  imports: [CommonModule, MatButtonModule, MatChipsModule],
  template: `
    <section class="share" *ngIf="payload() as data; else state">
      <header>
        <div>
          <p class="eyebrow">Shared Generation</p>
          <h1>{{ data.article.title }}</h1>
          <p class="meta">{{ data.article.sourceName }} • {{ data.article.publishedAt | date: 'medium' }}</p>
          <p class="meta">
            Format: {{ data.generation.inputConfig['videoLength'] || 'long' | titlecase }} •
            {{ data.generation.inputConfig['videoType'] | titlecase }}
          </p>
        </div>
        <a mat-stroked-button color="primary" [href]="data.article.url" target="_blank">Original article</a>
      </header>
      <article class="glass">
        <h2>Script</h2>
        <pre>{{ data.generation.output.script }}</pre>
      </article>
      <article class="glass">
        <h2>YouTube Titles</h2>
        <ul>
          <li *ngFor="let title of data.generation.output.youtubeTitles">{{ title }}</li>
        </ul>
      </article>
      <article class="glass">
        <h2>Instagram Hooks</h2>
        <ul>
          <li *ngFor="let hook of data.generation.output.instagramTitles">{{ hook }}</li>
        </ul>
      </article>
      <article class="glass">
        <h2>Instagram Captions</h2>
        <ul>
          <li *ngFor="let caption of data.generation.output.instagramCaptions">{{ caption }}</li>
        </ul>
      </article>
      <article class="glass">
        <h2>Thumbnail Text</h2>
        <mat-chip-set>
          <mat-chip *ngFor="let thumb of data.generation.output.thumbnailTexts">{{ thumb }}</mat-chip>
        </mat-chip-set>
      </article>
    </section>
    <ng-template #state>
      <div class="state" *ngIf="error(); else loadingTpl">{{ error() }}</div>
    </ng-template>
    <ng-template #loadingTpl>
      <div class="state">Loading shared package...</div>
    </ng-template>
  `,
  styles: [
    `
      .share {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .glass {
        background: rgba(13, 15, 24, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.5rem;
      }
      pre {
        white-space: pre-wrap;
        font-family: 'Space Grotesk', monospace;
      }
      ul {
        padding-left: 1.25rem;
      }
      .state {
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
      }
    `,
  ],
})
export class ShareViewPageComponent implements OnInit {
  readonly payload = signal<ShareGenerationPayload | null>(null);
  readonly error = signal<string>('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly generationsService: GenerationsService,
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.error.set('Missing share token.');
      return;
    }
    this.generationsService.getShared(token).subscribe({
      next: (data) => this.payload.set(data),
      error: () => this.error.set('This share link has expired or is invalid.'),
    });
  }
}
