// src/app/checkout/checkout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Headerup } from '../headerup/headerup';
import { CartService, CartItem } from '../cart/cart.service';
import { ToastService } from '../toast/toast.service';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor, CurrencyPipe, Headerup],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {

  // right panel streams
  items$!: Observable<CartItem[]>;
  subtotal$!: Observable<number>;

  // UI flags
  placing = false;
  placed = false;
  orderNumber = '';

  // main form
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public cart: CartService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // now fb and cart are initialized
    this.items$ = this.cart.items$;
    this.subtotal$ = this.cart.subtotal$;

    this.form = this.fb.group({
      contact: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        news: [true],
      }),
      delivery: this.fb.group({
        country: ['United States', Validators.required],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        address: ['', Validators.required],
        apartment: [''],
        city: ['', Validators.required],
        postal: ['', Validators.required],
        phone: [''],
      }),
      payment: this.fb.group({
        method: ['card', Validators.required],     // 'card' | 'paypal'
        cardNumber: ['', []],
        cardExp: ['', []], // MM/YY
        cardCvv: ['', []], // 3–4 digits
        cardName: ['', []],
        billingSame: [true],
      }),
    });

    // initialize validators for default method 'card'
    this.onPaymentMethodChange('card');
  }

  // convenience getters
  get fContact() { return this.form.get('contact')!; }
  get fDelivery() { return this.form.get('delivery')!; }
  get fPayment()  { return this.form.get('payment')!; }

  /** Show card fields when method is 'card' */
  get needsCard(): boolean {
    return this.fPayment.get('method')?.value === 'card';
  }

  /** Toggle validators depending on payment method */
  onPaymentMethodChange(method: 'card' | 'paypal') {
    const number = this.fPayment.get('cardNumber')!;
    const exp    = this.fPayment.get('cardExp')!;
    const cvv    = this.fPayment.get('cardCvv')!;
    const name   = this.fPayment.get('cardName')!;

    if (method === 'card') {
      number.setValidators([
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(19),
        Validators.pattern(/^[0-9\s-]+$/) // digits, spaces, dashes
      ]);
      exp.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/) // MM/YY
      ]);
      cvv.setValidators([
        Validators.required,
        Validators.pattern(/^\d{3,4}$/) // 3 or 4 digits
      ]);
      name.setValidators([Validators.required, Validators.minLength(2)]);
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

  /** Fake place order, clear cart, show confirmation */
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

    // simulate API call
    await new Promise(r => setTimeout(r, 800));

    // fake order number
    this.orderNumber = 'AW-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    // clear the cart
    this.cart.clear();

    this.placing = false;
    this.placed = true;

    this.toast.success('Your order has been placed successfully.', `Order ${this.orderNumber}`, 4000);
  }

  backToShop() {
    this.router.navigateByUrl('/');
  }
}