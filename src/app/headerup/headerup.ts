import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../cart/cart.service';
import { CartDrawerComponent } from '../cart/cart-drawer/cart-drawer';
@Component({
  selector: 'app-headerup',
  standalone: true,
  imports: [CommonModule, RouterModule, CartDrawerComponent],
  templateUrl: './headerup.html',
  styleUrl: './headerup.css'
})
export class Headerup {
  showCart = false;
  constructor(public cart: CartService) {}
  openCart(): void { this.showCart = true; }


  closeCart(): void { this.showCart = false; }
}