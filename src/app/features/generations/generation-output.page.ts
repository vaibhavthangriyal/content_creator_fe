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
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { GenerationsService } from '../../core/generations/generations.service';
import {
  IllustratorTemplate,
  RendersService,
} from '../../core/renders/renders.service';
import { Generation, GenerationOutput, PostIdea, VoiceProfile } from '../../core/types';
import { environment } from '../../../environments/environment';

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
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
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
            Updated {{ gen.createdAt | date: 'medium' }} · {{ gen.modelProvider | titlecase }} ·
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
              matTooltip="{{
                teleprompterMode() ? 'Switch back to normal text' : 'Open teleprompter view'
              }}"
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
            <span>{{ gen.inputConfig['videoLength'] || 'long' | titlecase }}</span>
          </div>
          <div class="stat">
            <small>Tokens</small>
            <span>{{ gen.tokenUsage || '—' }}</span>
          </div>
        </div>
      </header>

      <section class="glass voice-panel">
        <div class="section-header">
          <div>
            <h2>ElevenLabs voiceover</h2>
            <p class="helper">
              Pick an official ElevenLabs voice, tune the delivery, then clone the script.
            </p>
          </div>
          <button
            mat-flat-button
            color="accent"
            type="button"
            (click)="cloneVoice(gen)"
            [disabled]="voiceLoading()"
          >
            <mat-icon [class.spin]="voiceLoading()">
              {{ voiceLoading() ? 'autorenew' : 'graphic_eq' }}
            </mat-icon>
            <span>{{ voiceLoading() ? 'Preparing audio…' : 'Generate audio' }}</span>
          </button>
        </div>
        <ng-container *ngIf="voiceProfiles().length; else voiceFallback">
          <div class="voice-grid">
            <mat-form-field appearance="outline">
              <mat-label>Voice</mat-label>
              <mat-select [formControl]="voiceControl">
                <mat-option *ngFor="let voice of voiceProfiles()" [value]="voice.id">
                  {{ voice.name }}
                  <span class="option-sub" *ngIf="voice.category">· {{ voice.category }}</span>
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Format</mat-label>
              <mat-select [formControl]="formatControl">
                <mat-option value="mp3">MP3</mat-option>
                <mat-option value="wav">WAV</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Speech speed</mat-label>
              <input
                matInput
                type="number"
                min="0.5"
                max="3"
                step="0.1"
                [formControl]="speedControl"
              />
            </mat-form-field>
          </div>
          <div class="voice-tuning">
            <label>
              Stability · {{ stabilityControl.value | number: '1.2-2' }}
              <mat-slider
                min="0"
                max="1"
                step="0.05"
                [formControl]="stabilityControl"
                thumbLabel
              ></mat-slider>
            </label>
            <label>
              Similarity · {{ similarityControl.value | number: '1.2-2' }}
              <mat-slider
                min="0"
                max="1"
                step="0.05"
                [formControl]="similarityControl"
                thumbLabel
              ></mat-slider>
            </label>
            <label>
              Style · {{ styleControl.value | number: '1.2-2' }}
              <mat-slider
                min="0"
                max="1"
                step="0.05"
                [formControl]="styleControl"
                thumbLabel
              ></mat-slider>
            </label>
            <label>
              Streaming latency · {{ latencyControl.value }}
              <mat-slider
                min="0"
                max="4"
                step="1"
                [formControl]="latencyControl"
                thumbLabel
              ></mat-slider>
            </label>
          </div>
          <div class="voice-controls">
            <mat-slide-toggle [formControl]="speakerBoostControl"> Speaker boost </mat-slide-toggle>
          </div>
          <div class="voice-preview" *ngIf="activeVoicePreview() as preview">
            <p class="helper">Voice sample</p>
            <audio controls [src]="preview"></audio>
          </div>
        </ng-container>
        <ng-template #voiceFallback>
          <ng-container *ngIf="voicesLoaded(); else voiceLoadingTpl">
            <p class="helper">
              Add ELEVENLABS_API_KEY plus a default voice ID inside the backend .env to turn on
              official speech synthesis.
            </p>
          </ng-container>
          <ng-template #voiceLoadingTpl>
            <p class="helper">Loading ElevenLabs voices…</p>
          </ng-template>
        </ng-template>
      </section>

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
              <p class="helper">Single continuous flow for faster reading and delivery.</p>
            </div>
            <div class="script-actions">
              <button
                mat-stroked-button
                type="button"
                (click)="copyAllDialogLines(gen.output)"
                matTooltip="Copy all script lines"
              >
                <mat-icon>notes</mat-icon>
                <span>Copy all lines</span>
              </button>
              <button mat-icon-button (click)="copy(gen.output.script)" matTooltip="Copy full script">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>
          <pre class="script-content">{{ scriptNarrative(gen.output) }}</pre>
        </section>

        <section class="glass list-panel">
          <div class="section-header">
            <h2>YouTube Titles</h2>
            <button
              mat-icon-button
              (click)="copyList(gen.output.youtubeTitles)"
              matTooltip="Copy titles"
            >
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
            <button
              mat-icon-button
              (click)="copyList(gen.output.instagramTitles)"
              matTooltip="Copy hooks"
            >
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
            <button
              mat-icon-button
              (click)="copyList(gen.output.instagramCaptions)"
              matTooltip="Copy captions"
            >
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
            <button
              mat-icon-button
              (click)="copyList(gen.output.thumbnailTexts)"
              matTooltip="Copy thumbnail text"
            >
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          <mat-chip-set class="thumb-set">
            <mat-chip *ngFor="let thumb of gen.output.thumbnailTexts">{{ thumb }}</mat-chip>
          </mat-chip-set>
        </section>

        <section class="glass list-panel post-ideas-panel">
          <div class="section-header">
            <div>
              <h2>Post Ideas</h2>
              <p class="helper">Select template per post idea and save to DB.</p>
            </div>
            <div class="post-ideas-actions">
              <button
                mat-stroked-button
                type="button"
                (click)="templateFileInput.click()"
                [disabled]="uploadingTemplate()"
              >
                <mat-icon>{{ uploadingTemplate() ? 'autorenew' : 'upload_file' }}</mat-icon>
                <span>{{ uploadingTemplate() ? 'Uploading...' : 'Upload .ai template' }}</span>
              </button>
              <input
                #templateFileInput
                type="file"
                accept=".ai"
                hidden
                (change)="onTemplateFileSelected($event)"
              />
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="savePostIdeas()"
                [disabled]="!postIdeasDirty()"
              >
                Save post ideas
              </button>
              <button
                mat-icon-button
                (click)="copyPostIdeas(gen.output.postIdeas)"
                matTooltip="Copy all post ideas"
              >
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>
          <div class="post-idea-list" *ngIf="gen.output.postIdeas.length; else noPostIdeasTpl">
            <article class="post-idea" *ngFor="let post of gen.output.postIdeas; let i = index">
              <button
                mat-flat-button
                color="primary"
                type="button"
                class="generate-post-btn"
                (click)="generatePost(post, i)"
                [disabled]="isGeneratingPost(i)"
              >
                <mat-icon [class.spin]="isGeneratingPost(i)">
                  {{ isGeneratingPost(i) ? 'autorenew' : 'image' }}
                </mat-icon>
                <span>{{ isGeneratingPost(i) ? 'Generating...' : 'Generate Post' }}</span>
              </button>
              <div class="post-idea-content">
                <mat-form-field appearance="outline" class="post-idea-field">
                  <mat-label>Heading</mat-label>
                  <input
                    matInput
                    [value]="post.heading"
                    (input)="onPostIdeaFieldChange(i, 'heading', $any($event.target).value)"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="post-idea-field">
                  <mat-label>Body</mat-label>
                  <textarea
                    matInput
                    rows="4"
                    [value]="post.body"
                    (input)="onPostIdeaFieldChange(i, 'body', $any($event.target).value)"
                  ></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="post-idea-field">
                  <mat-label>Image URL</mat-label>
                  <input
                    matInput
                    [value]="post.imageUrl"
                    (input)="onPostIdeaFieldChange(i, 'imageUrl', $any($event.target).value)"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="post-idea-field">
                  <mat-label>Template</mat-label>
                  <mat-select
                    [value]="resolvePostTemplateId(post)"
                    (selectionChange)="onPostIdeaFieldChange(i, 'templateId', $event.value)"
                  >
                    <mat-option [value]="defaultTemplateId()">Default template</mat-option>
                    <mat-option *ngFor="let tpl of templates()" [value]="tpl.id">
                      {{ tpl.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <a *ngIf="post.imageUrl" [href]="post.imageUrl" target="_blank" rel="noopener">
                  Open source image
                </a>
              </div>
            </article>
          </div>
          <ng-template #noPostIdeasTpl>
            <p class="helper">No post ideas were generated for this package.</p>
          </ng-template>
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
        background:
          radial-gradient(circle at top right, rgba(96, 165, 250, 0.25), transparent 40%),
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
      .voice-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .voice-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
      }
      .voice-tuning {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.25rem;
      }
      .voice-tuning label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      .voice-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .voice-preview audio {
        width: 100%;
      }
      .option-sub {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-left: 0.35rem;
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
      .script-panel.teleprompter .script-content {
        font-size: 1.35rem;
        line-height: 1.8rem;
      }
      .script-content {
        white-space: pre-wrap;
        margin: 0;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.02);
        font-family: 'Space Grotesk', monospace;
      }
      .script-actions {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .script-actions mat-icon {
        margin-right: 0.25rem;
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
      .post-ideas-panel {
        grid-column: 1 / -1;
      }
      .post-idea-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }
      .post-idea {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        padding: 1rem;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
      }
      .generate-post-btn {
        align-self: start;
      }
      .post-ideas-actions {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .generate-post-btn mat-icon {
        margin-right: 0.35rem;
      }
      .generate-post-btn mat-icon.spin {
        animation: spin 1s linear infinite;
      }
      .post-idea-content {
        display: grid;
        gap: 0.35rem;
      }
      .post-idea-field {
        width: 100%;
      }
      .post-idea-content a {
        color: #7dd3fc;
        text-decoration: none;
        font-size: 0.85rem;
      }
      .post-idea-content a:hover {
        text-decoration: underline;
      }
      @media (max-width: 760px) {
        .post-idea {
          grid-template-columns: 1fr;
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
export class GenerationOutputPageComponent implements OnInit {
  readonly generation = signal<Generation | null>(null);
  readonly tags = signal<string[]>([]);
  readonly shareUrl = signal<string | null>(null);
  readonly notesControl = new FormControl('', { nonNullable: true });
  readonly tagInput = new FormControl('');
  readonly teleprompterMode = signal(false);
  readonly voiceLoading = signal(false);
  readonly postGenerating = signal<Record<number, boolean>>({});
  readonly postIdeasDirty = signal(false);
  readonly templates = signal<IllustratorTemplate[]>([]);
  readonly uploadingTemplate = signal(false);
  readonly voiceProfiles = signal<VoiceProfile[]>([]);
  readonly voicesLoaded = signal(false);
  readonly voiceControl = new FormControl('');
  readonly formatControl = new FormControl<'mp3' | 'wav'>('mp3', {
    nonNullable: true,
  });
  readonly speedControl = new FormControl(1, { nonNullable: true });
  readonly stabilityControl = new FormControl(0.6, { nonNullable: true });
  readonly similarityControl = new FormControl(0.85, { nonNullable: true });
  readonly styleControl = new FormControl(0.5, { nonNullable: true });
  readonly latencyControl = new FormControl(0, { nonNullable: true });
  readonly speakerBoostControl = new FormControl(true, { nonNullable: true });

  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private readonly service: GenerationsService,
    private readonly rendersService: RendersService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.load(id);
    this.loadVoices();
    this.loadTemplates();
  }

  activeVoicePreview() {
    const activeId = this.voiceControl.value;
    if (!activeId) {
      return null;
    }
    const match = this.voiceProfiles().find((voice) => voice.id === activeId);
    return match?.previewUrl ?? null;
  }

  cloneVoice(generation: Generation) {
    if (this.voiceLoading()) return;
    this.voiceLoading.set(true);
    const format = this.formatControl.value ?? 'mp3';
    this.service
      .downloadVoice(generation._id, {
        language: generation.inputConfig['language'],
        format,
        speed: this.speedControl.value ?? undefined,
        voiceId: this.voiceControl.value || undefined,
        stability: this.stabilityControl.value ?? undefined,
        similarityBoost: this.similarityControl.value ?? undefined,
        style: this.styleControl.value ?? undefined,
        useSpeakerBoost: this.speakerBoostControl.value ?? undefined,
        optimizeStreamingLatency: this.latencyControl.value ?? undefined,
      })
      .subscribe({
        next: (blob) => {
          const filename = this.buildVoiceFilename(generation, format);
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
    this.service.regenerate(id, {}).subscribe((gen) => {
      this.generation.set(gen);
      this.postIdeasDirty.set(false);
    });
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
    const postIdeasText = (gen.output.postIdeas ?? [])
      .map(
        (post, idx) =>
          `${idx + 1}. Heading: ${post.heading}\nBody: ${post.body}\nImage URL: ${post.imageUrl}`,
      )
      .join('\n\n');
    const bundle = `Script:\n${gen.output.script}\n\nYouTube Titles:\n${gen.output.youtubeTitles.join(
      '\n',
    )}\n\nInstagram Hooks:\n${gen.output.instagramTitles.join(
      '\n',
    )}\n\nInstagram Captions:\n${gen.output.instagramCaptions.join(
      '\n',
    )}\n\nThumbnail Text:\n${gen.output.thumbnailTexts.join('\n')}\n\nPost Ideas:\n${postIdeasText}`;
    this.copy(bundle);
    this.notify('Full package copied');
  }

  copyPostIdeas(postIdeas: PostIdea[]) {
    const content = (postIdeas ?? [])
      .map(
        (post, idx) =>
          `${idx + 1}. ${post.heading}\n${post.body}\n${post.imageUrl || 'No image URL'}`,
      )
      .join('\n\n');
    if (!content.trim()) {
      this.notify('No post ideas to copy');
      return;
    }
    this.copy(content);
    this.notify('Post ideas copied');
  }

  generatePost(post: PostIdea, index: number) {
    if (this.isGeneratingPost(index)) {
      return;
    }
    if (!post?.heading?.trim() || !post?.body?.trim()) {
      this.notify('Post heading/body is incomplete');
      return;
    }
    if (!post?.imageUrl?.trim()) {
      this.notify('Image URL missing for this post idea');
      return;
    }

    this.setPostGenerating(index, true);
    this.rendersService
      .renderIllustrator({
        templateId: this.resolvePostTemplateId(post),
        heading: post.heading.trim(),
        body: post.body.trim(),
        imageUrl: post.imageUrl.trim(),
        format: 'png',
        width: 1080,
        height: 1350,
        imageFit: 'cover',
      })
      .subscribe({
        next: (blob) => {
          this.saveBlob(blob, this.buildPostFilename(post, index));
          this.notify('Post generated');
          this.setPostGenerating(index, false);
        },
        error: () => {
          this.notify('Post generation failed');
          this.setPostGenerating(index, false);
        },
      });
  }

  isGeneratingPost(index: number) {
    return Boolean(this.postGenerating()[index]);
  }

  onPostIdeaFieldChange(
    index: number,
    field: 'heading' | 'body' | 'imageUrl' | 'templateId',
    value: string,
  ) {
    const generation = this.generation();
    if (!generation) {
      return;
    }
    const current = generation.output.postIdeas ?? [];
    if (index < 0 || index >= current.length) {
      return;
    }
    const postIdeas = current.map((post, idx) =>
      idx === index ? { ...post, [field]: value ?? '' } : post,
    );
    this.generation.set({
      ...generation,
      output: {
        ...generation.output,
        postIdeas,
      },
    });
    this.postIdeasDirty.set(true);
  }

  onTemplateFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.ai')) {
      this.notify('Only .ai files are supported');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    this.uploadingTemplate.set(true);
    reader.onload = () => {
      const dataUrl = (reader.result ?? '').toString();
      const contentBase64 = dataUrl.includes(',')
        ? dataUrl.slice(dataUrl.indexOf(',') + 1)
        : dataUrl;
      this.rendersService
        .createTemplate({
          name: file.name.replace(/\.ai$/i, ''),
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64,
        })
        .subscribe({
          next: (template) => {
            this.templates.update((current) => [template, ...current]);
            this.notify('Template uploaded');
            this.uploadingTemplate.set(false);
            input.value = '';
          },
          error: () => {
            this.notify('Template upload failed');
            this.uploadingTemplate.set(false);
            input.value = '';
          },
        });
    };
    reader.onerror = () => {
      this.notify('Unable to read template file');
      this.uploadingTemplate.set(false);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  savePostIdeas() {
    const generation = this.generation();
    if (!generation) {
      return;
    }
    this.service
      .updateMeta(generation._id, { postIdeas: generation.output.postIdeas ?? [] })
      .subscribe((updated) => {
        this.generation.set(updated);
        this.postIdeasDirty.set(false);
        this.notify('Post ideas saved');
      });
  }

  copyAllDialogLines(output: GenerationOutput) {
    const content = this.extractDialogLines(output).join('\n');
    if (!content.trim()) {
      this.notify('No script lines to copy');
      return;
    }
    this.copy(content);
  }

  scriptNarrative(output: GenerationOutput) {
    return this.extractDialogLines(output).join('\n');
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
      .updateMeta(generation._id, {
        notes: this.notesControl.value,
        postIdeas: generation.output.postIdeas ?? [],
      })
      .subscribe((updated) => {
        this.generation.set(updated);
        this.notesControl.setValue(updated.notes ?? '');
        this.postIdeasDirty.set(false);
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
      this.postIdeasDirty.set(false);
      this.tags.set(gen.tags ?? []);
      this.notesControl.setValue(gen.notes ?? '');
      this.shareUrl.set(
        gen.shareToken ? `${window.location.origin}/share/${gen.shareToken}` : null,
      );
      if (!this.voiceControl.value && this.voiceProfiles().length) {
        this.voiceControl.setValue(this.voiceProfiles()[0].id);
      }
    });
  }

  private loadVoices() {
    this.service.listVoices().subscribe({
      next: (voices) => {
        this.voiceProfiles.set(voices);
        if (!this.voiceControl.value && voices.length) {
          this.voiceControl.setValue(voices[0].id);
        }
        this.voicesLoaded.set(true);
      },
      error: () => {
        this.voicesLoaded.set(true);
        this.notify('Unable to fetch ElevenLabs voices');
      },
    });
  }

  private loadTemplates() {
    this.rendersService.listTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
      },
      error: () => {
        this.notify('Unable to load templates');
      },
    });
  }

  defaultTemplateId() {
    return environment.illustratorTemplateId;
  }

  resolvePostTemplateId(post: PostIdea) {
    return post?.templateId?.trim() || this.defaultTemplateId();
  }

  private updateTags(tags: string[]) {
    const generation = this.generation();
    if (!generation) return;
    this.service
      .updateMeta(generation._id, {
        tags,
        postIdeas: generation.output.postIdeas ?? [],
      })
      .subscribe((updated) => {
        this.generation.set(updated);
        this.tags.set(updated.tags ?? []);
        this.postIdeasDirty.set(false);
        this.notify('Tags updated');
      });
  }

  private notify(message: string) {
    this.snackBar.open(message, 'Close', { duration: 2000 });
  }

  private extractDialogLines(output: GenerationOutput) {
    return this.extractDialogLinesFromScriptContent(output.scriptStructured);
  }

  private extractDialogLinesFromScriptContent(scriptStructured: unknown) {
    if (!scriptStructured || typeof scriptStructured !== 'object' || Array.isArray(scriptStructured)) {
      return [];
    }

    const scriptContent = (scriptStructured as Record<string, unknown>)['scriptContent'];
    if (!scriptContent || typeof scriptContent !== 'object' || Array.isArray(scriptContent)) {
      return [];
    }

    const lines: string[] = [];
    this.collectLinesFromScriptContentNode(scriptContent, lines);
    return lines;
  }

  private collectLinesFromScriptContentNode(node: unknown, lines: string[]) {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item) => {
        if (!item || typeof item !== 'object') {
          return;
        }
        const record = item as Record<string, unknown>;
        const line = record['line'];
        if (typeof line === 'string' && line.trim()) {
          lines.push(line.trim());
        }
      });
      return;
    }

    if (typeof node !== 'object') {
      return;
    }

    Object.values(node as Record<string, unknown>).forEach((value) =>
      this.collectLinesFromScriptContentNode(value, lines),
    );
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

  private setPostGenerating(index: number, loading: boolean) {
    this.postGenerating.update((current) => ({ ...current, [index]: loading }));
  }

  private buildPostFilename(post: PostIdea, index: number) {
    const base = post.heading || `post-${index + 1}`;
    const slug = base
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .trim();
    return `${slug || `post-${index + 1}`}.png`;
  }

  private buildVoiceFilename(gen: Generation, format: string) {
    const base = gen.inputConfig['videoType'] || gen.inputConfig['platformFocus'] || 'script';
    const slug = base
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .trim();
    return `${slug || 'voice'}-clone.${format}`;
  }
}
