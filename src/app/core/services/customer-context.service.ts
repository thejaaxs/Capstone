import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CustomerJourneyContext } from '../../shared/models/workflow.model';
import { Dealer } from '../../shared/models/dealer.model';
import { Vehicle } from '../../shared/models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class CustomerContextService {
  private readonly stateSubject = new BehaviorSubject<CustomerJourneyContext>({});
  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): CustomerJourneyContext {
    return this.stateSubject.value;
  }

  setVehicle(vehicle: Vehicle): void {
    this.stateSubject.next({ ...this.snapshot, selectedVehicle: vehicle });
  }

  setDealer(dealer: Dealer): void {
    this.stateSubject.next({ ...this.snapshot, selectedDealer: dealer });
  }

  setCustomer(customerId: number): void {
    this.stateSubject.next({ ...this.snapshot, customerId });
  }

  setBooking(bookingId: number): void {
    this.stateSubject.next({ ...this.snapshot, bookingId });
  }

  clear(): void {
    this.stateSubject.next({});
  }
}
