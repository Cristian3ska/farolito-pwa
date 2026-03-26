import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.loading.set(false);
    });

    // Complete email link sign-in if returning from link
    if (isSignInWithEmailLink(this.auth, window.location.href)) {
      const email = window.localStorage.getItem('emailForSignIn');
      if (email) {
        signInWithEmailLink(this.auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            this.router.navigate(['/home']);
          })
          .catch(console.error);
      }
    }
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    this.router.navigate(['/home']);
  }

  async sendMagicLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  get user(): User | null {
    return this.currentUser();
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  get isAdmin(): boolean {
    const user = this.currentUser();
    return user?.email === 'farolito.coffee@gmail.com';
  }

  get displayName(): string {
    const user = this.currentUser();
    return user?.displayName || user?.email?.split('@')[0] || 'Cliente';
  }

  get photoURL(): string | null {
    return this.currentUser()?.photoURL || null;
  }

  get uid(): string | null {
    return this.currentUser()?.uid || null;
  }
}
