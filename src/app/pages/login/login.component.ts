import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  mode: 'choose' | 'email' | 'email-sent' = 'choose';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    effect(() => {
      // Si el Firebase localiza una sesion, saca al usuario del login y mandalo a su tarjeta
      if (this.auth.currentUser()) {
        this.router.navigate(['/home']);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.loginWithGoogle();
    } catch (e: any) {
      this.error.set(e.message || 'Error al iniciar sesión con Google');
    } finally {
      this.loading.set(false);
    }
  }

  async sendMagicLink(): Promise<void> {
    if (!this.email) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.sendMagicLink(this.email);
      this.mode = 'email-sent';
    } catch (e: any) {
      this.error.set(e.message || 'Error al enviar el enlace');
    } finally {
      this.loading.set(false);
    }
  }
}
