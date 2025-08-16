import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ToastService,Toast } from '../toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css'
})
export class ToastContainerComponent {
  constructor(public toasts: ToastService) {}

  trackById(_: number, t: Toast) { return t.id; }
  close(id: string) { this.toasts.dismiss(id); }
}