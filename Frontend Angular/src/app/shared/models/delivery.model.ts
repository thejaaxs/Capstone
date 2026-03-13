export type DeliveryStatus = 'READY_FOR_DELIVERY' | 'DELIVERED' | 'PDI_PENDING' | 'RTO_IN_PROGRESS';

export interface DeliveryTask {
  label: string;
  completed: boolean;
}

export interface DeliverySchedule {
  id?: number;
  bookingId: number;
  dealerId: number;
  customerId: number;
  deliveryDate: string;
  deliveryTime: string;
  dealerLocation: string;
  status: DeliveryStatus;
  steps: DeliveryTask[];
}
