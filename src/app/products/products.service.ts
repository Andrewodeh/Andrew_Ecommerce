// src/app/products/products.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ApiItemImage {
  ID: number;
  ItemID: number;
  ImagePath: string;
  isdefault: boolean;
  description: string | null;
}

export interface ApiItem {
  ItemID: number;
  ItemIDForUser?: string;
  ItemEnName?: string;
  ItemArName?: string;
  CategoryID?: number;
  PriceLevel_Price?: number;
  ImagePath?: string | null;
  haveImage?: boolean;
  itemimages?: ApiItemImage[];
  Sizelist?: Array<{ ID: number; ItemSizeEnName?: string; ItemSizeArName?: string }>;
  ColorSizeAvailability?: Array<{ SizeID: number; IsAvailable: number }>;
}

export interface UiItem {
  id: number | string;
  name: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
}

export interface StockResponse {
  status: boolean;
  quantity: number;
  in: number;
  out: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly API_BASE = 'http://192.168.1.203:6060';
  public readonly IMAGE_BASE = 'http://192.168.1.203:6060/itemimage/';

  constructor(private http: HttpClient) {}

  /** Home: ALL latest (no filter) */
  getLatestItems(limit = 12): Observable<UiItem[]> {
    const url = `${this.API_BASE}/api/items/getLatestItems`;
    return this.http.get<ApiItem[]>(url).pipe(
      map(items => Array.isArray(items) ? items : []),
      map(items => items.slice(0, limit).map(i => this.toUi(i)))
    );
  }

  /** Category page: filter by CategoryID (6=men, 7=women, 8=kids) */
  getLatestByCategory(categoryId: number, limit = 12): Observable<UiItem[]> {
    const url = `${this.API_BASE}/api/items/getLatestItems`;
    return this.http.get<ApiItem[]>(url).pipe(
      map(items => Array.isArray(items) ? items : []),
      map(items => items
        .filter(i => i.CategoryID === categoryId)
        .slice(0, limit)
        .map(i => this.toUi(i))
      )
    );
  }

  /** Detail page: one item by id */
  getItemById(id: number | string): Observable<ApiItem> {
    const url = `${this.API_BASE}/api/items/getitembyID/${id}`;
    return this.http.get<ApiItem>(url);
  }

  /**
   * Stock check:
   * GET /api/items/checkIfItemHasAQuantity/{itemId}/{relatedNumber}/{colorId}/{sizeId}
   * Example you gave: /checkIfItemHasAQuantity/25/1111/undefined/undefined
   */
  checkItemQuantity(
    itemId: number | string,
    relatedNumber: number | string,
    colorId?: number | string,
    sizeId?: number | string
  ): Observable<StockResponse> {
    const p3 = colorId !== undefined && colorId !== null ? String(colorId) : 'undefined';
    const p4 = sizeId  !== undefined && sizeId  !== null ? String(sizeId)  : 'undefined';
    const url = `${this.API_BASE}/api/items/checkIfItemHasAQuantity/${itemId}/${relatedNumber}/${p3}/${p4}`;
    return this.http.get<StockResponse>(url);
  }

  private toUi(i: ApiItem): UiItem {
    const name = i.ItemEnName ?? i.ItemArName ?? 'Unnamed';
    const price = Number(i.PriceLevel_Price ?? 0) || 0;

    let imgPath: string | undefined;
    if (Array.isArray(i.itemimages) && i.itemimages.length) {
      const preferred = i.itemimages.find(x => x.isdefault) ?? i.itemimages[0];
      imgPath = preferred?.ImagePath;
    } else if (i.ImagePath) {
      imgPath = i.ImagePath;
    }

    const imageUrl = imgPath ? `${this.IMAGE_BASE}${imgPath}` : undefined;

    return {
      id: i.ItemID ?? i.ItemIDForUser ?? 'n/a',
      name,
      price,
      imageUrl,
      categoryId: i.CategoryID,
    };
  }
}
