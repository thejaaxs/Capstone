export interface GstInvoice {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  bookingId: number;
  dealerGstin: string;
  dealerName: string;
  dealerAddress: string;
  customerName: string;
  customerAddress: string;
  vehicleName: string;
  vehicleVin?: string;
  vehiclePrice: number;
  gstAmount: number;
  cessAmount: number;
  totalAmount: number;
  paymentStatus: string;
}
