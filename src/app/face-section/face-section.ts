import { Component, ElementRef, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { CartDrawerComponent } from '../cart/cart-drawer/cart-drawer';
import { CartService } from '../cart/cart.service';

type Suggestion = {
  ItemID?: number;
  ItemEnName?: string;
  ItemArName?: string;
  CategoryID?: number;
  ItemIDForUser?: string;
  RelatedNo?: string;
  OriginalPrice?: number | null;
  PriceLevel_Price?: number | null;
};

@Component({
  selector: 'app-face-section',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule, NgIf, NgFor, CartDrawerComponent],
  templateUrl: './face-section.html',
  styleUrl: './face-section.css'
})
export class FaceSection {
  // cart drawer
  showCart = false;

  // search
  showSearch = false;
  search = new FormControl<string>('', { nonNullable: true });
  loading = false;
  suggestions: Suggestion[] = [];
  focusedIndex = -1;

  private readonly API = 'http://192.168.1.203:6060';

  constructor(
    public cart: CartService,
    private http: HttpClient,
    private router: Router,
    private el: ElementRef<HTMLElement>
  ) {
    // live search (same as Headerup)
    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        const q = (term || '').trim();
        if (!q) {
          this.suggestions = [];
          this.focusedIndex = -1;
          return of(null);
        }
        this.loading = true;
        const url = `${this.API}/api/items/getItemSuggestions/${encodeURIComponent(q)}/1/9/0/0/0/-1`;
        return this.http.get<{ items: Suggestion[]; total: number; page: number; limit: number } | any>(url).pipe(
          catchError(() => of({ items: [] })),
          finalize(() => { this.loading = false; })
        );
      })
    ).subscribe(res => {
      this.suggestions = Array.isArray(res?.items) ? res.items : [];
      this.focusedIndex = -1;
    });
  }

  // cart open/close
  openCart(): void { this.showCart = true; }
  closeCart(): void { this.showCart = false; }

  /** Smoothly scroll to the New Arrivals section */
  shopNow(): void {
    const el = document.getElementById('new-arrivals');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // search open/close
  toggleSearch() {
    this.showSearch = !this.showSearch;
    this.focusedIndex = -1;
    if (this.showSearch) {
      setTimeout(() => {
        const input = this.el.nativeElement.querySelector<HTMLInputElement>('#hdr-search-input');
        input?.focus();
      }, 0);
    } else {
      this.suggestions = [];
      this.search.setValue('');
    }
  }

  // pick a suggestion → product detail
  selectSuggestion(s: Suggestion) {
    const id = s.ItemID ?? s.ItemIDForUser ?? s.RelatedNo;
    const slug = this.categorySlug(s.CategoryID);
    if (id == null) return;
    this.router.navigate(['/products', slug, id]);
    this.showSearch = false;
    this.suggestions = [];
    this.search.setValue('');
  }

  // CategoryID → slug
  private categorySlug(id?: number): 'men' | 'women' | 'kids' {
    if (id === 6) return 'men';
    if (id === 7) return 'women';
    if (id === 8) return 'kids';
    return 'men';
  }

  // keyboard navigation in dropdown
  onSearchKey(event: KeyboardEvent) {
    if (event.key === 'Escape') { this.toggleSearch(); return; }
    if (!this.suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedIndex = Math.min(this.suggestions.length - 1, this.focusedIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedIndex = Math.max(0, this.focusedIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.focusedIndex >= 0) {
        this.selectSuggestion(this.suggestions[this.focusedIndex]);
      }
    }
  }

  // click outside → close search
  @HostListener('document:click', ['$event'])
  handleDocClick(ev: MouseEvent) {
    if (!this.showSearch) return;
    const root = this.el.nativeElement;
    if (!root.contains(ev.target as Node)) {
      this.showSearch = false;
      this.suggestions = [];
    }
  }

  displayName(s: Suggestion): string {
    return s.ItemEnName || s.ItemArName || String(s.ItemID ?? s.ItemIDForUser ?? s.RelatedNo ?? '');
  }
  trackById(i: number, s: Suggestion) {
    return s.ItemID ?? s.ItemIDForUser ?? s.RelatedNo ?? i;
  }
}