import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  sizeId?: number;
  sizeName?: string;
  categoryId?: number;
}

type CapKey = string; // "id:sizeId" (sizeId can be 'nosize')

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'cart';
  private readonly STOCK_KEY = 'cart_stock_caps';

  private _items$ = new BehaviorSubject<CartItem[]>(this.read());
  /** Stream of items for templates (async pipe) */
  readonly items$ = this._items$.asObservable();

  /** Derived streams for badge and totals */
  readonly count$: Observable<number> = this.items$.pipe(
    map(items => items.reduce((acc, it) => acc + it.quantity, 0))
  );
  readonly subtotal$: Observable<number> = this.items$.pipe(
    map(items => items.reduce((acc, it) => acc + it.price * it.quantity, 0))
  );

  /** Snapshot helpers */
  getItems(): CartItem[] { return this._items$.value; }

  /** Returns current quantity in cart for id+size */
  getQuantity(id: number | string, sizeId?: number): number {
    const it = this._items$.value.find(x => x.id === id && x.sizeId === sizeId);
    return it?.quantity ?? 0;
  }

  /** Set per-item stock cap (null clears it). Persisted across sessions. */
  setCap(id: number | string, sizeId: number | undefined, cap: number | null): void {
    const caps = this.readCaps();
    const key = this.key(id, sizeId);
    if (cap == null) delete caps[key];
    else caps[key] = Math.max(0, Math.floor(cap));
    this.writeCaps(caps);

    // Clamp existing cart item if it exceeds the new cap
    const items = [...this._items$.value];
    const idx = items.findIndex(x => x.id === id && x.sizeId === sizeId);
    if (idx >= 0) {
      const limit = this.getCap(id, sizeId);
      if (limit != null && items[idx].quantity > limit) {
        items[idx].quantity = limit;
        this.write(items);
      }
    }
  }

  /** Read cap; returns null if none set */
  getCap(id: number | string, sizeId?: number): number | null {
    const caps = this.readCaps();
    const key = this.key(id, sizeId);
    const v = caps[key];
    return (typeof v === 'number' && v >= 0) ? v : null;
  }

  /** Add item; auto-merges with same id+size and clamps to cap if set */
  add(item: CartItem): void {
    const items = [...this._items$.value];
    const idx = items.findIndex(x => x.id === item.id && x.sizeId === item.sizeId);
    const cap = this.getCap(item.id, item.sizeId);

    if (idx >= 0) {
      const desired = items[idx].quantity + item.quantity;
      items[idx].quantity = (cap != null) ? Math.min(desired, cap) : desired;
    } else {
      const qty = (cap != null) ? Math.min(item.quantity, cap) : item.quantity;
      items.push({ ...item, quantity: qty });
    }

    this.write(items);
  }

  /** Set absolute quantity; clamps to cap if set; removes if qty <= 0 */
  updateQuantity(id: number | string, sizeId: number | undefined, qty: number): void {
    const items = [...this._items$.value];
    const idx = items.findIndex(x => x.id === id && x.sizeId === sizeId);
    if (idx >= 0) {
      const cap = this.getCap(id, sizeId);
      const clamped = Math.max(0, (cap != null) ? Math.min(qty, cap) : qty);
      if (clamped <= 0) items.splice(idx, 1);
      else items[idx].quantity = clamped;
      this.write(items);
    }
  }

  remove(id: number | string, sizeId?: number): void {
    const items = this._items$.value.filter(x => !(x.id === id && x.sizeId === sizeId));
    this.write(items);
  }

  clear(): void { this.write([]); }

  // ---- helpers ----
  private key(id: number | string, sizeId?: number): CapKey {
    return `${id}:${sizeId ?? 'nosize'}`;
  }

  private read(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const items = raw ? (JSON.parse(raw) as CartItem[]) : [];

      // Clamp any items that exceed current caps
      const caps = this.readCaps();
      for (const it of items) {
        const cap = caps[this.key(it.id, it.sizeId)];
        if (typeof cap === 'number' && cap >= 0 && it.quantity > cap) {
          it.quantity = cap;
        }
      }
      return items;
    } catch {
      return [];
    }
  }

  private write(items: CartItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this._items$.next(items);
  }

  private readCaps(): Record<CapKey, number> {
    try {
      const raw = localStorage.getItem(this.STOCK_KEY);
      return raw ? (JSON.parse(raw) as Record<CapKey, number>) : {};
    } catch {
      return {};
    }
  }

  private writeCaps(caps: Record<CapKey, number>): void {
    localStorage.setItem(this.STOCK_KEY, JSON.stringify(caps));
  }
}
