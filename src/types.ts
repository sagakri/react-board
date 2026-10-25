export interface Ad {
  id: number | string;
  title: string;
  description: string;
  price: number | string;
  image_url?: string | null;
}

export interface AdsResponse {
  items: Ad[];
  total?: number;
}
