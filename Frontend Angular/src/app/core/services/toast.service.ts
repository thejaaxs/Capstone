import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  private counter = 0;

  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string): number {
    return this.push('success', message);
  }

  error(message: string): number {
    return this.push('error', message);
  }

  info(message: string): number {
    return this.push('info', message);
  }

  dismiss(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }

  private push(type: ToastType, message: string): number {
    const id = ++this.counter;
    const toast: ToastMessage = { id, type, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    window.setTimeout(() => {
      this.dismiss(id);
    }, type === 'error' ? 6000 : 3500);

    return id;
  }
}
