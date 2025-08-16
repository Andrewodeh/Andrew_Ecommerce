import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Headerup } from '../headerup/headerup';
import { CartDrawerComponent } from '../cart/cart-drawer/cart-drawer';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-face-section',
  standalone: true,
  imports: [RouterModule, CommonModule, Headerup, CartDrawerComponent],
  templateUrl: './face-section.html',
  styleUrl: './face-section.css'
})
export class FaceSection {
  showCart = false;
  constructor(public cart: CartService) {}

  openCart(): void { this.showCart = true; }
  closeCart(): void { this.showCart = false; }

  /** Smoothly scroll to the New Arrivals section */
  shopNow(): void {
    const el = document.getElementById('new-arrivals');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}