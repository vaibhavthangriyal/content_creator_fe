import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ArticlesService } from '../../core/articles/articles.service';
import { GenerationsService } from '../../core/generations/generations.service';
import { Article } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-article-detail-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  template: `
    <section class="detail" *ngIf="article() as item">
      <mat-card class="overview">
        <p class="badge">{{ item.category | titlecase }}</p>
        <h1>{{ item.title }}</h1>
        <p class="meta">{{ item.sourceName }} • {{ item.publishedAt | date: 'medium' }}</p>
        <p class="summary">{{ item.summary }}</p>
        <div class="actions">
          <a mat-button color="primary" [href]="item.url" target="_blank">View original</a>
        </div>
      </mat-card>

      <mat-card class="generator">
        <h2>Generation controls</h2>
        <p class="helper">Tune tone, platform focus, and default language before generating.</p>
        <form [formGroup]="form" (ngSubmit)="generate()">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Language</mat-label>
              <mat-select formControlName="language">
                <mat-option value="english">English</mat-option>
                <mat-option value="hinglish">Hinglish</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Tone</mat-label>
              <mat-select formControlName="tone">
                <mat-option value="neutral">Neutral</mat-option>
                <mat-option value="dramatic">Dramatic</mat-option>
                <mat-option value="excited">Excited</mat-option>
                <mat-option value="educational">Educational</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Video type</mat-label>
              <mat-select formControlName="videoType">
                <mat-option value="explainer">Explainer</mat-option>
                <mat-option value="news">News react</mat-option>
                <mat-option value="story">Narrative story</mat-option>
                <mat-option value="deep-dive">Deep dive</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Video length</mat-label>
              <mat-select formControlName="videoLength">
                <mat-option value="long">Long form (8-12 min)</mat-option>
                <mat-option value="short">Short form (60-90 sec)</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Platform focus</mat-label>
              <mat-select formControlName="platformFocus">
                <mat-option value="youtube">YouTube</mat-option>
                <mat-option value="instagram">Instagram</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-slide-toggle formControlName="save">Save to history</mat-slide-toggle>
          <button mat-flat-button color="primary" [disabled]="loading()">
            {{ loading() ? 'Generating...' : 'Generate content' }}
          </button>
        </form>
        <mat-progress-bar *ngIf="loading()" mode="indeterminate"></mat-progress-bar>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .detail {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
      }
      mat-card {
        background: rgba(12, 14, 22, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        padding: 2rem;
      }
      .badge {
        letter-spacing: 0.3rem;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .summary {
        color: var(--text-muted);
        line-height: 1.6;
      }
      .generator .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      button {
        margin-top: 1rem;
      }
    `,
  ],
})
export class ArticleDetailPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    language: ['english'],
    tone: ['neutral'],
    videoType: ['explainer'],
    videoLength: ['long'],
    platformFocus: ['youtube'],
    save: [true],
  });

  readonly loading = signal(false);
  readonly article = signal<Article | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly articlesService: ArticlesService,
    private readonly generationsService: GenerationsService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.articlesService.findOne(id).subscribe((article) => this.article.set(article));
  }

  generate() {
    const article = this.article();
    if (!article) return;
    this.loading.set(true);
    this.generationsService
      .create({
        articleId: article._id,
        ...this.form.value,
      })
      .subscribe({
        next: (generation) => {
          this.loading.set(false);
          this.router.navigate(['/generations', generation._id]);
        },
        error: () => this.loading.set(false),
      });
  }
}
