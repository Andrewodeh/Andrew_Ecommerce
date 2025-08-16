import { Component, OnInit } from '@angular/core';
import { Headerup } from '../../headerup/headerup';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ProductsService, UiItem } from '../products.service';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Footer } from "../../footer/footer";
@Component({
  selector: 'app-product-component',
  standalone: true,
  imports: [Headerup, CommonModule, NgIf, NgFor, RouterModule, Footer],
  templateUrl: './product-component.html',
  styleUrl: './product-component.css'
})
export class ProductComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  items: UiItem[] = [];
  currentSlug: string | null = null; // for building detail links

  constructor(
    private products: ProductsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe({
      next: params => {
        this.isLoading = true;
        this.error = null;
        this.items = [];

        this.currentSlug = params.get('category'); // 'men'|'women'|'kids'|null

        if (!this.currentSlug) {
          // /products → all latest
          this.products.getLatestItems(12).subscribe({
            next: list => { this.items = list; this.isLoading = false; },
            error: err => { console.error(err); this.error = 'Failed to load products.'; this.isLoading = false; }
          });
          return;
        }

        const categoryMap: Record<string, number> = { men: 6, women: 7, kids: 8 };
        const categoryId = categoryMap[this.currentSlug.toLowerCase()];
        if (!categoryId) {
          // unknown → fallback to all
          this.products.getLatestItems(12).subscribe({
            next: list => { this.items = list; this.isLoading = false; },
            error: err => { console.error(err); this.error = 'Failed to load products.'; this.isLoading = false; }
          });
          return;
        }

        this.products.getLatestByCategory(categoryId, 12).subscribe({
          next: list => { this.items = list; this.isLoading = false; },
          error: err => { console.error(err); this.error = 'Failed to load products.'; this.isLoading = false; }
        });
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to read route.';
        this.isLoading = false;
      }
    });
  }

  /** helper for grids when on /products (no slug) */
  categorySlug(id?: number): 'men'|'women'|'kids' {
    if (id === 6) return 'men';
    if (id === 7) return 'women';
    return 'kids';
  }
}
