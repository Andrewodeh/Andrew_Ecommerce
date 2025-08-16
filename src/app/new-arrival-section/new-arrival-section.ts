// src/app/new-arrival-section/new-arrival-section.ts
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ProductsService, UiItem } from '../products/products.service';

@Component({
  selector: 'app-new-arrival-section',
  standalone: true,
  imports: [RouterModule, CommonModule, NgIf, NgFor],
  templateUrl: './new-arrival-section.html',
  styleUrl: './new-arrival-section.css'
})
export class NewArrivalSection implements OnInit {
  isLoading = true;
  error: string | null = null;
  items: UiItem[] = [];

  constructor(private products: ProductsService) {}

  ngOnInit(): void {
    this.products.getLatestItems(8).subscribe({
      next: list => { this.items = list; this.isLoading = false; },
      error: err => { console.error(err); this.error = 'Failed to load new arrivals.'; this.isLoading = false; }
    });
  }

  categorySlug(id?: number): 'men'|'women'|'kids' {
    if (id === 6) return 'men';
    if (id === 7) return 'women';
    return 'kids';
  }
}
