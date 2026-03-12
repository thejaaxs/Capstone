import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ShellComponent } from './features/layout/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ForbiddenComponent } from './features/misc/forbidden/forbidden.component';
import { NotFoundComponent } from './features/misc/notfound/notfound.component';
import { HomeLandingComponent } from './features/home/home-landing.component';

// Favorites
import { FavoritesListComponent } from './features/favorites/favorites-list/favorites-list.component';
import { FavoriteCreateComponent } from './features/favorites/favorite-create/favorite-create.component';
import { FavoriteEditComponent } from './features/favorites/favorite-edit/favorite-edit.component';

// Reviews
import { ReviewsListComponent } from './features/reviews/reviews-list/reviews-list.component';
import { ReviewCreateComponent } from './features/reviews/review-create/review-create.component';
import { ReviewEditComponent } from './features/reviews/review-edit/review-edit.component';

// Vehicles
import { VehiclesListComponent } from './features/vehicles/vehicles-list/vehicles-list.component';
import { VehicleCreateComponent } from './features/vehicles/vehicle-create/vehicle-create.component';
import { VehicleEditComponent } from './features/vehicles/vehicle-edit/vehicle-edit.component';
import { VehicleDetailsComponent } from './features/vehicles/vehicle-details/vehicle-details.component';
import { DealerDashboardComponent } from './features/dealers/dealer-dashboard/dealer-dashboard.component';
import { CustomerShowroomComponent } from './features/vehicles/customer-showroom/customer-showroom.component';
import { DealerSelectionComponent } from './features/dealers/dealer-selection/dealer-selection.component';
import { TestRideBookingComponent } from './features/test-ride/test-ride-booking/test-ride-booking.component';
import { LoanCalculatorPageComponent } from './features/loan/loan-calculator-page/loan-calculator-page.component';
import { BookingConfirmationComponent } from './features/booking/booking-confirmation/booking-confirmation.component';
import { PaymentWorkflowComponent } from './features/payment/payment-workflow/payment-workflow.component';
import { DeliveryStatusComponent } from './features/delivery/delivery-status/delivery-status.component';
import { InvoicePageComponent } from './features/invoice/invoice-page/invoice-page.component';
import { DealerOpsDashboardComponent } from './features/dealers/dealer-ops-dashboard/dealer-ops-dashboard.component';
import { DealerTestRideRequestsComponent } from './features/test-ride/dealer-test-ride-requests/dealer-test-ride-requests.component';
import { DealerLoanApprovalsComponent } from './features/loan/dealer-loan-approvals/dealer-loan-approvals.component';
import { DealerDeliverySchedulingComponent } from './features/delivery/dealer-delivery-scheduling/dealer-delivery-scheduling.component';
import { DealerCustomerReviewsComponent } from './features/reviews/dealer-customer-reviews/dealer-customer-reviews.component';
import { AdminAnalyticsDashboardComponent } from './features/admin/admin-analytics-dashboard/admin-analytics-dashboard.component';
import { AdminPaymentsMonitorComponent } from './features/admin/admin-payments-monitor/admin-payments-monitor.component';

// Dealers
import { DealersListComponent } from './features/dealers/dealers-list/dealers-list.component';
import { DealerCreateComponent } from './features/dealers/dealer-create/dealer-create.component';
import { DealerEditComponent } from './features/dealers/dealer-edit/dealer-edit.component';

// Customers
import { CustomersListComponent } from './features/customers/customers-list/customers-list.component';
import { CustomerCreateComponent } from './features/customers/customer-create/customer-create.component';
import { CustomerEditComponent } from './features/customers/customer-edit/customer-edit.component';

// Bookings & Payment
import { BookingsCustomerComponent } from './features/bookings/bookings-customer/bookings-customer.component';
import { BookingsDealerComponent } from './features/bookings/bookings-dealer/bookings-dealer.component';
import { BookingsDealerRequestsComponent } from './features/bookings/bookings-dealer-requests/bookings-dealer-requests.component';
import { BookingCreateComponent } from './features/bookings/booking-create/booking-create.component';
import { PaymentCreateComponent } from './features/payments/payment-create/payment-create.component';
import { PaymentComponent } from './features/payments/payment.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeLandingComponent },
  { path: 'vehicles', component: VehiclesListComponent, data: { publicBrowse: true } },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'forbidden', component: ForbiddenComponent },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // CUSTOMER
      { path: 'customer/favorites', component: FavoritesListComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/favorites/create', component: FavoriteCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/favorites/edit/:id', component: FavoriteEditComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },

      { path: 'customer/reviews', component: ReviewsListComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/reviews/create', component: ReviewCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/reviews/edit/:id', component: ReviewEditComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },

      { path: 'customer/vehicles', component: CustomerShowroomComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/vehicles/:id', component: VehicleDetailsComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/dealers', component: DealerSelectionComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/test-ride', component: TestRideBookingComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/loan', component: LoanCalculatorPageComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/booking', component: BookingConfirmationComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/payment', component: PaymentWorkflowComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/delivery', component: DeliveryStatusComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/invoice', component: InvoicePageComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },

      { path: 'customer/bookings', component: BookingsCustomerComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/bookings/create', component: BookingCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/payments', component: PaymentCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'customer/pay/:bookingId', component: PaymentComponent, canActivate: [roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },

      // DEALER
      { path: 'dealer/dashboard', component: DealerOpsDashboardComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/vehicles', component: VehiclesListComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/vehicles/create', component: VehicleCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/vehicles/edit/:id', component: VehicleEditComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/test-rides', component: DealerTestRideRequestsComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/bookings', component: BookingsDealerComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/booking-requests', component: BookingsDealerRequestsComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/loan-approvals', component: DealerLoanApprovalsComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/delivery', component: DealerDeliverySchedulingComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },
      { path: 'dealer/reviews', component: DealerCustomerReviewsComponent, canActivate: [roleGuard], data: { roles: ['ROLE_DEALER'] } },

      // ADMIN
      { path: 'admin/analytics', component: AdminAnalyticsDashboardComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/dealers', component: DealersListComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/dealers/create', component: DealerCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/dealers/edit/:id', component: DealerEditComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/vehicles', component: VehiclesListComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/payments', component: AdminPaymentsMonitorComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },

      { path: 'admin/customers', component: CustomersListComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/customers/create', component: CustomerCreateComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/customers/edit/:id', component: CustomerEditComponent, canActivate: [roleGuard], data: { roles: ['ROLE_ADMIN'] } },

      { path: '', pathMatch: 'full', redirectTo: 'customer/vehicles' },
    ],
  },

  { path: '**', component: NotFoundComponent },
];
