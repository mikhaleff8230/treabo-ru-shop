export interface PlaceImage {
  id: string;
  url: string;
  thumbnail?: string;
}

export interface Place {
  id: string;
  title: string;
  images: PlaceImage[];
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
}
