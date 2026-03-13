export interface Review {
  id?: number;
  customerId: number;
  productName: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewCreateRequest {
  customerId: number;
  productName: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ReviewUpdateRequest {
  productName?: string;
  rating?: number;
  title?: string;
  comment?: string;
}
