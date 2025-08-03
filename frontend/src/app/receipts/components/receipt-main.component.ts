import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ReceiptDataService, TabType, ViewMode } from '../services/receipt-data.service';
import { ReceiptTabsComponent } from './receipt-tabs.component';
import { CameraComponent } from './camera.component';
import { InStoreConfirmationComponent } from './in-store-confirmation.component';
import { ReceiptConfirmationComponent } from './receipt-confirmation.component';
import { ChatComponent } from './chat.component';

@Component({
  standalone: true,
  selector: 'app-receipt-main',
  template: `
    <mat-toolbar color="primary" class="main-toolbar">
      <span class="toolbar-title">
        <mat-icon>receipt</mat-icon>
        Receipts App
      </span>
      <span class="spacer"></span>
      <button mat-button (click)="logout()" class="logout-button">
        <mat-icon>logout</mat-icon>
        <span class="logout-text">Logout</span>
      </button>
    </mat-toolbar>

    <div class="main-content">
      <!-- Tabs component -->
      <app-receipt-tabs></app-receipt-tabs>

      <!-- Content area -->
      <div class="content-area">
        <!-- Camera view for in-store and receipt tabs -->
        <app-camera *ngIf="showCamera"></app-camera>

        <!-- In-store confirmation -->
        <app-in-store-confirmation *ngIf="showInStoreConfirmation"></app-in-store-confirmation>

        <!-- Receipt confirmation -->
        <app-receipt-confirmation *ngIf="showReceiptConfirmation"></app-receipt-confirmation>

        <!-- Chat -->
        <app-chat *ngIf="showChat"></app-chat>
      </div>
    </div>
  `,
  styles: [`
    .main-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      font-weight: 500;
      
      mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    .spacer {
      flex: 1 1 auto;
    }

    .logout-button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      
      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
      
      .logout-text {
        @media (max-width: 480px) {
          display: none;
        }
      }
    }

    .main-content {
      min-height: calc(100vh - 64px);
      background-color: #fafafa;
    }

    .content-area {
      min-height: calc(100vh - 112px); // Account for toolbar and tabs
      background-color: white;
      border-radius: 8px 8px 0 0;
      margin-top: 8px;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
    }

    // Responsive adjustments
    @media (max-width: 600px) {
      .main-toolbar {
        padding: 0 8px;
      }
      
      .toolbar-title {
        font-size: 1rem;
        
        mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }
      
      .content-area {
        margin-top: 4px;
        border-radius: 4px 4px 0 0;
      }
      
      .confirmation-container {
        padding: 2rem 0.75rem;
        
        mat-icon {
          font-size: 3rem;
          width: 3rem;
          height: 3rem;
        }
        
        h3 {
          font-size: 1.25rem;
        }
        
        p {
          font-size: 0.9rem;
        }
      }
    }

    // Tab content specific styling
    ::ng-deep .mat-mdc-tab-body-content {
      overflow: visible !important;
    }

    ::ng-deep .mat-mdc-tab-group {
      background-color: white;
    }
  `],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ReceiptTabsComponent,
    CameraComponent,
    InStoreConfirmationComponent,
    ReceiptConfirmationComponent,
    ChatComponent
  ]
})
export class ReceiptMainComponent implements OnInit, OnDestroy {
  activeTab: TabType = 'in-store';
  viewMode: ViewMode = 'camera';
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private receiptDataService: ReceiptDataService
  ) {}

  ngOnInit(): void {
    // Subscribe to service state changes
    this.receiptDataService.activeTab$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tab: TabType) => this.activeTab = tab);

    this.receiptDataService.viewMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode: ViewMode) => this.viewMode = mode);

    // Initialize with in-store tab selected
    this.receiptDataService.setActiveTab('in-store');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
  }

  backToCamera(): void {
    this.receiptDataService.resetToCamera();
  }

  // Computed properties for template
  get showCamera(): boolean {
    return (this.activeTab === 'in-store' || this.activeTab === 'receipt') && 
           this.viewMode === 'camera';
  }

  get showInStoreConfirmation(): boolean {
    return this.activeTab === 'in-store' && this.viewMode === 'in-store-confirmation';
  }

  get showReceiptConfirmation(): boolean {
    return this.activeTab === 'receipt' && this.viewMode === 'receipt-confirmation';
  }

  get showChat(): boolean {
    return this.activeTab === 'chat';
  }
}
