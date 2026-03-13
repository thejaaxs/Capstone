import { Injectable } from '@angular/core';
import { DeliverySchedule } from '../../shared/models/delivery.model';
import { GstInvoice } from '../../shared/models/invoice.model';
import { LoanApplication } from '../../shared/models/loan.model';
import { TestRideBooking, TestRideDecision, TestRideSlot } from '../../shared/models/test-ride.model';

type StoreKey = 'loans' | 'test_rides' | 'deliveries' | 'invoices';

@Injectable({ providedIn: 'root' })
export class LocalWorkflowStoreService {
  private readonly keys: Record<StoreKey, string> = {
    loans: 'mm_local_loans_v1',
    test_rides: 'mm_local_test_rides_v1',
    deliveries: 'mm_local_deliveries_v1',
    invoices: 'mm_local_invoices_v1',
  };

  listLoansByCustomer(customerId: number): LoanApplication[] {
    return this.read<LoanApplication>('loans').filter((item) => item.customerId === customerId);
  }

  listLoansByDealer(dealerId: number): LoanApplication[] {
    return this.read<LoanApplication>('loans').filter((item) => item.dealerId === dealerId);
  }

  createLoan(payload: LoanApplication): LoanApplication {
    const items = this.read<LoanApplication>('loans');
    const created = { ...payload, id: this.nextId(items) };
    items.push(created);
    this.write('loans', items);
    return created;
  }

  updateLoan(id: number, payload: Partial<LoanApplication>): LoanApplication | undefined {
    const items = this.read<LoanApplication>('loans');
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return undefined;
    items[index] = { ...items[index], ...payload, id };
    this.write('loans', items);
    return items[index];
  }

  listSlots(dealerId: number, date: string): TestRideSlot[] {
    const bookings = this.read<TestRideBooking>('test_rides').filter((item) => item.bookingDate === date && item.dealerId === dealerId);
    const taken = new Set(bookings.filter((item) => ['PENDING', 'APPROVED', 'RESCHEDULED'].includes(item.status)).map((item) => item.timeSlot));
    return ['10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM'].map((label) => ({
      label,
      value: label,
      available: !taken.has(label),
    }));
  }

  listTestRidesByCustomer(customerId: number): TestRideBooking[] {
    return this.read<TestRideBooking>('test_rides').filter((item) => item.customerId === customerId);
  }

  listTestRidesByDealer(dealerId: number): TestRideBooking[] {
    return this.read<TestRideBooking>('test_rides').filter((item) => item.dealerId === dealerId);
  }

  createTestRide(payload: TestRideBooking): TestRideBooking {
    const items = this.read<TestRideBooking>('test_rides');
    const created = { ...payload, id: this.nextId(items) };
    items.push(created);
    this.write('test_rides', items);
    return created;
  }

  updateTestRide(id: number, payload: TestRideDecision): TestRideBooking | undefined {
    const items = this.read<TestRideBooking>('test_rides');
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return undefined;
    items[index] = {
      ...items[index],
      ...payload,
      bookingDate: payload.bookingDate || items[index].bookingDate,
      timeSlot: payload.timeSlot || items[index].timeSlot,
      id,
    };
    this.write('test_rides', items);
    return items[index];
  }

  listDeliveriesByCustomer(customerId: number): DeliverySchedule[] {
    return this.read<DeliverySchedule>('deliveries').filter((item) => item.customerId === customerId);
  }

  listDeliveriesByDealer(dealerId: number): DeliverySchedule[] {
    return this.read<DeliverySchedule>('deliveries').filter((item) => item.dealerId === dealerId);
  }

  createDelivery(payload: DeliverySchedule): DeliverySchedule {
    const items = this.read<DeliverySchedule>('deliveries');
    const created = { ...payload, id: this.nextId(items) };
    items.push(created);
    this.write('deliveries', items);
    return created;
  }

  updateDelivery(id: number, payload: Partial<DeliverySchedule>): DeliverySchedule | undefined {
    const items = this.read<DeliverySchedule>('deliveries');
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return undefined;
    items[index] = { ...items[index], ...payload, id };
    this.write('deliveries', items);
    return items[index];
  }

  getInvoiceByBooking(bookingId: number): GstInvoice | undefined {
    return this.read<GstInvoice>('invoices').find((item) => item.bookingId === bookingId);
  }

  generateInvoice(payload: Partial<GstInvoice>): GstInvoice {
    const items = this.read<GstInvoice>('invoices');
    const bookingId = Number(payload.bookingId || 0) || this.nextId(items);
    const vehiclePrice = Number(payload.vehiclePrice || 0) || 120000;
    const gstAmount = Number(payload.gstAmount || vehiclePrice * 0.28);
    const cessAmount = Number(payload.cessAmount || 0);
    const created: GstInvoice = {
      id: this.nextId(items),
      invoiceNumber: payload.invoiceNumber || `INV-${bookingId}`,
      invoiceDate: payload.invoiceDate || new Date().toISOString().slice(0, 10),
      bookingId,
      dealerGstin: payload.dealerGstin || '29ABCDE1234F1Z5',
      dealerName: payload.dealerName || 'MotoMint Dealer Pvt Ltd',
      dealerAddress: payload.dealerAddress || 'Bengaluru Showroom',
      customerName: payload.customerName || 'Customer Name',
      customerAddress: payload.customerAddress || 'Bengaluru, Karnataka',
      vehicleName: payload.vehicleName || 'Two Wheeler',
      vehicleVin: payload.vehicleVin,
      vehiclePrice,
      gstAmount,
      cessAmount,
      totalAmount: Number(payload.totalAmount || vehiclePrice + gstAmount + cessAmount),
      paymentStatus: payload.paymentStatus || 'SUCCESS',
    };
    const existingIndex = items.findIndex((item) => item.bookingId === bookingId);
    if (existingIndex >= 0) {
      items[existingIndex] = created;
    } else {
      items.push(created);
    }
    this.write('invoices', items);
    return created;
  }

  private read<T>(key: StoreKey): T[] {
    const storage = this.storage;
    if (!storage) return [];
    const raw = storage.getItem(this.keys[key]);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write<T>(key: StoreKey, items: T[]): void {
    const storage = this.storage;
    if (!storage) return;
    storage.setItem(this.keys[key], JSON.stringify(items));
  }

  private nextId(items: Array<{ id?: number }>): number {
    return items.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
