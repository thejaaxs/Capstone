import { Injectable } from '@angular/core';
import { PriceBreakdown, PriceBreakdownInput } from '../../shared/models/pricing.model';

@Injectable({ providedIn: 'root' })
export class PricingService {
  calculateBreakdown(input: PriceBreakdownInput): PriceBreakdown {
    const exShowroomPrice = this.round(input.exShowroomPrice);
    const rtoCharges = this.round(exShowroomPrice * (input.rtoRate ?? 0.08));
    const insurance = this.round(input.insurance ?? 7500);
    const handlingCharges = this.round(input.handlingCharges ?? 1000);
    const accessories = this.round(input.accessories ?? 0);
    const gstRate = input.gstRate ?? 0.28;
    const cess = this.round(input.cess ?? 0);
    const totalOnRoadPrice = this.round(exShowroomPrice + rtoCharges + insurance + handlingCharges + accessories);
    const gstAmount = this.round(exShowroomPrice * gstRate);
    const totalInvoiceAmount = this.round(exShowroomPrice + gstAmount + cess);

    return {
      exShowroomPrice,
      rtoCharges,
      insurance,
      handlingCharges,
      accessories,
      gstRate,
      cess,
      totalOnRoadPrice,
      totalInvoiceAmount
    };
  }

  minimumDownPayment(amount: number): number {
    return this.round(amount * 0.2);
  }

  private round(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
}
