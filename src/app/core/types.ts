export interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
  preferredTone: string;
  preferredPlatformFocus: string;
  preferredVideoType: string;
}

export interface Article {
  _id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  sourceName: string;
  author?: string;
  publishedAt: string;
  category: string;
  provider: string;
  contentSnippet?: string;
  normalizedContent?: string;
  hasGeneratedContent?: boolean;
}

export interface GenerationOutput {
  script: string;
  youtubeTitles: string[];
  instagramTitles: string[];
  instagramCaptions: string[];
  thumbnailTexts: string[];
}

export interface Generation {
  _id: string;
  articleId: string;
  userId: string;
  inputConfig: Record<string, string | undefined>;
  output: GenerationOutput;
  saved: boolean;
  createdAt: string;
  modelProvider?: string;
  modelName?: string;
  tokenUsage?: number;
  tags?: string[];
  notes?: string;
  shareToken?: string;
  shareExpiresAt?: string;
}

export interface ShareGenerationPayload {
  generation: Pick<Generation, 'output' | 'inputConfig' | 'tags' | 'notes' | 'createdAt'>;
  article: Article;
}
