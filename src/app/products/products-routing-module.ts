import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductComponent } from './product-component/product-component';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductComponent, pathMatch: 'full' }, // /products → all latest
  { path: ':category', component: ProductComponent },           // /products/men|women|kids
  {
    path: ':category/:id',                                      // /products/men/25
    loadComponent: () =>
      import('./product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(PRODUCTS_ROUTES)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
