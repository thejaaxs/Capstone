export interface Vehicle {
  id?: number;
  name: string;
  brand: string;
  price: number;
  exShowroomPrice?: number;
  onRoadPrice?: number;
  status?: string;
  fuelType?: 'PETROL' | 'ELECTRIC' | string;
  mileage?: number;
  engineCc?: number;
  rideType?: 'CITY' | 'HIGHWAY' | string;
  suitableDailyKm?: number;
  bookingAvailable?: boolean;
  insuranceAmount?: number;
  handlingCharges?: number;
  accessoriesCost?: number;
  city?: string;
  description?: string;
  dealerId: number;
  imageUrl?: string; // backend returns full URL after mapping
}
