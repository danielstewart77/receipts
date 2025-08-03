import { Component } from '@angular/core';
import { ReceiptMainComponent } from './components/receipt-main.component';

@Component({
  standalone: true,
  selector: 'app-receipts',
  template: '<app-receipt-main></app-receipt-main>',
  imports: [ReceiptMainComponent]
})
export class ReceiptsComponent {}
