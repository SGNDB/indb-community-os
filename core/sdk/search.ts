export interface SDKSearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  score: number;
}

export interface SDKSearchOptions {
  query: string;
  types?: string[];
  limit?: number;
  offset?: number;
}

export async function search(_options: SDKSearchOptions): Promise<SDKSearchResult[]> {
  // Phase 3: wire into search infrastructure
  return [];
}

export async function indexEntity(_type: string, _id: string, _data: Record<string, unknown>): Promise<void> {
  // Phase 3: wire into search indexing
}
