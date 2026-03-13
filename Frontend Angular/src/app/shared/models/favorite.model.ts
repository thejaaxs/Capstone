export interface Favorite {
  id?: number;
  customerId: number;
  dealerId: number;
  dealerName: string;
  address: string;
  productName?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}