export interface PropertyFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

export interface EstimateResult {
  id: string;
  timestamp: number;
  inputs: PropertyFeatures;
  prediction: number;
}

export interface ApiErrorDetail {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  path: string;
  details?: ApiErrorDetail[];
}
