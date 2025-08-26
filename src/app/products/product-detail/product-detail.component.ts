import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductsService, ApiItem } from '../products.service';
import { CartService } from '../../cart/cart.service';
import { Headerup } from '../../headerup/headerup';
import { ToastService } from '../../toast/toast.service';
import { Footer } from '../../footer/footer';
import { RouterModule } from '@angular/router';
@Component({
  standalone: true,
  selector: 'app-product-detail',
  imports: [CommonModule, NgIf, NgFor, Headerup,Footer,RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  isLoading = true;
  error: string | null = null;

  item: ApiItem | null = null;
  images: string[] = [];
  mainImage: string | null = null;

  selectedSizeId?: number;
  selectedSizeName?: string;
  quantity = 1;

  stockLoading = false;
  stockStatus: boolean | null = null;
  availableQty: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private products: ProductsService,
    private cart: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Missing product id.';
      this.isLoading = false;
      return;
    }

    this.products.getItemById(id).subscribe({
      next: dto => {
        this.item = dto;

        const base = this.products.IMAGE_BASE;
        const files = Array.isArray(dto.itemimages) ? dto.itemimages : [];
        this.images = files.map(f => `${base}${f.ImagePath}`);
        if (!this.images.length && dto.ImagePath) {
          this.images = [`${base}${dto.ImagePath}`];
        }
        this.mainImage = this.images[0] ?? null;

        const sizes = Array.isArray(dto.Sizelist) ? dto.Sizelist : [];
        if (sizes.length) {
          this.selectedSizeId = sizes[0].ID;
          this.selectedSizeName = sizes[0].ItemSizeEnName ?? sizes[0].ItemSizeArName ?? '';
        }

        this.isLoading = false;
        this.refreshStock();
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load product.';
        this.isLoading = false;
      }
    });
  }

  private relatedNumber(): string | number | undefined {
    return this.item?.ItemIDForUser ?? (this.item as any)?.RelatedNo;
  }

  refreshStock(): void {
    if (!this.item) return;
    const related = this.relatedNumber();
    if (related == null) {
      this.stockStatus = true;
      this.availableQty = null;
      return;
    }

    this.stockLoading = true;
    this.products
      .checkItemQuantity(this.item.ItemID, related, undefined, this.selectedSizeId)
      .subscribe({
        next: res => {
          this.stockStatus = !!res?.status && (Number(res?.quantity ?? 0) > 0);
          this.availableQty = Number(res?.quantity ?? 0) || 0;
          if (this.availableQty != null) {
            this.quantity = Math.max(1, Math.min(this.quantity, Math.max(1, this.availableQty)));
          }
          this.stockLoading = false;
        },
        error: err => {
          console.error(err);
          this.stockStatus = null;
          this.availableQty = null;
          this.stockLoading = false;
        }
      });
  }

  setMainImage(url: string): void { this.mainImage = url; }

  onSelectSize(id: number, name?: string): void {
    this.selectedSizeId = id;
    this.selectedSizeName = name ?? '';
    this.quantity = 1;
    this.refreshStock();
  }

  inc(): void {
    const cap = this.availableQty ?? 99;
    this.quantity = Math.min(cap, this.quantity + 1);
  }
  dec(): void { this.quantity = Math.max(1, this.quantity - 1); }

  canAddToCart(): boolean {
    if (this.stockStatus === null) return true;
    return this.stockStatus === true && (this.availableQty ?? 1) > 0;
  }

  addToCart(): void {
    if (!this.item) return;
    if (!this.canAddToCart()) {
      this.toast.error('This item/size is currently unavailable.', 'Unavailable');
      return;
    }

    this.cart.add({
      id: this.item.ItemID,
      name: this.item.ItemEnName ?? this.item.ItemArName ?? 'Unnamed',
      price: Number(this.item.PriceLevel_Price ?? 0) || 0,
      imageUrl: this.mainImage ?? this.images[0],
      quantity: this.quantity,
      sizeId: this.selectedSizeId,
      sizeName: this.selectedSizeName,
      categoryId: this.item.CategoryID,
    });

    this.toast.success(
      `${this.item.ItemEnName ?? this.item.ItemArName ?? 'Item'} ×${this.quantity} added to cart`,
      'Added to cart'
    );
  }

  get priceTooltip(): string {
    const price = Number(this.item?.PriceLevel_Price ?? 0);
    if (price > 0) return `Price: ${price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`;
    return 'Price on request';
  }
}