import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ReceiptsComponent } from './receipts/receipts.component';
import { AuthGuard } from './shared/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/receipts', pathMatch: 'full' },
  { path: 'receipts', component: ReceiptsComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '/receipts', pathMatch: 'full' }
];
