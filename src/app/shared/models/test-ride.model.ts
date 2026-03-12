export type TestRideStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'RESCHEDULED';

export interface TestRideSlot {
  label: string;
  value: string;
  available: boolean;
}

export interface TestRideBooking {
  id?: number;
  customerId: number;
  vehicleId: number;
  dealerId: number;
  bookingDate: string;
  timeSlot: string;
  status: TestRideStatus;
  customerName?: string;
  vehicleName?: string;
  dealerName?: string;
  notes?: string;
}

export interface TestRideDecision {
  status: Extract<TestRideStatus, 'APPROVED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED'>;
  notes?: string;
  bookingDate?: string;
  timeSlot?: string;
}
