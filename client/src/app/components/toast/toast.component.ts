import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" 
         [ngClass]="(toast$ | async)?.type"
         *ngIf="toast$ | async as toast">
      {{ toast.message }}
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      background: var(--success-color);
      color: white;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      z-index: 1000;
    }

    .toast.success {
      background: var(--success-color);
      opacity: 1;
      transform: translateY(0);
    }

    .toast.error {
      background: var(--danger-color);
      opacity: 1;
      transform: translateY(0);
    }

    .toast.warning {
      background: var(--warning-color);
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class ToastComponent {
  toast$ = this.toastService.toast$;

  constructor(private toastService: ToastService) {}
}
