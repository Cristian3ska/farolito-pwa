import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'qr',
    loadComponent: () => import('./pages/qr/qr.component').then(m => m.QrComponent),
    canActivate: [authGuard]
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'barista',
    loadComponent: () => import('./pages/barista/barista.component').then(m => m.BaristaComponent),
    canActivate: [authGuard, adminGuard]
  },
  { path: '**', redirectTo: 'home' }
];
