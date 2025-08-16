import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../cart.service';

@Component({
  standalone: true,
  selector: 'app-cart-drawer',
  imports: [CommonModule, RouterModule, NgIf, NgFor, CurrencyPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css'
})
export class CartDrawerComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  constructor(public cart: CartService) {}

  inc(id: number|string, sizeId: number|undefined, current: number) {
    this.cart.updateQuantity(id, sizeId, current + 1);
  }
  dec(id: number|string, sizeId: number|undefined, current: number) {
    this.cart.updateQuantity(id, sizeId, Math.max(0, current - 1));
  }
  remove(id: number|string, sizeId?: number) {
    this.cart.remove(id, sizeId);
  }
}