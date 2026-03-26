import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  stamps = Array(10).fill(0);

  constructor(
    public auth: AuthService,
    public loyalty: LoyaltyService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loyalty.loadCard();
  }

  get stampsEarned(): number {
    return this.loyalty.stampsCount;
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas tardes';
  }
}
