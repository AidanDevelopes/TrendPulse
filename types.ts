export interface Topic {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
}

export interface DetailedInfo {
  markdown: string;
  sourceLinks: SourceLink[];
}

export interface SourceLink {
  title: string;
  uri: string;
}

export enum ViewState {
  GRID = 'GRID',
  DETAIL = 'DETAIL',
}