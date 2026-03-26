import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface LoyaltyCard {
  uid: string;
  name?: string;
  email?: string;
  stamps: number;
  totalStamps: number;
  maxStamps: number;
  lastRedeemed: Timestamp | null;
  createdAt: Timestamp;
}

export interface VisitHistory {
  id?: string;
  uid: string;
  type: 'stamp' | 'redeem';
  date: Timestamp;
  baristaId?: string;
  note?: string;
}

export interface QRToken {
  uid: string;
  token: string;
  expiresAt: Timestamp;
  used: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  card = signal<LoyaltyCard | null>(null);
  history = signal<VisitHistory[]>([]);
  qrToken = signal<string>('');
  loading = signal(false);

  readonly MAX_STAMPS = 10;

  async loadCard(): Promise<void> {
    const uid = this.authService.uid;
    if (!uid) return;

    this.loading.set(true);
    try {
      const cardRef = doc(this.firestore, 'loyaltyCards', uid);
      const snap = await getDoc(cardRef);

      if (snap.exists()) {
        const currentData = snap.data() as LoyaltyCard;
        // Update name/email silently if missing (to fix older cards)
        if (!currentData.name || !currentData.email) {
          const currentUser = this.authService.currentUser();
          updateDoc(cardRef, { 
            name: this.authService.displayName,
            email: currentUser?.email || ''
          }).catch(() => {});
          currentData.name = this.authService.displayName;
          currentData.email = currentUser?.email || '';
        }
        this.card.set(currentData);
      } else {
        // Create new card
        const currentUser = this.authService.currentUser();
        const newCard: LoyaltyCard = {
          uid,
          name: this.authService.displayName,
          email: currentUser?.email || '',
          stamps: 0,
          totalStamps: 0,
          maxStamps: this.MAX_STAMPS,
          lastRedeemed: null,
          createdAt: Timestamp.now()
        };
        await setDoc(cardRef, newCard);
        this.card.set(newCard);
      }

      await this.loadHistory();
    } finally {
      this.loading.set(false);
    }
  }

  async loadHistory(): Promise<void> {
    const uid = this.authService.uid;
    if (!uid) return;

    const q = query(
      collection(this.firestore, 'visitHistory'),
      where('uid', '==', uid),
      limit(50)
    );

    const snap = await getDocs(q);
    const items: VisitHistory[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as VisitHistory));
    // Sort locally to avoid needing complicated Firestore composite indexes
    items.sort((a, b) => b.date.toMillis() - a.date.toMillis());
    this.history.set(items);
  }

  generateQRData(): string {
    const uid = this.authService.uid;
    if (!uid) return '';
    // QR contains uid + timestamp for validation
    const token = `${uid}::${Date.now()}::${Math.random().toString(36).substring(2, 9)}`;
    this.qrToken.set(token);
    return token;
  }

  // Barista: add a stamp to a customer's card
  async addStamp(uid: string, baristaId: string): Promise<{ success: boolean; redeemed: boolean }> {
    const cardRef = doc(this.firestore, 'loyaltyCards', uid);
    const snap = await getDoc(cardRef);

    if (!snap.exists()) {
      throw new Error('Customer card not found');
    }

    const card = snap.data() as LoyaltyCard;
    let newStamps = card.stamps + 1;
    let redeemed = false;

    if (newStamps >= this.MAX_STAMPS) {
      newStamps = 0;
      redeemed = true;
    }

    await updateDoc(cardRef, {
      stamps: newStamps,
      totalStamps: card.totalStamps + 1,
      ...(redeemed ? { lastRedeemed: serverTimestamp() } : {})
    });

    // Add to history
    await addDoc(collection(this.firestore, 'visitHistory'), {
      uid,
      type: redeemed ? 'redeem' : 'stamp',
      date: serverTimestamp(),
      baristaId,
      note: redeemed ? '¡Café de cortesía canjeado!' : 'Sello agregado'
    });

    return { success: true, redeemed };
  }

  // Barista: search customer by email
  async findCustomerByEmail(email: string): Promise<LoyaltyCard | null> {
    const q = query(
      collection(this.firestore, 'loyaltyCards'),
      where('email', '==', email),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LoyaltyCard;
  }

  // Barista: search customer by UID (from QR)
  async findCustomerByUid(uid: string): Promise<LoyaltyCard | null> {
    const cardRef = doc(this.firestore, 'loyaltyCards', uid);
    const snap = await getDoc(cardRef);
    if (!snap.exists()) return null;
    return snap.data() as LoyaltyCard;
  }

  // Barista: fetch all registered customers
  async getAllCustomers(): Promise<LoyaltyCard[]> {
    const snap = await getDocs(collection(this.firestore, 'loyaltyCards'));
    const all = snap.docs.map(d => d.data() as LoyaltyCard);
    // Sort by name alphabetically
    all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return all;
  }

  get stampsCount(): number {
    return this.card()?.stamps ?? 0;
  }

  get progressPercent(): number {
    return (this.stampsCount / this.MAX_STAMPS) * 100;
  }
}
