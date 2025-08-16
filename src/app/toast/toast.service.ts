import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number; // ms
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();

  /** Base API */
  show(type: ToastType, message: string, opts?: { title?: string; duration?: number }) {
    const toast: Toast = {
      id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
      type,
      title: opts?.title,
      message,
      duration: opts?.duration ?? 3000,
    };

    const list = [...this._toasts$.value, toast];
    this._toasts$.next(list);

    // Auto-dismiss
    setTimeout(() => this.dismiss(toast.id), toast.duration);
  }

  dismiss(id: string) {
    this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
  }

  /** Convenience helpers */
  success(message: string, title?: string, duration = 3000) {
    this.show('success', message, { title, duration });
  }
  error(message: string, title?: string, duration = 4000) {
    this.show('error', message, { title, duration });
  }
  info(message: string, title?: string, duration = 3000) {
    this.show('info', message, { title, duration });
  }
}