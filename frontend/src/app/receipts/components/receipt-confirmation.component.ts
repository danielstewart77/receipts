import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ReceiptDataService, ReceiptData } from '../services/receipt-data.service';

interface ReceiptItem {
  item: string;
  quantity: number;
  price: number;
}

interface ReceiptFormData {
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
}

@Component({
  standalone: true,
  selector: 'app-receipt-confirmation',
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

          <!-- Items Section -->
          <div class="items-section">
            <div class="item-container" *ngFor="let item of formData.items; let i = index">
              <div class="item-header" *ngIf="i === 0 || formData.items.length > 1">
                <span class="item-number">{{ i + 1 }}</span>
              </div>
              
              <div class="item-form">
                <!-- Item Name -->
                <div class="form-row">
                  <div class="form-label">Item</div>
                  <mat-form-field appearance="outline" class="form-field">
                    <input 
                      matInput 
                      [(ngModel)]="item.item" 
                      [name]="'item_name_' + i" 
                      required
                      placeholder="Enter item name">
                  </mat-form-field>
                </div>

                <!-- Quantity -->
                <div class="form-row">
                  <div class="form-label">Qty</div>
                  <mat-form-field appearance="outline" class="form-field">
                    <input 
                      matInput 
                      type="number" 
                      min="1"
                      [(ngModel)]="item.quantity" 
                      [name]="'item_qty_' + i" 
                      required
                      placeholder="1">
                  </mat-form-field>
                </div>

                <!-- Price -->
                <div class="form-row">
                  <div class="form-label">Price</div>
                  <mat-form-field appearance="outline" class="form-field">
                    <input 
                      matInput 
                      type="number" 
                      step="0.01"
                      min="0"
                      [(ngModel)]="item.price" 
                      [name]="'item_price_' + i" 
                      required
                      placeholder="0.00">
                    <span matTextPrefix>$</span>
                  </mat-form-field>
                </div>
              </div>

              <!-- Remove item button (only show if more than one item) -->
              <button 
                type="button"
                mat-icon-button 
                color="warn" 
                class="remove-item-btn"
                *ngIf="formData.items.length > 1"
                (click)="removeItem(i)">
                <mat-icon>remove_circle</mat-icon>
              </button>
            </div>

            <!-- Add item button -->
            <button 
              type="button"
              mat-stroked-button 
              color="primary" 
              class="add-item-btn"
              (click)="addItem()">
              <mat-icon>add</mat-icon>
              Add Item
            </button>
          </div>

          <!-- Total Field -->
          <div class="form-row total-row">
            <div class="form-label">Total</div>
            <mat-form-field appearance="outline" class="form-field">
              <input 
                matInput 
                type="number" 
                step="0.01"
                min="0"
                [(ngModel)]="formData.total" 
                name="total" 
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
      overflow-y: auto;
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
      
      &.total-row {
        border-top: 2px solid #eee;
        padding-top: 1rem;
        margin-top: 1rem;
        font-weight: 600;
        
        .form-label {
          font-weight: 600;
          color: #1976d2;
        }
      }
    }

    .form-label {
      width: 80px;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
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

    .items-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fafafa;
      padding: 1rem;
      margin: 0.5rem 0;
    }

    .item-container {
      position: relative;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      
      &:last-of-type {
        margin-bottom: 1rem;
      }
    }

    .item-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #eee;
    }

    .item-number {
      background-color: #1976d2;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .item-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .remove-item-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      
      mat-icon {
        font-size: 1.25rem;
      }
    }

    .add-item-btn {
      width: 100%;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 500;
      
      mat-icon {
        font-size: 1.1rem;
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
        background-color: #e8f5e8;
        color: #2e7d32;
        border: 1px solid #4caf50;
      }
      
      &.error {
        background-color: #ffeaea;
        color: #c62828;
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
      }
      
      .items-section {
        padding: 0.75rem;
      }
      
      .item-container {
        padding: 0.75rem;
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
export class ReceiptConfirmationComponent implements OnInit, OnDestroy {
  formData: ReceiptFormData = {
    store: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ item: '', quantity: 1, price: 0 }],
    total: 0
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
    this.receiptDataService.receiptData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.mapApiDataToForm(data);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private mapApiDataToForm(apiData: ReceiptData): void {
    // Map the API response to our form structure
    // This will depend on your API response format
    this.formData = {
      store: apiData['store'] || '',
      date: apiData['date'] || new Date().toISOString().split('T')[0],
      items: apiData['items'] || [{ item: '', quantity: 1, price: 0 }],
      total: apiData['total'] || 0
    };
  }

  addItem(): void {
    this.formData.items.push({ item: '', quantity: 1, price: 0 });
  }

  removeItem(index: number): void {
    if (this.formData.items.length > 1) {
      this.formData.items.splice(index, 1);
    }
  }

  isFormValid(): boolean {
    return !!(this.formData.store && 
              this.formData.date && 
              this.formData.total > 0 &&
              this.formData.items.length > 0 &&
              this.formData.items.every(item => 
                item.item && item.quantity > 0 && item.price > 0
              ));
  }

  onConfirm(): void {
    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = '';

    this.http.post<any>('/receipts/save_receipt', this.formData).subscribe({
      next: (response) => {
        this.statusMessage = 'Receipt saved successfully!';
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
