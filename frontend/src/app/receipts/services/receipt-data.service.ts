import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type TabType = 'in-store' | 'receipt' | 'chat';
export type ViewMode = 'camera' | 'in-store-confirmation' | 'receipt-confirmation';

export interface UploadStatus {
  type: 'success' | 'error' | 'loading';
  icon: string;
  message: string;
}

export interface InStoreReceiptData {
  item: string;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  store: string;
  date: string;
}

export interface ReceiptData {
  // Add receipt-specific fields as needed
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptDataService {
  private activeTabSubject = new BehaviorSubject<TabType>('in-store');
  private viewModeSubject = new BehaviorSubject<ViewMode>('camera');
  private uploadStatusSubject = new BehaviorSubject<UploadStatus | null>(null);
  private inStoreDataSubject = new BehaviorSubject<InStoreReceiptData | null>(null);
  private receiptDataSubject = new BehaviorSubject<ReceiptData | null>(null);
  private selectedFileSubject = new BehaviorSubject<File | null>(null);
  private imagePreviewSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  activeTab$ = this.activeTabSubject.asObservable();
  viewMode$ = this.viewModeSubject.asObservable();
  uploadStatus$ = this.uploadStatusSubject.asObservable();
  inStoreData$ = this.inStoreDataSubject.asObservable();
  receiptData$ = this.receiptDataSubject.asObservable();
  selectedFile$ = this.selectedFileSubject.asObservable();
  imagePreview$ = this.imagePreviewSubject.asObservable();

  // Getters for current values
  get activeTab(): TabType {
    return this.activeTabSubject.value;
  }

  get viewMode(): ViewMode {
    return this.viewModeSubject.value;
  }

  get selectedFile(): File | null {
    return this.selectedFileSubject.value;
  }

  get imagePreview(): string | null {
    return this.imagePreviewSubject.value;
  }

  // Setters
  setActiveTab(tab: TabType): void {
    this.activeTabSubject.next(tab);
    // Reset view mode to camera when changing tabs
    if (tab !== 'chat') {
      this.setViewMode('camera');
    }
  }

  setViewMode(mode: ViewMode): void {
    this.viewModeSubject.next(mode);
  }

  setUploadStatus(status: UploadStatus | null): void {
    this.uploadStatusSubject.next(status);
  }

  setInStoreData(data: InStoreReceiptData | null): void {
    this.inStoreDataSubject.next(data);
  }

  setReceiptData(data: ReceiptData | null): void {
    this.receiptDataSubject.next(data);
  }

  setSelectedFile(file: File | null): void {
    this.selectedFileSubject.next(file);
  }

  setImagePreview(preview: string | null): void {
    this.imagePreviewSubject.next(preview);
  }

  // Utility methods
  getUploadEndpoint(): string {
    return this.activeTab === 'in-store' ? 'upload_in_store' : 'upload_receipt';
  }

  getSaveEndpoint(): string {
    return this.activeTab === 'in-store' ? 'save_in_store' : 'save_receipt';
  }

  clearCurrentData(): void {
    this.setSelectedFile(null);
    this.setImagePreview(null);
    this.setUploadStatus(null);
    this.setInStoreData(null);
    this.setReceiptData(null);
    this.setViewMode('camera');
  }

  resetToCamera(): void {
    this.setViewMode('camera');
    this.setSelectedFile(null);
    this.setImagePreview(null);
    this.setUploadStatus(null);
  }
}
