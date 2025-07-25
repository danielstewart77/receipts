import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
// Update the path below to the correct location of auth.service.ts
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn$.value) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
