export interface PriceBreakdown {
  exShowroomPrice: number;
  rtoCharges: number;
  insurance: number;
  handlingCharges: number;
  accessories: number;
  gstRate?: number;
  cess?: number;
  totalOnRoadPrice: number;
  totalInvoiceAmount: number;
}

export interface PriceBreakdownInput {
  exShowroomPrice: number;
  insurance?: number;
  handlingCharges?: number;
  accessories?: number;
  rtoRate?: number;
  gstRate?: number;
  cess?: number;
}
