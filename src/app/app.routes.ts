import { Routes } from '@angular/router';
import { Home } from './homee/home/home';
import { CheckoutComponent } from './checkout.component/checkout.component';

export const routes: Routes = [
  {
    path: 'products',
    loadChildren: () =>
      import('./products/products-routing-module').then(m => m.PRODUCTS_ROUTES),
  },
  {
    path: 'checkout',
    component: CheckoutComponent,   // ✅ full-screen checkout route
  },
  {
    path: '',
    loadChildren: () =>
      import('./homee/homee-routing-module').then(m => m.HOME_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];