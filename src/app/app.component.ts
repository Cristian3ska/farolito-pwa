import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, BottomNavComponent],
  template: `
    <router-outlet></router-outlet>
    <app-bottom-nav *ngIf="!router.url.includes('/login')"></app-bottom-nav>
  `,
  styles: []
})
export class AppComponent {
  public router = inject(Router);
}
