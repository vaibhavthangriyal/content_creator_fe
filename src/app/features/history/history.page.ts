import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GenerationsService } from '../../core/generations/generations.service';
import { Generation } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-history-page',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="history">
      <header>
        <div>
          <p class="eyebrow">Generation history</p>
          <h1>All saved scripts & packages</h1>
        </div>
        <mat-slide-toggle [(ngModel)]="onlySaved" (ngModelChange)="load()">
          Show only saved
        </mat-slide-toggle>
      </header>

      <div class="history-list">
        <article *ngFor="let item of items()" (click)="open(item._id)">
          <div>
            <h3>
              {{ item.inputConfig['videoType'] | titlecase }} —
              {{ item.inputConfig['platformFocus'] }}
            </h3>
            <p class="meta">
              {{ (item.inputConfig['videoLength'] || 'long') | titlecase }} form
            </p>
            <p>{{ item.output.youtubeTitles[0] }}</p>
            <mat-chip-set *ngIf="item.tags?.length">
              <mat-chip *ngFor="let tag of item.tags">{{ tag }}</mat-chip>
            </mat-chip-set>
            <p class="notes" *ngIf="item.notes">{{ item.notes }}</p>
          </div>
          <div class="row-actions">
            <span>{{ item.createdAt | date: 'short' }}</span>
            <button
              mat-icon-button
              aria-label="Copy share link"
              (click)="copyShare(item, $event)"
            >
              <mat-icon>share</mat-icon>
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .history {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      header {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .history-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      article {
        padding: 1rem 1.5rem;
        border-radius: 16px;
        background: rgba(13, 15, 24, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        cursor: pointer;
        transition: border 0.2s ease;
      }
      article:hover {
        border-color: rgba(96, 165, 250, 0.6);
      }
      .meta,
      .notes {
        color: var(--text-muted);
        font-size: 0.85rem;
      }
      .row-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
      }
    `,
  ],
})
export class HistoryPageComponent implements OnInit {
  readonly items = signal<Generation[]>([]);
  onlySaved = true;

  constructor(
    private readonly service: GenerationsService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service
      .history({ saved: this.onlySaved })
      .subscribe((res) => this.items.set(res.items ?? []));
  }

  open(id: string) {
    this.router.navigate(['/generations', id]);
  }

  copyShare(item: Generation, event: Event) {
    event.stopPropagation();
    this.service.createShareLink(item._id).subscribe((res) => {
      navigator.clipboard.writeText(res.shareUrl);
      this.snackBar.open('Share link copied', 'Close', { duration: 2000 });
      this.load();
    });
  }
}
