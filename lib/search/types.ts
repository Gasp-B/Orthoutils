export type SearchResultKind = 'test' | 'resource';
export type SearchCategory = 'assessments' | 'selfReports' | 'resources';

export type BaseSearchResult = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  domains: string[];
  themes: string[];
  category: SearchCategory;
};

export type TestSearchResult = BaseSearchResult & {
  kind: 'test';
  slug: string;
  population: string | null;
  materials: string | null;
  durationMinutes: number | null;
  isStandardized: boolean;
  objective: string | null;
};

export type ResourceSearchResult = BaseSearchResult & {
  kind: 'resource';
  resourceType: string;
  url: string | null;
};

export type SearchResult = TestSearchResult | ResourceSearchResult;

export type SearchGroup = {
  category: SearchCategory;
  results: SearchResult[];
};

export type SearchHubProps = {
  groups: SearchGroup[];
  domains: string[];
  tags: string[];
};
