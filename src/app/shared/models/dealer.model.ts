export interface Dealer {
  dealerId?: number;
  dealerName: string;
  address: string;
  city?: string;
  contactNumber?: string;
  email?: string;
  rating?: number;
  availableVehicles?: number;
  testRideAvailable?: boolean;
  gstin?: string;
}
