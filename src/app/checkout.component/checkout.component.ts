import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, CurrencyPipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Headerup } from '../headerup/headerup';
import { CartService, CartItem } from '../cart/cart.service';
import { ToastService } from '../toast/toast.service';

type CouponDto = {
  CouponId: number;
  CouponString: string;
  EndDate: string; // ISO
  DiscountPercentage: number;
};

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor, CurrencyPipe, Headerup],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  // streams
  items$!: Observable<CartItem[]>;
  subtotal$!: Observable<number>;

  // derived totals with discount
  private discountPct$ = new BehaviorSubject<number>(0);
  total$!: Observable<number>;
  discountAmount$!: Observable<number>;

  // coupon UI
  couponCtrl = new FormControl<string>('', { nonNullable: true });
  applying = false;
  appliedCode: string | null = null;

  // UI flags
  placing = false;
  placed = false;
  orderNumber = '';

  // main form
  form!: FormGroup;

  private readonly API_BASE = 'http://192.168.1.203:6060';

  constructor(
    private fb: FormBuilder,
    public cart: CartService,
    private router: Router,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.items$ = this.cart.items$;
    this.subtotal$ = this.cart.subtotal$;

    // totals derived from subtotal and discount
    this.total$ = combineLatest([this.subtotal$, this.discountPct$]).pipe(
      map(([subtotal, pct]) => Math.max(0, subtotal - (subtotal * pct) / 100))
    );
    this.discountAmount$ = combineLatest([this.subtotal$, this.discountPct$]).pipe(
      map(([subtotal, pct]) => (subtotal * pct) / 100)
    );

    this.form = this.fb.group({
      contact: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        news: [true],
      }),
      delivery: this.fb.group({
        country: ['United States', Validators.required],
        firstName: ['', [Validators.required, this.lettersOnlyValidator()]],
        lastName: ['', [Validators.required, this.lettersOnlyValidator()]],
        address: ['', Validators.required],
        apartment: [''],
        city: ['', [Validators.required, this.lettersOnlyValidator()]],
        postal: ['', [Validators.required, this.digitsOnlyValidator()]],
        phone: ['', [this.digitsOnlyValidator(), Validators.maxLength(10)]],
      }),
      payment: this.fb.group({
        method: ['card', Validators.required], // 'card' | 'paypal'
        cardNumber: ['', []],
        cardExp: ['', []], // MM/YY
        cardCvv: ['', []], // 3 digits
        cardName: ['', []],
        billingSame: [true],
      }),
    });

    // default: card validators
    this.onPaymentMethodChange('card');
  }

  // convenience getters
  get fContact() { return this.form.get('contact')!; }
  get fDelivery() { return this.form.get('delivery')!; }
  get fPayment()  { return this.form.get('payment')!; }
  get needsCard(): boolean { return this.fPayment.get('method')?.value === 'card'; }

  /** ===== Validators ===== */
  private lettersOnlyValidator(): ValidatorFn {
    const re = /^[A-Za-z\s'-]+$/;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString().trim();
      if (v === '') return null;
      return re.test(v) ? null : { lettersOnly: true };
    };
  }
  private digitsOnlyValidator(): ValidatorFn {
    const re = /^\d*$/;
    return (c: AbstractControl): ValidationErrors | null =>
      re.test((c.value ?? '').toString()) ? null : { digitsOnly: true };
  }
  private cardNumber16DigitsValidator(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const digits = ((c.value ?? '') as string).replace(/\D/g, '');
      return digits.length === 16 ? null : { cardNumber: true };
    };
  }

  /** Payment validators toggle */
  onPaymentMethodChange(method: 'card' | 'paypal') {
    const number = this.fPayment.get('cardNumber')!;
    const exp = this.fPayment.get('cardExp')!;
    const cvv = this.fPayment.get('cardCvv')!;
    const name = this.fPayment.get('cardName')!;

    if (method === 'card') {
      number.setValidators([Validators.required, this.cardNumber16DigitsValidator()]);
      exp.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      cvv.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
      name.setValidators([Validators.required, this.lettersOnlyValidator()]);
    } else {
      number.clearValidators();
      exp.clearValidators();
      cvv.clearValidators();
      name.clearValidators();
    }
    number.updateValueAndValidity({ emitEvent: false });
    exp.updateValueAndValidity({ emitEvent: false });
    cvv.updateValueAndValidity({ emitEvent: false });
    name.updateValueAndValidity({ emitEvent: false });
  }

  /** ===== Live input sanitizers ===== */
  onLettersOnlyInput(ctrlPath: string) {
    const c = this.form.get(ctrlPath);
    if (!c) return;
    const before = (c.value ?? '').toString();
    const after = before.replace(/[^A-Za-z\s'-]/g, '');
    if (after !== before) c.setValue(after, { emitEvent: false });
  }
  onDigitsOnlyInput(ctrlPath: string, max?: number) {
    const c = this.form.get(ctrlPath);
    if (!c) return;
    const before = (c.value ?? '').toString();
    let after = before.replace(/\D/g, '');
    if (typeof max === 'number') after = after.slice(0, max);
    if (after !== before) c.setValue(after, { emitEvent: false });
  }
  onCardNumberInput() {
    const c = this.fPayment.get('cardNumber')!;
    const digits = (c.value ?? '').toString().replace(/\D/g, '').slice(0, 16);
    const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    if (c.value !== grouped) c.setValue(grouped, { emitEvent: false });
  }
  onCardExpInput() {
    const c = this.fPayment.get('cardExp')!;
    let v = (c.value ?? '').toString().replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    if (c.value !== v) c.setValue(v, { emitEvent: false });
  }
  onCvvInput() {
    const c = this.fPayment.get('cardCvv')!;
    const v = (c.value ?? '').toString().replace(/\D/g, '').slice(0, 3);
    if (c.value !== v) c.setValue(v, { emitEvent: false });
  }

  /** ===== Coupon ===== */
  applyCoupon() {
    const raw = (this.couponCtrl.value || '').trim();
    if (!raw) {
      this.toast.info('Enter a discount code to apply.');
      return;
    }
    if (this.appliedCode) {
      this.toast.info(`Coupon "${this.appliedCode}" is already applied.`);
      return;
    }

    const code = encodeURIComponent(raw);
    this.applying = true;

    this.http
      .get<CouponDto[]>(`${this.API_BASE}/api/Campaigns/getCopuneByCode/${code}`)
      .subscribe({
        next: (arr) => {
          this.applying = false;
          const coupon = Array.isArray(arr) ? arr[0] : null;
          if (!coupon) {
            this.toast.error('Invalid code.');
            return;
          }

          const end = new Date(coupon.EndDate);
          const today = new Date();
          if (isNaN(end.getTime()) || end < today) {
            this.toast.error('This code is expired.');
            return;
          }

          const pct = Number(coupon.DiscountPercentage ?? 0);
          if (pct <= 0) {
            this.toast.error('This code is not offering a discount.');
            return;
          }

          // Apply
          this.discountPct$.next(pct);
          this.appliedCode = coupon.CouponString || raw.toUpperCase();
          this.toast.success(`Code "${this.appliedCode}" applied — ${pct}% off!`);
        },
        error: () => {
          this.applying = false;
          this.toast.error('Could not validate code. Please try again.');
        },
      });
  }

  removeCoupon() {
    if (!this.appliedCode) return;
    const removed = this.appliedCode;
    this.appliedCode = null;
    this.discountPct$.next(0);
    this.couponCtrl.setValue('', { emitEvent: false });
    this.toast.info(`Code "${removed}" removed.`);
  }

  /** Place order */
  async placeOrder(items: CartItem[] | null) {
    if (!items?.length) {
      this.toast.info('Your cart is empty.', 'Nothing to pay');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix the highlighted fields to continue.', 'Invalid form');
      return;
    }

    this.placing = true;
    await new Promise((r) => setTimeout(r, 800));

    this.orderNumber = 'AW-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    this.cart.clear();
    this.discountPct$.next(0);
    this.appliedCode = null;

    this.placing = false;
    this.placed = true;

    this.toast.success('Your order has been placed successfully.', `Order ${this.orderNumber}`, 4000);
  }

  backToShop() {
    this.router.navigateByUrl('/');
  }
}