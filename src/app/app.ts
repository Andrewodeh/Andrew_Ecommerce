import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaceSection } from './face-section/face-section';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,FaceSection],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Andrew_Ecommerce');
}
