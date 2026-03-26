import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyService } from '../../services/loyalty.service';
import { AuthService } from '../../services/auth.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.scss']
})
export class QrComponent implements OnInit, OnDestroy {
  @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  refreshCountdown = signal(30);
  private refreshInterval: any;
  private countdownInterval: any;

  constructor(
    public loyalty: LoyaltyService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.generateQR();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    clearInterval(this.countdownInterval);
  }

  generateQR(): void {
    const data = this.loyalty.generateQRData();
    this.refreshCountdown.set(30);
    QRCode.toCanvas(this.qrCanvas.nativeElement, data, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1a0a00',
        light: '#fffbf0'
      }
    });
  }

  startAutoRefresh(): void {
    // Auto-refresh QR every 30 seconds for security
    this.refreshInterval = setInterval(() => this.generateQR(), 30000);
    this.countdownInterval = setInterval(() => {
      this.refreshCountdown.update(v => v > 0 ? v - 1 : 30);
    }, 1000);
  }
}
