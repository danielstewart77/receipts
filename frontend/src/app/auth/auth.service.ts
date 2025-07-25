import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = ''; // Use relative URLs for production
  private accessTokenKey = 'receipts_access_token';
  private refreshTokenKey = 'receipts_refresh_token';
  private usernameKey = 'receipts_username';

  isLoggedIn$ = new BehaviorSubject<boolean>(this.hasTokens());

  constructor(private http: HttpClient) {}

  private hasTokens() {
    return !!localStorage.getItem(this.accessTokenKey) && !!localStorage.getItem(this.refreshTokenKey);
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.API_URL}/auth/login`, { username, password }).pipe(
      tap(res => {
        this.setTokens(res.access_token, res.refresh_token, username);
        this.isLoggedIn$.next(true);
      })
    );
  }

  refreshToken() {
    const refresh = localStorage.getItem(this.refreshTokenKey);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${refresh}`);
    return this.http.post<any>(`${this.API_URL}/auth/token/refresh`, {}, { headers }).pipe(
      tap(res => this.setTokens(res.access_token, res.refresh_token, localStorage.getItem(this.usernameKey)!))
    );
  }

  logout() {
    localStorage.clear();
    this.isLoggedIn$.next(false);
  }

  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey)!;
  }

  private setTokens(access: string, refresh: string, username: string) {
    localStorage.setItem(this.accessTokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
    localStorage.setItem(this.usernameKey, username);
  }
}
