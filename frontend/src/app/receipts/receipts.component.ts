import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';

interface UploadStatus {
  type: 'success' | 'error' | 'loading';
  icon: string;
  message: string;
}

interface InStoreReceiptData {
  item: string;
  unitPrice: number;
  totalPrice: number;
  store: string;
  date: string;
}

@Component({
  standalone: true,
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ]
})
export class ReceiptsComponent {
  // File handling for in-store tab
  inStoreSelectedFile: File | null = null;
  inStoreImagePreview: string | null = null;
  inStoreUploadStatus: UploadStatus | null = null;
  
  // File handling for receipt tab
  receiptSelectedFile: File | null = null;
  receiptImagePreview: string | null = null;
  receiptUploadStatus: UploadStatus | null = null;
  
  // In-store verification form
  showInStoreVerification = false;
  inStoreReceiptData: InStoreReceiptData | null = null;
  isSubmittingInStore = false;
  
  // Chat functionality
  chatMessage = '';
  chatHistory: string[] = [];

  constructor(private http: HttpClient, private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }

  onFileSelected(event: any, type: 'in-store' | 'receipt') {
    const file = event.target.files[0];
    if (!file) return;

    if (type === 'in-store') {
      this.inStoreSelectedFile = file;
      this.createImagePreview(file, 'in-store');
      this.inStoreUploadStatus = null;
    } else {
      this.receiptSelectedFile = file;
      this.createImagePreview(file, 'receipt');
      this.receiptUploadStatus = null;
    }
  }

  selectFromGallery(type: 'in-store' | 'receipt') {
    // Create a hidden file input for gallery selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => this.onFileSelected(event, type);
    input.click();
  }

  createImagePreview(file: File, type: 'in-store' | 'receipt') {
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'in-store') {
        this.inStoreImagePreview = reader.result as string;
      } else {
        this.receiptImagePreview = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  clearImage(type: 'in-store' | 'receipt') {
    if (type === 'in-store') {
      this.inStoreSelectedFile = null;
      this.inStoreImagePreview = null;
      this.inStoreUploadStatus = null;
    } else {
      this.receiptSelectedFile = null;
      this.receiptImagePreview = null;
      this.receiptUploadStatus = null;
    }
  }

  upload(endpoint: string) {
    const isInStore = endpoint === 'upload_in_store';
    const selectedFile = isInStore ? this.inStoreSelectedFile : this.receiptSelectedFile;
    
    if (!selectedFile) {
      this.setUploadStatus(isInStore ? 'in-store' : 'receipt', 'error', 'error', 'Please select an image first');
      return;
    }

    // Set loading status
    this.setUploadStatus(isInStore ? 'in-store' : 'receipt', 'loading', 'hourglass_empty', 'Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile, selectedFile.name);

    this.http.post<any>(`http://192.168.4.64:8001/receipts/${endpoint}`, formData).subscribe({
      next: (res) => {
        if (isInStore) {
          // For in-store receipts, show verification form
          this.inStoreReceiptData = res;
          this.showInStoreVerification = true;
          this.setUploadStatus('in-store', 'success', 'check_circle', 'Image processed! Please verify the data below.');
        } else {
          this.setUploadStatus('receipt', 'success', 'check_circle', 'Receipt upload successful!');
          // Clear the image after successful upload
          setTimeout(() => this.clearImage('receipt'), 2000);
        }
      },
      error: (err) => {
        this.setUploadStatus(
          isInStore ? 'in-store' : 'receipt', 
          'error', 
          'error', 
          `Upload failed: ${err.error?.detail || err.message}`
        );
      }
    });
  }

  private setUploadStatus(type: 'in-store' | 'receipt', statusType: 'success' | 'error' | 'loading', icon: string, message: string) {
    const status: UploadStatus = { type: statusType, icon, message };
    if (type === 'in-store') {
      this.inStoreUploadStatus = status;
    } else {
      this.receiptUploadStatus = status;
    }
  }

  saveInStoreReceipt() {
    if (!this.inStoreReceiptData) return;

    this.isSubmittingInStore = true;

    this.http.post<any>('http://192.168.4.64:8001/receipts/save_in_store', this.inStoreReceiptData).subscribe({
      next: (res) => {
        this.setUploadStatus('in-store', 'success', 'check_circle', 'In-store receipt saved successfully!');
        this.resetInStoreForm();
        setTimeout(() => {
          this.inStoreUploadStatus = null;
        }, 3000);
      },
      error: (err) => {
        this.setUploadStatus('in-store', 'error', 'error', `Save failed: ${err.error?.detail || err.message}`);
        this.isSubmittingInStore = false;
      }
    });
  }

  cancelInStoreVerification() {
    this.resetInStoreForm();
  }

  private resetInStoreForm() {
    this.showInStoreVerification = false;
    this.inStoreReceiptData = null;
    this.isSubmittingInStore = false;
    this.clearImage('in-store');
  }

  sendChat() {
    if (!this.chatMessage) return;
    this.http.post<any>('http://192.168.4.64:8001/receipts/chat', { query: this.chatMessage }).subscribe(
      res => {
        this.chatHistory.push(`You: ${this.chatMessage}`);
        this.chatHistory.push(`Assistant: ${res.message}`);
        this.chatMessage = '';
      },
      err => alert(`Chat error: ${err.error.detail || err.message}`)
    );
  }
}
