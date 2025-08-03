import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ReceiptDataService, TabType } from '../services/receipt-data.service';

@Component({
  standalone: true,
  selector: 'app-receipt-tabs',
  template: `
    <mat-tab-group 
      [selectedIndex]="selectedTabIndex" 
      (selectedTabChange)="onTabChange($event.index)"
      class="receipt-tabs">
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon>store</mat-icon>
          <span class="tab-label">In‑Store</span>
        </ng-template>
      </mat-tab>
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon>receipt</mat-icon>
          <span class="tab-label">Receipt</span>
        </ng-template>
      </mat-tab>
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon>chat</mat-icon>
          <span class="tab-label">Chat</span>
        </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .receipt-tabs {
      width: 100%;
      background-color: var(--mat-sys-surface-container);
    }

    .tab-label {
      margin-left: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      
      @media (max-width: 480px) {
        display: none;
      }
    }

    ::ng-deep .mat-mdc-tab {
      min-width: 80px;
      opacity: 0.7;
      transition: all 0.3s ease;
      
      @media (min-width: 481px) {
        min-width: 120px;
      }
      
      &.mdc-tab--active {
        opacity: 1;
        background-color: var(--mat-sys-surface-container-high);
        
        .mdc-tab__text-label {
          color: var(--mat-sys-primary) !important;
          font-weight: 700;
        }
        
        .mat-icon {
          color: var(--mat-sys-primary) !important;
          transform: scale(1.1);
        }
      }
      
      &:not(.mdc-tab--active) {
        .mdc-tab__text-label {
          color: var(--mat-sys-on-surface-variant) !important;
          font-weight: 500;
        }
        
        .mat-icon {
          color: var(--mat-sys-on-surface-variant) !important;
        }
        
        &:hover {
          opacity: 0.9;
          background-color: var(--mat-sys-surface-container-high);
          
          .mdc-tab__text-label {
            color: var(--mat-sys-on-surface) !important;
          }
          
          .mat-icon {
            color: var(--mat-sys-on-surface) !important;
          }
        }
      }
    }

    ::ng-deep .mat-mdc-tab-label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 20px;
      gap: 0.5rem;
      transition: all 0.3s ease;
      
      @media (max-width: 480px) {
        padding: 16px 12px;
      }
      
      .mat-icon {
        transition: all 0.3s ease;
        font-size: 1.3rem;
        width: 1.3rem;
        height: 1.3rem;
      }
    }

    ::ng-deep .mat-mdc-tab-header {
      background-color: var(--mat-sys-surface-container) !important;
      border-bottom: 2px solid var(--mat-sys-outline-variant);
    }

    ::ng-deep .mat-mdc-tab-body-content {
      padding-top: 0;
      overflow: visible;
      background-color: var(--mat-sys-surface);
    }

    ::ng-deep .mdc-tab-indicator__content--underline {
      background-color: var(--mat-sys-primary) !important;
      height: 3px !important;
      border-radius: 2px !important;
    }
  `],
  imports: [CommonModule, MatTabsModule, MatIconModule]
})
export class ReceiptTabsComponent implements OnInit, OnDestroy {
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();

  private tabMap: TabType[] = ['in-store', 'receipt', 'chat'];

  constructor(private receiptDataService: ReceiptDataService) {}

  ngOnInit(): void {
    // Subscribe to active tab changes from the service
    this.receiptDataService.activeTab$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeTab => {
        this.selectedTabIndex = this.tabMap.indexOf(activeTab);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    const selectedTab = this.tabMap[index];
    this.receiptDataService.setActiveTab(selectedTab);
  }
}
