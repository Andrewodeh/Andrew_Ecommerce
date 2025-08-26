import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaceSection } from './face-section/face-section';
import { NewArrivalSection } from "./new-arrival-section/new-arrival-section";
import { Footer } from './footer/footer';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from "./toast/toast-container/toast-container";
import { inject } from "@vercel/analytics"

inject();
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FaceSection, NewArrivalSection, HttpClientModule, Footer, CommonModule, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
  
})
export class App {
  protected readonly title = signal('Andrew_Ecommerce');
 
}
