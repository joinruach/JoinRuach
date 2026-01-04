export interface NotionProperty {
  type: string;
  [key: string]: any;
}

export interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
  title?: string;
  [key: string]: any;
}
