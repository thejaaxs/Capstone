import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestRidesApi } from '../../../api/test-rides.api';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { TestRideBooking } from '../../../shared/models/test-ride.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div><h2>Test Ride Requests</h2><p class="section-subtitle">Approve, reject, or reschedule dealership ride slots.</p></div>
        </div>
        <table>
          <thead><tr><th>Customer</th><th>Vehicle</th><th>Date</th><th>Slot</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let ride of rides()">
              <td>{{ ride.customerName || ('Customer #' + ride.customerId) }}</td>
              <td>{{ ride.vehicleName || ('Vehicle #' + ride.vehicleId) }}</td>
              <td>{{ ride.bookingDate }}</td>
              <td>{{ ride.timeSlot }}</td>
              <td>{{ ride.status }}</td>
              <td class="table-actions">
                <button class="btn btn-ghost" type="button" (click)="decide(ride, 'APPROVED')">Approve</button>
                <button class="btn btn-ghost" type="button" (click)="decide(ride, 'RESCHEDULED')">Reschedule</button>
                <button class="btn btn-danger" type="button" (click)="decide(ride, 'REJECTED')">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class DealerTestRideRequestsComponent {
  readonly rides = signal<TestRideBooking[]>([]);

  constructor(
    private profiles: ProfileContextService,
    private testRidesApi: TestRidesApi,
    private toast: ToastService
  ) {
    this.load();
  }

  load(): void {
    this.profiles.getDealerId().subscribe((dealerId) => {
      if (!dealerId) return;
      this.testRidesApi.byDealer(dealerId).subscribe((rides) => this.rides.set(rides));
    });
  }

  decide(ride: TestRideBooking, status: 'APPROVED' | 'RESCHEDULED' | 'REJECTED'): void {
    if (!ride.id) return;
    this.testRidesApi.updateStatus(ride.id, { status }).subscribe(() => {
      this.toast.success(`Test ride ${status.toLowerCase()}.`);
      this.load();
    });
  }
}
