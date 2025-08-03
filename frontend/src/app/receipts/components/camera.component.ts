import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ReceiptDataService, UploadStatus } from '../services/receipt-data.service';

@Component({
  standalone: true,
  selector: 'app-camera',
  template: `
    <div class="camera-container">
      <!-- Image preview section - always visible -->
      <div class="image-preview">
        <div class="preview-content" [class.has-image]="imagePreview">
          <img 
            *ngIf="imagePreview" 
            [src]="imagePreview" 
            alt="Preview" 
            class="preview-image">
          <div *ngIf="!imagePreview" class="placeholder">
            <mat-icon>photo_camera</mat-icon>
            <span>No image selected</span>
          </div>
        </div>
      </div>

      <!-- Camera controls -->
      <div class="camera-controls">
        <input 
          #fileInput
          type="file" 
          accept="image/*" 
          capture="environment"
          (change)="onFileSelected($event)"
          style="display: none;">
        
        <button 
          mat-raised-button 
          color="primary" 
          class="camera-button"
          (click)="fileInput.click()">
          <mat-icon>camera_alt</mat-icon>
          <span>Take Photo</span>
        </button>
        
        <button 
          mat-stroked-button 
          color="primary" 
          class="gallery-button"
          (click)="selectFromGallery()">
          <mat-icon>photo_library</mat-icon>
          <span>Choose from Gallery</span>
        </button>
      </div>

      <!-- Action buttons - only show when image is selected -->
      <div class="action-controls" *ngIf="selectedFile">
        <button 
          mat-raised-button 
          color="accent" 
          class="upload-button"
          (click)="upload()" 
          [disabled]="!selectedFile || isUploading">
          <mat-icon *ngIf="!isUploading">cloud_upload</mat-icon>
          <mat-icon *ngIf="isUploading" class="spinning">hourglass_empty</mat-icon>
          <span>{{ isUploading ? 'Uploading...' : 'Upload Image' }}</span>
        </button>
        
        <button 
          mat-button 
          color="warn" 
          class="clear-button"
          (click)="clearImage()"
          [disabled]="isUploading">
          <mat-icon>clear</mat-icon>
          <span>Clear</span>
        </button>
      </div>
      
      <!-- Upload status -->
      <div class="upload-status" [ngClass]="uploadStatus.type" *ngIf="uploadStatus">
        <mat-icon [ngClass]="uploadStatus.type">{{ uploadStatus.icon }}</mat-icon>
        <span>{{ uploadStatus.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .camera-container {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 500px;
      margin: 0 auto;
    }

    // Image preview styling
    .image-preview {
      width: 100%;
      min-height: 300px;
      border: 2px dashed #ccc;
      border-radius: 12px;
      background-color: #fafafa;
      overflow: hidden;
      
      @media (min-width: 768px) {
        min-height: 350px;
      }
    }

    .preview-content {
      width: 100%;
      height: 100%;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      
      @media (min-width: 768px) {
        min-height: 350px;
      }
      
      &.has-image {
        padding: 0;
        background-color: transparent;
      }
    }

    .preview-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #999;
      font-size: 1rem;
      
      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: #ccc;
      }
    }

    // Camera controls styling
    .camera-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      @media (min-width: 480px) {
        flex-direction: row;
        justify-content: center;
      }
    }

    .camera-button, .gallery-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      
      @media (min-width: 480px) {
        flex: 1;
        max-width: 200px;
      }
      
      mat-icon {
        font-size: 1.25rem;
      }
      
      span {
        @media (max-width: 360px) {
          font-size: 0.9rem;
        }
      }
    }

    // Action controls styling
    .action-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      @media (min-width: 480px) {
        flex-direction: row;
        justify-content: center;
      }
    }

    .upload-button, .clear-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      
      @media (min-width: 480px) {
        flex: 1;
        max-width: 200px;
      }
      
      mat-icon {
        font-size: 1.25rem;
        
        &.spinning {
          animation: spin 1s linear infinite;
        }
      }
    }

    // Upload status styling
    .upload-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
      
      &.success {
        background-color: #e8f5e8;
        color: #2e7d32;
        border-left: 4px solid #4caf50;
      }
      
      &.error {
        background-color: #ffeaea;
        color: #c62828;
        border-left: 4px solid #f44336;
      }
      
      &.loading {
        background-color: #e3f2fd;
        color: #1565c0;
        border-left: 4px solid #2196f3;
      }
      
      mat-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
        
        &.success {
          color: #4caf50;
        }
        
        &.error {
          color: #f44336;
        }
        
        &.loading {
          color: #2196f3;
          animation: pulse 1.5s ease-in-out infinite;
        }
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    // Mobile optimizations
    @media (max-width: 480px) {
      .camera-container {
        padding: 0.75rem;
        gap: 1.25rem;
      }
      
      .image-preview {
        min-height: 250px;
      }
      
      .preview-content {
        min-height: 250px;
      }
    }

    @media (max-width: 360px) {
      .camera-container {
        padding: 0.5rem;
        gap: 1rem;
      }
      
      .camera-button, .gallery-button, 
      .upload-button, .clear-button {
        padding: 0.625rem 1rem;
        font-size: 0.9rem;
      }
    }
  `],
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class CameraComponent implements OnInit, OnDestroy {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadStatus: UploadStatus | null = null;
  isUploading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private receiptDataService: ReceiptDataService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Subscribe to service state
    this.receiptDataService.selectedFile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(file => this.selectedFile = file);

    this.receiptDataService.imagePreview$
      .pipe(takeUntil(this.destroy$))
      .subscribe(preview => this.imagePreview = preview);

    this.receiptDataService.uploadStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.uploadStatus = status;
        this.isUploading = status?.type === 'loading';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.receiptDataService.setSelectedFile(file);
    this.createImagePreview(file);
    this.receiptDataService.setUploadStatus(null);
  }

  selectFromGallery(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => this.onFileSelected(event);
    input.click();
  }

  clearImage(): void {
    this.receiptDataService.clearCurrentData();
  }

  upload(): void {
    if (!this.selectedFile) {
      this.receiptDataService.setUploadStatus({
        type: 'error',
        icon: 'error',
        message: 'Please select an image first'
      });
      return;
    }

    // Set loading status
    this.receiptDataService.setUploadStatus({
      type: 'loading',
      icon: 'hourglass_empty',
      message: 'Uploading...'
    });

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);
    const endpoint = this.receiptDataService.getUploadEndpoint();

    this.http.post<any>(`/receipts/${endpoint}`, formData).subscribe({
      next: (response) => {
        this.receiptDataService.setUploadStatus({
          type: 'success',
          icon: 'check_circle',
          message: 'Image processed! Please verify the data.'
        });

        // Store the response data and switch to confirmation view
        if (this.receiptDataService.activeTab === 'in-store') {
          this.receiptDataService.setInStoreData(response);
          this.receiptDataService.setViewMode('in-store-confirmation');
        } else {
          this.receiptDataService.setReceiptData(response);
          this.receiptDataService.setViewMode('receipt-confirmation');
        }
      },
      error: (error) => {
        this.receiptDataService.setUploadStatus({
          type: 'error',
          icon: 'error',
          message: `Upload failed: ${error.error?.detail || error.message}`
        });
      }
    });
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.receiptDataService.setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
}
