import { Dealer } from './dealer.model';
import { Vehicle } from './vehicle.model';

export interface CustomerJourneyContext {
  selectedVehicle?: Vehicle;
  selectedDealer?: Dealer;
  customerId?: number;
  bookingId?: number;
}
