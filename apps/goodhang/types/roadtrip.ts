export interface StopBlogContent {
  visitedAt?: string;        // Date visited (ISO string) - presence marks stop as "visited"
  summary?: string;          // Short text description of the stop
  photos?: string[];         // Array of image URLs (Supabase Storage or external)
}

export interface PlannedStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isHome?: boolean;
  isHighlight?: boolean;
  note?: string;
  blogContent?: StopBlogContent;
}

export interface RoadtripInterest {
  id?: string;
  created_at?: string;
  name: string;
  email: string;
  linkedin?: string;
  stop_id?: string | null;
  custom_city?: string | null;
  custom_lat?: number | null;
  custom_lng?: number | null;
  // Work interests
  interest_brainstorm?: boolean;
  interest_renubu?: boolean;
  interest_workshop?: boolean;
  interest_happy_hour?: boolean;
  // Fun interests
  interest_coffee?: boolean;
  interest_dinner?: boolean;
  interest_crash?: boolean;
  interest_intro?: boolean;
  // Adventure interests
  interest_join_leg?: boolean;
  interest_unknown?: boolean;
  note?: string | null;
}

export interface RoadtripMessage {
  id?: string;
  created_at?: string;
  name?: string | null;
  email: string;
  message: string;
}

export interface CustomSpotData {
  city: string;
  lat: number;
  lng: number;
  count: number;
}
