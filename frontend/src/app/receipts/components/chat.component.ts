import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  standalone: true,
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <!-- Chat History Area -->
      <div class="chat-history" #chatHistory>
        <div class="chat-messages">
          <div 
            *ngFor="let message of messages; trackBy: trackByMessageId" 
            class="message-wrapper"
            [ngClass]="{ 'user-message': message.isUser, 'assistant-message': !message.isUser }">
            <div class="message-bubble">
              <div class="message-text" [innerHTML]="message.text"></div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
          
          <!-- Loading indicator -->
          <div *ngIf="isLoading" class="message-wrapper assistant-message">
            <div class="message-bubble loading">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          
          <!-- Empty state -->
          <div *ngIf="messages.length === 0 && !isLoading" class="empty-state">
            <mat-icon>chat_bubble_outline</mat-icon>
            <h3>Start a conversation</h3>
            <p>Ask me anything about your receipts!</p>
            <div class="suggested-questions">
              <button 
                mat-stroked-button 
                *ngFor="let suggestion of suggestedQuestions"
                (click)="sendSuggestion(suggestion)"
                class="suggestion-button">
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <form (ngSubmit)="sendMessage()" class="input-form">
          <mat-form-field appearance="outline" class="message-input">
            <input 
              matInput 
              [(ngModel)]="currentMessage" 
              name="message"
              placeholder="Ask about your receipts..."
              [disabled]="isLoading"
              #messageInput
              (keydown.enter)="sendMessage()"
              autocomplete="off">
          </mat-form-field>
          
          <button 
            mat-fab 
            color="primary" 
            type="submit"
            class="send-button"
            [disabled]="!currentMessage.trim() || isLoading">
            <mat-icon *ngIf="!isLoading">send</mat-icon>
            <mat-icon *ngIf="isLoading" class="spinning">hourglass_empty</mat-icon>
          </button>
        </form>
        
        <!-- Error message -->
        <div *ngIf="errorMessage" class="error-message">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage }}</span>
          <button mat-icon-button (click)="clearError()" class="close-error">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 180px);
      max-height: 700px;
      background-color: var(--mat-sys-surface);
    }

    // Chat History Area (Top Section)
    .chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background-color: var(--mat-sys-surface);
      border: 2px solid var(--mat-sys-outline-variant);
      border-radius: 8px 8px 0 0;
      min-height: 400px;
    }

    .chat-messages {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 100%;
    }

    // Message Styling
    .message-wrapper {
      display: flex;
      max-width: 80%;
      
      &.user-message {
        align-self: flex-end;
        justify-content: flex-end;
      }
      
      &.assistant-message {
        align-self: flex-start;
        justify-content: flex-start;
      }
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 18px;
      position: relative;
      word-wrap: break-word;
      max-width: 100%;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      
      .user-message & {
        background-color: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        border-bottom-right-radius: 4px;
      }
      
      .assistant-message & {
        background-color: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface);
        border-bottom-left-radius: 4px;
      }
      
      &.loading {
        background-color: var(--mat-sys-surface-container);
        padding: 1rem;
      }
    }

    .message-text {
      font-size: 1rem;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      word-wrap: break-word;
      
      // HTML content styling
      ::ng-deep p {
        margin: 0 0 0.5rem 0;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      ::ng-deep br {
        line-height: 1.4;
      }
      
      ::ng-deep strong, ::ng-deep b {
        font-weight: 600;
      }
      
      ::ng-deep em, ::ng-deep i {
        font-style: italic;
      }
      
      ::ng-deep ul, ::ng-deep ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      
      ::ng-deep li {
        margin-bottom: 0.25rem;
      }
      
      ::ng-deep code {
        background-color: rgba(255, 255, 255, 0.1);
        padding: 0.125rem 0.25rem;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }
      
      ::ng-deep pre {
        background-color: rgba(255, 255, 255, 0.1);
        padding: 0.75rem;
        border-radius: 6px;
        overflow-x: auto;
        margin: 0.5rem 0;
        
        code {
          background: none;
          padding: 0;
        }
      }
      
      ::ng-deep blockquote {
        border-left: 3px solid rgba(255, 255, 255, 0.3);
        padding-left: 1rem;
        margin: 0.5rem 0;
        font-style: italic;
        opacity: 0.9;
      }
      
      ::ng-deep table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.5rem 0;
        font-size: 0.9rem;
      }
      
      ::ng-deep th, ::ng-deep td {
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.375rem 0.5rem;
        text-align: left;
      }
      
      ::ng-deep th {
        font-weight: 600;
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    .message-time {
      font-size: 0.75rem;
      opacity: 0.7;
      text-align: right;
      
      .assistant-message & {
        text-align: left;
      }
    }

    // Typing Indicator
    .typing-indicator {
      display: flex;
      gap: 0.25rem;
      align-items: center;
      
      span {
        width: 6px;
        height: 6px;
        background-color: var(--mat-sys-on-surface-variant);
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    // Empty State
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
      height: 100%;
      padding: 2rem;
      
      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 1rem;
      }
      
      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--mat-sys-on-surface);
        font-size: 1.25rem;
        font-weight: 500;
      }
      
      p {
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
      }
    }

    .suggested-questions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      max-width: 300px;
    }

    .suggestion-button {
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // Input Area (Bottom Section)
    .chat-input-area {
      background-color: var(--mat-sys-surface);
      border: 2px solid var(--mat-sys-outline-variant);
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 1rem;
    }

    .input-form {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      
      ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }
      
      ::ng-deep .mdc-text-field--outlined {
        border-radius: 24px;
      }
      
      ::ng-deep .mat-mdc-text-field-wrapper {
        padding: 0 16px;
      }
      
      ::ng-deep .mdc-text-field--outlined .mdc-text-field__input {
        padding: 12px 0;
        font-size: 1rem;
      }
      
      ::ng-deep .mdc-text-field--outlined .mdc-floating-label {
        display: none;
      }
      
      ::ng-deep .mdc-text-field--outlined .mdc-notched-outline {
        border-color: #ddd;
      }
      
      ::ng-deep .mdc-text-field--focused .mdc-notched-outline {
        border-color: #1976d2;
      }
    }

    .send-button {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      
      mat-icon {
        font-size: 1.25rem;
        
        &.spinning {
          animation: spin 1s linear infinite;
        }
      }
    }

    // Error Message
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
      background-color: rgba(198, 40, 40, 0.15);
      color: #f48fb1;
      border: 1px solid #f44336;
      border-radius: 8px;
      font-size: 0.9rem;
      
      mat-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      
      span {
        flex: 1;
      }
      
      .close-error {
        width: 24px;
        height: 24px;
        
        mat-icon {
          font-size: 1rem;
        }
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    // Mobile Optimizations
    @media (max-width: 600px) {
      .chat-container {
        height: calc(100vh - 140px);
      }
      
      .chat-history {
        padding: 0.75rem;
        min-height: 300px;
      }
      
      .message-wrapper {
        max-width: 85%;
      }
      
      .message-bubble {
        padding: 0.625rem 0.875rem;
        border-radius: 16px;
        
        .user-message & {
          border-bottom-right-radius: 4px;
        }
        
        .assistant-message & {
          border-bottom-left-radius: 4px;
        }
      }
      
      .message-text {
        font-size: 0.95rem;
        
        ::ng-deep p {
          margin: 0 0 0.375rem 0;
        }
        
        ::ng-deep ul, ::ng-deep ol {
          margin: 0.375rem 0;
          padding-left: 1.25rem;
        }
        
        ::ng-deep li {
          margin-bottom: 0.125rem;
        }
        
        ::ng-deep table {
          font-size: 0.85rem;
        }
        
        ::ng-deep th, ::ng-deep td {
          padding: 0.25rem 0.375rem;
        }
      }
      
      .chat-input-area {
        padding: 0.75rem;
      }
      
      .send-button {
        width: 44px;
        height: 44px;
      }
      
      .empty-state {
        padding: 1.5rem;
        
        mat-icon {
          font-size: 2.5rem;
          width: 2.5rem;
          height: 2.5rem;
        }
        
        h3 {
          font-size: 1.1rem;
        }
        
        p {
          font-size: 0.9rem;
        }
      }
      
      .suggestion-button {
        font-size: 0.85rem;
        padding: 0.4rem 0.8rem;
      }
    }

    @media (max-width: 360px) {
      .chat-history {
        padding: 0.5rem;
      }
      
      .chat-input-area {
        padding: 0.5rem;
      }
      
      .input-form {
        gap: 0.5rem;
      }
      
      .message-wrapper {
        max-width: 90%;
      }
    }

    // Scrollbar styling
    .chat-history::-webkit-scrollbar {
      width: 6px;
    }

    .chat-history::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .chat-history::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .chat-history::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
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
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatHistory') chatHistory!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  errorMessage = '';
  
  suggestedQuestions = [
    'What did I spend at grocery stores this month?',
    'Show me all receipts from last week',
    'How much did I spend on restaurants?',
    'Find my Target receipts'
  ];

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Load previous chat history if available
    this.loadChatHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  sendMessage(): void {
    const message = this.currentMessage.trim();
    if (!message || this.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.currentMessage = '';
    this.clearError();
    this.shouldScrollToBottom = true;

    // Set loading state
    this.isLoading = true;

    // Send to API
    this.http.post<any>('/receipts/chat', { query: message }).subscribe({
      next: (response) => {
        const assistantMessage: ChatMessage = {
          id: this.generateMessageId(),
          text: response.message || response.response || 'I received your message.',
          isUser: false,
          timestamp: new Date()
        };

        this.messages.push(assistantMessage);
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.saveChatHistory();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Failed to send message: ${error.error?.detail || error.message}`;
        
        // Remove the user message if the API call failed
        if (this.messages[this.messages.length - 1]?.id === userMessage.id) {
          this.messages.pop();
        }
      }
    });
  }

  sendSuggestion(suggestion: string): void {
    this.currentMessage = suggestion;
    this.sendMessage();
  }

  clearError(): void {
    this.errorMessage = '';
  }

  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private scrollToBottom(): void {
    try {
      const element = this.chatHistory.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.warn('Could not scroll to bottom:', err);
    }
  }

  private loadChatHistory(): void {
    // Load from localStorage or API if needed
    const saved = localStorage.getItem('receipts_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.messages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        this.shouldScrollToBottom = true;
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    }
  }

  private saveChatHistory(): void {
    try {
      localStorage.setItem('receipts_chat_history', JSON.stringify(this.messages));
    } catch (err) {
      console.warn('Could not save chat history:', err);
    }
  }
}
