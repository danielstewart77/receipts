import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ReceiptDataService, InStoreReceiptData } from '../services/receipt-data.service';

@Component({
  standalone: true,
  selector: 'app-in-store-confirmation',
  template: `
    <div class="confirmation-container">
      <div class="form-content">
        <form class="confirmation-form" (ngSubmit)="onConfirm()" #form="ngForm">
          <!-- Store Field -->
          <div class="form-row">
            <div class="form-label">Store</div>
            <mat-form-field appearance="outline" class="form-field">
              <input 
                matInput 
                [(ngModel)]="formData.store" 
                name="store" 
                required
                placeholder="Enter store name">
            </mat-form-field>
          </div>

          <!-- Date Field -->
          <div class="form-row">
            <div class="form-label">Date</div>
            <mat-form-field appearance="outline" class="form-field">
              <input 
                matInput 
                type="date"
                [(ngModel)]="formData.date" 
                name="date" 
                required>
            </mat-form-field>
          </div>

          <!-- Item Field -->
          <div class="form-row">
            <div class="form-label">Item</div>
            <mat-form-field appearance="outline" class="form-field">
              <input 
                matInput 
                [(ngModel)]="formData.item" 
                name="item" 
                required
                placeholder="Enter item name">
            </mat-form-field>
          </div>

          <!-- Quantity Field -->
          <div class="form-row">
            <div class="form-label">Qty</div>
            <mat-form-field appearance="outline" class="form-field">
              <input 
                matInput 
                type="number" 
                min="1"
                [(ngModel)]="formData.quantity" 
                name="quantity" 
                required
                placeholder="1">
            </mat-form-field>
          </div>

          <!-- Price Field -->
          <div class="form-row">
            <div class="form-label">Price</div>
            <mat-form-field appearance="outline" class="form-field">
              <input 
                matInput 
                type="number" 
                step="0.01"
                min="0"
                [(ngModel)]="formData.totalPrice" 
                name="price" 
                required
                placeholder="0.00">
              <span matTextPrefix>$</span>
            </mat-form-field>
          </div>
        </form>
      </div>

      <!-- Confirm Button -->
      <div class="button-container">
        <button 
          mat-raised-button 
          color="primary" 
          class="confirm-button"
          (click)="onConfirm()"
          [disabled]="isSubmitting || !isFormValid()">
          <mat-icon *ngIf="!isSubmitting">check</mat-icon>
          <mat-icon *ngIf="isSubmitting" class="spinning">hourglass_empty</mat-icon>
          {{ isSubmitting ? 'Saving...' : 'Confirm' }}
        </button>
      </div>

      <!-- Status Message -->
      <div class="status-message" [ngClass]="statusType" *ngIf="statusMessage">
        <mat-icon>{{ statusIcon }}</mat-icon>
        <span>{{ statusMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: calc(100vh - 180px);
      padding: 1rem;
      max-width: 400px;
      margin: 0 auto;
    }

    .form-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .confirmation-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .form-label {
      width: 80px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      text-align: left;
      flex-shrink: 0;
    }

    .form-field {
      flex: 1;
      
      ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }
      
      ::ng-deep .mdc-text-field--outlined {
        border-radius: 8px;
      }
      
      ::ng-deep .mat-mdc-text-field-wrapper {
        padding: 0 12px;
      }
      
      ::ng-deep .mdc-text-field--outlined .mdc-text-field__input {
        padding: 12px 0;
        font-size: 1rem;
      }
      
      ::ng-deep .mdc-text-field--outlined .mdc-floating-label {
        display: none;
      }
    }

    .button-container {
      padding: 1.5rem 0 1rem 0;
      border-top: 1px solid #eee;
      margin-top: auto;
    }

    .confirm-button {
      width: 100%;
      height: 48px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      
      mat-icon {
        font-size: 1.25rem;
        
        &.spinning {
          animation: spin 1s linear infinite;
        }
      }
    }

    .status-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-weight: 500;
      
      &.success {
        background-color: rgba(46, 125, 50, 0.15);
        color: #81c784;
        border: 1px solid #4caf50;
      }
      
      &.error {
        background-color: rgba(198, 40, 40, 0.15);
        color: #f48fb1;
        border: 1px solid #f44336;
      }
      
      mat-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    // Mobile optimizations
    @media (max-width: 480px) {
      .confirmation-container {
        padding: 0.75rem;
        max-width: 100%;
      }
      
      .form-row {
        gap: 0.75rem;
      }
      
      .form-label {
        width: 70px;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }
      
      .confirm-button {
        height: 44px;
        font-size: 1rem;
      }
    }

    @media (max-width: 360px) {
      .confirmation-container {
        padding: 0.5rem;
      }
      
      .form-row {
        gap: 0.5rem;
      }
      
      .form-label {
        width: 60px;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }
    }
  `],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class InStoreConfirmationComponent implements OnInit, OnDestroy {
  formData: InStoreReceiptData = {
    store: '',
    item: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    date: new Date().toISOString().split('T')[0]
  };

  isSubmitting = false;
  statusMessage = '';
  statusType: 'success' | 'error' = 'success';
  statusIcon = '';

  private destroy$ = new Subject<void>();

  constructor(
    private receiptDataService: ReceiptDataService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Load data from service
    this.receiptDataService.inStoreData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.formData = { ...data };
          
          // Don't populate store if it's "Unknown"
          if (this.formData.store === 'Unknown') {
            this.formData.store = '';
          }
          
          // Ensure quantity is set if not provided
          if (!this.formData.quantity) {
            this.formData.quantity = 1;
          }
          
          // Ensure date is set
          if (!this.formData.date) {
            this.formData.date = new Date().toISOString().split('T')[0];
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFormValid(): boolean {
    return !!(this.formData.store && 
              this.formData.date &&
              this.formData.item && 
              this.formData.quantity && 
              this.formData.totalPrice > 0);
  }

  onConfirm(): void {
    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = '';

    // Prepare data for API
    const apiData = {
      ...this.formData,
      unitPrice: this.formData.totalPrice / this.formData.quantity
    };

    this.http.post<any>('/receipts/save_in_store', apiData).subscribe({
      next: (response) => {
        this.statusMessage = 'In-store receipt saved successfully!';
        this.statusType = 'success';
        this.statusIcon = 'check_circle';
        this.isSubmitting = false;

        // Reset and go back to camera after success
        setTimeout(() => {
          this.receiptDataService.clearCurrentData();
          this.receiptDataService.setViewMode('camera');
        }, 2000);
      },
      error: (error) => {
        this.statusMessage = `Save failed: ${error.error?.detail || error.message}`;
        this.statusType = 'error';
        this.statusIcon = 'error';
        this.isSubmitting = false;
      }
    });
  }
}
