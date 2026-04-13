import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ArticlesService } from '../../core/articles/articles.service';
import { Article } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="dashboard">
      <header class="hero">
        <div class="hero__summary">
          <p class="eyebrow">Live editorial briefing</p>
          <h1>{{ selectedCategoryLabel() }} stories on deck</h1>
          <p class="subcopy">
            Curated intelligence across tech, science, space, math, and history. Pick a signal, spin a narrative, publish faster.
          </p>
          <div class="hero__badges">
            <span class="badge">Category • {{ selectedCategoryLabel() }}</span>
            <span class="badge">Filters • {{ filterSummary() }}</span>
            <span class="badge">Updated • {{ lastUpdated() || 'just now' }}</span>
          </div>
        </div>
        <div class="hero__stats">
          <div class="stat">
            <p class="label">Articles</p>
            <p class="value">{{ total() }}</p>
            <p class="hint">in feed</p>
          </div>
          <div class="stat">
            <p class="label">Generated</p>
            <p class="value">{{ generatedCount() }}</p>
            <p class="hint">with scripts</p>
          </div>
          <div class="stat">
            <p class="label">Sources</p>
            <p class="value">{{ sources().length || 0 }}</p>
            <p class="hint">active</p>
          </div>
          <div class="stat">
            <p class="label">Status</p>
            <p class="value">{{ refreshing() ? 'Refreshing' : 'Live' }}</p>
            <p class="hint">feed health</p>
          </div>
        </div>
      </header>

      <section class="filters-card">
        <form class="filters" [formGroup]="filterForm" (ngSubmit)="search()">
          <mat-form-field appearance="outline">
            <mat-label>Search keywords</mat-label>
            <input matInput formControlName="search" placeholder="quantum, launch, climate" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Source</mat-label>
            <mat-select formControlName="source">
              <mat-option value="">All sources</mat-option>
              <mat-option *ngFor="let source of sources()" [value]="source">{{ source }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>From</mat-label>
            <input matInput [matDatepicker]="fromPicker" formControlName="fromDate" />
            <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>To</mat-label>
            <input matInput [matDatepicker]="toPicker" formControlName="toDate" />
            <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
          <div class="toggle-group">
            <mat-slide-toggle formControlName="generated">Generated</mat-slide-toggle>
            <mat-slide-toggle formControlName="saved">Saved</mat-slide-toggle>
          </div>
          <div class="filter-actions">
            <button mat-stroked-button type="button" (click)="resetFilters()">Reset</button>
            <button mat-flat-button color="primary">Apply</button>
            <button
              mat-stroked-button
              color="accent"
              type="button"
              (click)="refreshFeed()"
              [disabled]="refreshing()"
            >
              <mat-icon class="spin" *ngIf="refreshing()">autorenew</mat-icon>
              <mat-icon *ngIf="!refreshing()">refresh</mat-icon>
              {{ refreshing() ? 'Refreshing…' : 'Refresh feed' }}
            </button>
          </div>
        </form>
      </section>

      <div class="category-pills">
        <button
          *ngFor="let category of categories"
          mat-button
          [class.active]="category.value === selectedCategory()"
          (click)="selectCategory(category.value)"
        >
          {{ category.label }}
        </button>
      </div>

      <mat-progress-bar
        *ngIf="loading()"
        mode="indeterminate"
        color="accent"
      ></mat-progress-bar>

      <section class="article-grid" [class.loading]="loading()">
        <article class="article-card" *ngFor="let article of articles()">
          <div class="badge" [style.background]="articleColors[article.category]">{{ article.category }}</div>
          <h3>{{ article.title }}</h3>
          <p>{{ article.summary }}</p>
          <div class="meta">
            <span>{{ article.sourceName }}</span>
            <span>{{ article.publishedAt | date: 'mediumDate' }}</span>
          </div>
          <div class="actions">
            <a mat-stroked-button color="primary" [routerLink]="['/articles', article._id]">Open</a>
            <button mat-button (click)="openArticleUrl(article.url)" type="button">Source</button>
          </div>
        </article>
        <ng-container *ngIf="loading()">
          <article
            class="article-card skeleton"
            *ngFor="let placeholder of skeletons"
            role="presentation"
          >
            <div class="shimmer title"></div>
            <div class="shimmer lines"></div>
            <div class="shimmer lines"></div>
          </article>
        </ng-container>
        <div class="empty" *ngIf="!loading() && !articles().length">
          No articles match this filter yet. Refresh or try another category.
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .hero {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        background: radial-gradient(circle at top right, rgba(96, 165, 250, 0.25), transparent 45%),
          rgba(10, 12, 22, 0.95);
        padding: 2rem;
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .hero__summary {
        flex: 1 1 360px;
      }
      .hero__stats {
        flex: 1 1 320px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
      }
      .stat {
        padding: 1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .stat .label {
        text-transform: uppercase;
        letter-spacing: 0.25rem;
        font-size: 0.68rem;
        color: var(--text-muted);
      }
      .stat .value {
        font-size: 1.8rem;
        margin: 0.15rem 0;
      }
      .stat .hint {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      .hero__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .hero__badges .badge {
        border-radius: 999px;
        padding: 0.25rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        font-size: 0.78rem;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.3rem;
        color: var(--text-muted);
        font-size: 0.8rem;
      }
      h1 {
        font-size: clamp(2rem, 4vw, 3rem);
        margin: 0.2rem 0;
      }
      .subcopy {
        color: var(--text-muted);
        max-width: 640px;
      }
      .filters-card {
        background: rgba(13, 15, 24, 0.85);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 1.5rem;
      }
      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        align-items: center;
      }
      .filters mat-form-field {
        width: 100%;
      }
      .toggle-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .filter-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .category-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .category-pills button {
        border-radius: 999px;
        padding-inline: 1.25rem;
      }
      .category-pills button.active {
        background: rgba(79, 209, 197, 0.15);
        color: var(--accent-tech);
      }
      .article-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.25rem;
      }
      .article-card {
        padding: 1.5rem;
        border-radius: 18px;
        background: rgba(10, 12, 20, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .badge {
        align-self: flex-start;
        border-radius: 999px;
        padding: 0.1rem 0.75rem;
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.2rem;
        color: #050505;
        font-weight: 600;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        color: var(--text-muted);
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        margin-top: auto;
      }
      .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 16px;
      }
      .skeleton {
        position: relative;
        overflow: hidden;
      }
      .skeleton .shimmer {
        height: 16px;
        border-radius: 999px;
        width: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.05),
          rgba(255, 255, 255, 0.15),
          rgba(255, 255, 255, 0.05)
        );
        animation: shimmer 1.6s infinite;
      }
      .skeleton .title {
        height: 24px;
        margin-bottom: 1rem;
      }
      .skeleton .lines {
        margin-bottom: 0.5rem;
      }
      @keyframes shimmer {
        from {
          background-position: -200px 0;
        }
        to {
          background-position: 200px 0;
        }
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class DashboardPageComponent implements OnInit {
  readonly categories = [
    { label: 'Tech', value: 'tech' },
    { label: 'Science', value: 'science' },
    { label: 'Space', value: 'space' },
    { label: 'Math', value: 'math' },
    { label: 'Tech History', value: 'tech-history' },
  ];

  readonly articleColors: Record<string, string> = {
    tech: 'linear-gradient(135deg, #4fd1c5, #22d3ee)',
    science: 'linear-gradient(135deg, #c084fc, #a855f7)',
    space: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    math: 'linear-gradient(135deg, #fbbf24, #f97316)',
    'tech-history': 'linear-gradient(135deg, #f472b6, #fb7185)',
  };

  readonly selectedCategory = signal(this.categories[0].value);
  readonly loading = signal(false);
  readonly refreshing = signal(false);
  readonly articles = signal<Article[]>([]);
  readonly sources = signal<string[]>([]);
  readonly skeletons = Array.from({ length: 4 });
  readonly total = signal(0);
  readonly generatedCount = signal(0);
  readonly lastUpdated = signal('');
  readonly filterSummary = signal('All filters');

  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly selectedCategoryLabel = computed(() => {
    return (
      this.categories.find((cat) => cat.value === this.selectedCategory())?.label ??
      'All'
    );
  });

  readonly filterForm = this.fb.group({
    search: [''],
    source: [''],
    fromDate: [''],
    toDate: [''],
    generated: [false],
    saved: [false],
  });

  constructor(private readonly articlesService: ArticlesService) {
    this.filterForm.valueChanges.subscribe(() => this.updateFilterSummary());
  }

  ngOnInit() {
    this.loadArticles();
    this.updateFilterSummary();
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.loadArticles();
  }

  search() {
    this.loadArticles();
  }

  openArticleUrl(url: string) {
    window.open(url, '_blank');
  }

  refreshFeed() {
    if (this.refreshing()) {
      return;
    }
    this.refreshing.set(true);
    this.articlesService.refresh(this.selectedCategory()).subscribe({
      next: () => {
        this.refreshing.set(false);
        this.snackBar.open('Feed refreshed', 'Close', { duration: 2000 });
        this.loadArticles();
      },
      error: () => {
        this.refreshing.set(false);
        this.snackBar.open('Unable to refresh feed', 'Close', {
          duration: 2500,
        });
      },
    });
  }

  private loadArticles() {
    this.loading.set(true);
    this.articlesService
      .list({
        category: this.selectedCategory(),
        search: this.filterForm.value.search,
        source: this.filterForm.value.source,
        fromDate: this.filterForm.value.fromDate
          ? new Date(this.filterForm.value.fromDate).toISOString()
          : undefined,
        toDate: this.filterForm.value.toDate
          ? new Date(this.filterForm.value.toDate).toISOString()
          : undefined,
        generated: this.filterForm.value.generated || undefined,
        saved: this.filterForm.value.saved || undefined,
      })
      .subscribe({
        next: (response) => {
          const items = response.items ?? [];
          this.articles.set(items);
          this.sources.set(
            Array.from(new Set(items.map((item) => item.sourceName))).sort(),
          );
          this.total.set(response.total ?? items.length ?? 0);
          this.generatedCount.set(items.filter((item) => item.hasGeneratedContent).length);
          this.lastUpdated.set(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  resetFilters() {
    this.filterForm.reset({
      search: '',
      source: '',
      fromDate: '',
      toDate: '',
      generated: false,
      saved: false,
    });
    this.updateFilterSummary();
    this.loadArticles();
  }

  private updateFilterSummary() {
    const value = this.filterForm.getRawValue();
    const chips: string[] = [];
    if (value.search) {
      chips.push(`Search: ${value.search}`);
    }
    if (value.source) {
      chips.push(`Source: ${value.source}`);
    }
    if (value.fromDate) {
      chips.push(`From: ${new Date(value.fromDate).toLocaleDateString()}`);
    }
    if (value.toDate) {
      chips.push(`To: ${new Date(value.toDate).toLocaleDateString()}`);
    }
    if (value.generated) {
      chips.push('Generated only');
    }
    if (value.saved) {
      chips.push('Saved only');
    }
    this.filterSummary.set(chips.length ? chips.join(' · ') : 'All filters');
  }
}
