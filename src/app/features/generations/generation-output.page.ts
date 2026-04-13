import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GenerationsService } from '../../core/generations/generations.service';
import { Generation } from '../../core/types';

@Component({
  standalone: true,
  selector: 'app-generation-output-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <section class="output" *ngIf="generation() as gen">
      <header class="hero">
        <div class="hero__content">
          <p class="eyebrow">Editorial drop</p>
          <h1>
            {{ gen.inputConfig['videoType'] | titlecase }} •
            {{ gen.inputConfig['platformFocus'] | titlecase }} mode
          </h1>
          <p class="meta">
            Updated {{ gen.createdAt | date: 'medium' }} ·
            {{ gen.modelProvider | titlecase }} ·
            {{ gen.modelName }}
          </p>
          <div class="hero__actions">
            <button
              mat-flat-button
              color="primary"
              type="button"
              (click)="copyAll(gen)"
              matTooltip="Copy every output block"
            >
              <mat-icon>library_add</mat-icon>
              <span>Copy package</span>
            </button>
            <button
              mat-flat-button
              color="accent"
              type="button"
             (click)="cloneVoice(gen)"
             [disabled]="voiceLoading()"
              matTooltip="Generate an MP3 narration of this script"
            >
              <mat-icon [class.spin]="voiceLoading()">
                {{ voiceLoading() ? 'autorenew' : 'graphic_eq' }}
              </mat-icon>
              <span>{{ voiceLoading() ? 'Preparing audio…' : 'Clone voice' }}</span>
            </button>
            <button
              mat-stroked-button
              type="button"
              (click)="toggleTeleprompter()"
              matTooltip="{{ teleprompterMode() ? 'Switch back to normal text' : 'Open teleprompter view' }}"
            >
              <mat-icon>{{ teleprompterMode() ? 'close_fullscreen' : 'open_in_full' }}</mat-icon>
              <span>{{ teleprompterMode() ? 'Normal view' : 'Teleprompter' }}</span>
            </button>
            <button
              mat-stroked-button
              color="primary"
              type="button"
              (click)="regenerate(gen._id)"
              matTooltip="Generate a fresh variation"
            >
              <mat-icon>autorenew</mat-icon>
              <span>Regenerate</span>
            </button>
            <button
              mat-stroked-button
              type="button"
              (click)="toggleSave(gen)"
              matTooltip="{{ gen.saved ? 'Remove from history' : 'Save for later' }}"
            >
              <mat-icon>{{ gen.saved ? 'bookmark_remove' : 'bookmark_add' }}</mat-icon>
              <span>{{ gen.saved ? 'Unsave' : 'Save' }}</span>
            </button>
          </div>
        </div>
        <div class="hero__stats">
          <div class="stat">
            <small>Language</small>
            <span>{{ gen.inputConfig['language'] | titlecase }}</span>
          </div>
          <div class="stat">
            <small>Tone</small>
            <span>{{ gen.inputConfig['tone'] | titlecase }}</span>
          </div>
          <div class="stat">
            <small>Length</small>
            <span>{{ (gen.inputConfig['videoLength'] || 'long') | titlecase }}</span>
          </div>
          <div class="stat">
            <small>Tokens</small>
            <span>{{ gen.tokenUsage || '—' }}</span>
          </div>
        </div>
      </header>

      <section class="glass meta-panel">
        <div class="section-header">
          <div>
            <h2>Notes & Tags</h2>
            <p class="helper">Capture editorial context, angles, or CTAs.</p>
          </div>
          <div class="share-actions">
            <button
              mat-stroked-button
              color="accent"
              type="button"
              (click)="share(gen._id)"
              matTooltip="Create a public share link"
            >
              <mat-icon>link</mat-icon>
              <span>{{ shareUrl() ? 'Refresh link' : 'Share link' }}</span>
            </button>
            <button
              mat-icon-button
              type="button"
              *ngIf="shareUrl()"
              (click)="copyShareLink()"
              aria-label="Copy share link"
              matTooltip="Copy shareable link"
            >
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
        </div>
        <div class="notes-grid">
          <mat-form-field appearance="outline" class="notes-field">
            <mat-label>Notes</mat-label>
            <textarea
              matInput
              [formControl]="notesControl"
              rows="4"
              placeholder="Context, angle, CTA..."
            ></textarea>
          </mat-form-field>
          <div class="tags">
            <mat-chip-set>
              <mat-chip
                *ngFor="let tag of tags(); let i = index"
                (removed)="removeTag(i)"
                [removable]="true"
              >
                {{ tag }}
                <button mat-icon-button matChipRemove aria-label="Remove tag">
                  <mat-icon>close</mat-icon>
                </button>
              </mat-chip>
              <mat-form-field appearance="outline">
                <mat-label>Add tag</mat-label>
                <input
                  matInput
                  [formControl]="tagInput"
                  (keyup.enter)="addTag()"
                  placeholder="e.g. hook, short"
                />
              </mat-form-field>
            </mat-chip-set>
          </div>
        </div>
        <div class="meta-actions">
          <button mat-flat-button color="primary" (click)="saveNotes()">Save notes</button>
          <button mat-button (click)="revokeShare()" *ngIf="shareUrl()">Revoke link</button>
        </div>
        <p class="share-link" *ngIf="shareUrl()">
          Share URL: <a [href]="shareUrl()" target="_blank">{{ shareUrl() }}</a>
        </p>
      </section>

      <div class="grid">
        <section class="glass script-panel" [class.teleprompter]="teleprompterMode()">
          <div class="section-header">
            <div>
              <h2>Script narrative</h2>
              <p class="helper">Split into digestible beats for quick editing.</p>
            </div>
            <button mat-icon-button (click)="copy(gen.output.script)" matTooltip="Copy script">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <div class="script-beats">
            <article class="beat" *ngFor="let block of splitScript(gen.output.script); let idx = index">
              <span class="index">{{ (idx + 1) | number: '2.0' }}</span>
              <p>{{ block }}</p>
            </article>
          </div>
        </section>

        <section class="glass list-panel">
          <div class="section-header">
            <h2>YouTube Titles</h2>
            <button mat-icon-button (click)="copyList(gen.output.youtubeTitles)" matTooltip="Copy titles">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <ol>
            <li *ngFor="let title of gen.output.youtubeTitles">{{ title }}</li>
          </ol>
        </section>

        <section class="glass list-panel">
          <div class="section-header">
            <h2>Instagram Hooks</h2>
            <button mat-icon-button (click)="copyList(gen.output.instagramTitles)" matTooltip="Copy hooks">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <ol>
            <li *ngFor="let hook of gen.output.instagramTitles">{{ hook }}</li>
          </ol>
        </section>

        <section class="glass list-panel">
          <div class="section-header">
            <h2>Instagram Captions</h2>
            <button mat-icon-button (click)="copyList(gen.output.instagramCaptions)" matTooltip="Copy captions">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <ol>
            <li *ngFor="let caption of gen.output.instagramCaptions">{{ caption }}</li>
          </ol>
        </section>

        <section class="glass list-panel">
          <div class="section-header">
            <h2>Thumbnail Text</h2>
            <button mat-icon-button (click)="copyList(gen.output.thumbnailTexts)" matTooltip="Copy thumbnail text">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <mat-chip-set class="thumb-set">
            <mat-chip *ngFor="let thumb of gen.output.thumbnailTexts">{{ thumb }}</mat-chip>
          </mat-chip-set>
        </section>
      </div>
    </section>
  `,
  styles: [
    `
      .output {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .hero {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 2rem;
        border-radius: 28px;
        background: radial-gradient(circle at top right, rgba(96, 165, 250, 0.25), transparent 40%),
          rgba(10, 14, 25, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.07);
      }
      .hero__content {
        flex: 1 1 360px;
      }
      .hero__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .hero__actions button mat-icon {
        margin-right: 0.35rem;
      }
      .hero__actions button mat-icon.spin {
        animation: spin 1s linear infinite;
      }
      .hero__stats {
        flex: 1 1 240px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
      }
      .stat {
        padding: 1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .stat small {
        text-transform: uppercase;
        letter-spacing: 0.2rem;
        font-size: 0.7rem;
        color: var(--text-muted);
      }
      .stat span {
        display: block;
        font-size: 1.4rem;
        margin-top: 0.25rem;
      }
      .meta-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .notes-grid {
        display: grid;
        grid-template-columns: minmax(240px, 2fr) minmax(180px, 1fr);
        gap: 1rem;
      }
      .notes-field textarea {
        font-family: 'Space Grotesk', sans-serif;
      }
      .tags mat-form-field {
        min-width: 180px;
      }
      .share-link {
        color: var(--text-muted);
        font-size: 0.9rem;
      }
      .share-actions,
      .meta-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      .glass {
        background: rgba(13, 15, 24, 0.85);
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 1.5rem;
      }
      .script-panel {
        grid-column: 1 / -1;
      }
      .script-panel.teleprompter {
        position: relative;
        max-height: 60vh;
        overflow-y: auto;
        background: rgba(5, 6, 11, 0.95);
        border: 1px solid rgba(79, 209, 197, 0.3);
      }
      .script-panel.teleprompter .beat {
        padding: 1.25rem;
        font-size: 1.35rem;
        line-height: 1.8rem;
      }
      .script-panel.teleprompter .index {
        font-size: 0.9rem;
      }
      .script-beats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
      }
      .beat {
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.02);
      }
      .beat .index {
        font-size: 0.75rem;
        letter-spacing: 0.3rem;
        color: var(--text-muted);
        display: block;
        margin-bottom: 0.35rem;
      }
      pre {
        white-space: pre-wrap;
        font-family: 'Space Grotesk', monospace;
      }
      ol,
      ul {
        padding-left: 1rem;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .helper {
        color: var(--text-muted);
        margin: 0.25rem 0 0;
      }
      .thumb-set {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
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
export class GenerationOutputPageComponent implements OnInit {
  readonly generation = signal<Generation | null>(null);
  readonly tags = signal<string[]>([]);
  readonly shareUrl = signal<string | null>(null);
  readonly notesControl = new FormControl('', { nonNullable: true });
  readonly tagInput = new FormControl('');
  readonly teleprompterMode = signal(false);
  readonly voiceLoading = signal(false);

  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private readonly service: GenerationsService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.load(id);
  }

  cloneVoice(generation: Generation) {
    if (this.voiceLoading()) return;
    this.voiceLoading.set(true);
    this.service
      .downloadVoice(generation._id, {
        language: generation.inputConfig['language'],
      })
      .subscribe({
        next: (blob) => {
          const filename = this.buildVoiceFilename(generation);
          this.saveBlob(blob, filename);
          this.notify('Voice clip ready');
          this.voiceLoading.set(false);
        },
        error: () => {
          this.notify('Voice cloning failed');
          this.voiceLoading.set(false);
        },
      });
  }

  regenerate(id: string) {
    this.service.regenerate(id, {}).subscribe((gen) => this.generation.set(gen));
  }

  toggleSave(generation: Generation) {
    this.service
      .toggleSave(generation._id, !generation.saved)
      .subscribe((updated) => this.generation.set(updated));
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
    this.notify('Copied to clipboard');
  }

  copyList(items: string[]) {
    this.copy(items.join('\n'));
  }

  copyAll(gen: Generation) {
    const bundle = `Script:\n${gen.output.script}\n\nYouTube Titles:\n${gen.output.youtubeTitles.join(
      '\n',
    )}\n\nInstagram Hooks:\n${gen.output.instagramTitles.join(
      '\n',
    )}\n\nInstagram Captions:\n${gen.output.instagramCaptions.join(
      '\n',
    )}\n\nThumbnail Text:\n${gen.output.thumbnailTexts.join('\n')}`;
    this.copy(bundle);
    this.notify('Full package copied');
  }

  splitScript(script: string) {
    return script.split(/\n\s*\n/).filter((block) => block?.trim().length);
  }

  toggleTeleprompter() {
    this.teleprompterMode.update((value) => !value);
  }

  addTag() {
    const value = this.tagInput.value?.trim();
    if (!value) return;
    const updated = [...this.tags(), value];
    this.updateTags(updated);
    this.tagInput.reset();
  }

  removeTag(index: number) {
    const updated = this.tags().filter((_, i) => i !== index);
    this.updateTags(updated);
  }

  saveNotes() {
    const generation = this.generation();
    if (!generation) return;
    this.service
      .updateMeta(generation._id, { notes: this.notesControl.value })
      .subscribe((updated) => {
        this.generation.set(updated);
        this.notesControl.setValue(updated.notes ?? '');
        this.notify('Notes saved');
      });
  }

  share(id: string) {
    this.service.createShareLink(id).subscribe((res) => {
      this.shareUrl.set(res.shareUrl);
      this.notify('Share link ready');
    });
  }

  revokeShare() {
    const generation = this.generation();
    if (!generation) return;
    this.service.revokeShareLink(generation._id).subscribe(() => {
      this.shareUrl.set(null);
      this.notify('Share link revoked');
    });
  }

  copyShareLink() {
    if (!this.shareUrl()) return;
    navigator.clipboard.writeText(this.shareUrl()!);
    this.notify('Share link copied');
  }

  private load(id: string) {
    this.service.findOne(id).subscribe((gen) => {
      this.generation.set(gen);
      this.tags.set(gen.tags ?? []);
      this.notesControl.setValue(gen.notes ?? '');
      this.shareUrl.set(
        gen.shareToken ? `${window.location.origin}/share/${gen.shareToken}` : null,
      );
    });
  }

  private updateTags(tags: string[]) {
    const generation = this.generation();
    if (!generation) return;
    this.service
      .updateMeta(generation._id, { tags })
      .subscribe((updated) => {
        this.generation.set(updated);
        this.tags.set(updated.tags ?? []);
        this.notify('Tags updated');
      });
  }

  private notify(message: string) {
    this.snackBar.open(message, 'Close', { duration: 2000 });
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  private buildVoiceFilename(gen: Generation) {
    const base = gen.inputConfig['videoType'] || gen.inputConfig['platformFocus'] || 'script';
    const slug = base
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .trim();
    return `${slug || 'voice'}-clone.mp3`;
  }
}
