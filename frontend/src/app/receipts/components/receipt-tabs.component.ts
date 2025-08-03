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
    }

    .tab-label {
      margin-left: 0.5rem;
      font-size: 0.9rem;
      
      @media (max-width: 480px) {
        display: none;
      }
    }

    ::ng-deep .mat-mdc-tab {
      min-width: 80px;
      
      @media (min-width: 481px) {
        min-width: 120px;
      }
    }

    ::ng-deep .mat-mdc-tab-label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      
      @media (max-width: 480px) {
        padding: 12px 8px;
      }
    }

    ::ng-deep .mat-mdc-tab-body-content {
      padding-top: 0;
      overflow: visible;
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
