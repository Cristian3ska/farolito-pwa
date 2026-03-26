import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  Math = Math; // expose Math to template

  constructor(
    public auth: AuthService,
    public loyalty: LoyaltyService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loyalty.loadCard();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  formatDate(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get redeemedCount(): number {
    return Math.floor((this.loyalty.card()?.totalStamps ?? 0) / 10);
  }
}
