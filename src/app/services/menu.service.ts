import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: string;
  emoji: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private firestore = inject(Firestore);
  
  items = signal<MenuItem[]>([]);
  loading = signal(false);
  categories = signal<string[]>(['Bebidas Calientes', 'Bebidas Frías', 'Otros']);

  async loadMenu() {
    this.loading.set(true);
    try {
      const snap = await getDocs(collection(this.firestore, 'menuItems'));
      if (snap.empty) {
        // First load fallback: we don't auto-create here to avoid client writes, but the barista will.
        this.items.set(this.getHardcodedMenu());
      } else {
        const fetchItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
        this.items.set(fetchItems);
        // Extract unique categories based on items
        const catSet = new Set(fetchItems.map(i => i.category));
        if (catSet.size > 0) {
          this.categories.set(Array.from(catSet));
        }
      }
    } catch (e) {
      this.items.set(this.getHardcodedMenu());
    } finally {
      this.loading.set(false);
    }
  }

  async saveItem(item: MenuItem) {
    if (!item.id) {
      item.id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    await setDoc(doc(this.firestore, `menuItems/${item.id}`), {
      name: item.name,
      description: item.description,
      price: item.price,
      emoji: item.emoji,
      category: item.category
    });
    await this.loadMenu(); // refresh
  }

  async deleteItem(id: string) {
    if (id.startsWith('hc_')) {
      alert('Para borrar este menú de prueba, guárdalo primero o agrega nuevos productos directamente.');
      return;
    }
    await deleteDoc(doc(this.firestore, `menuItems/${id}`));
    await this.loadMenu();
  }

  async initializeDefaultMenu() {
    const list = this.getHardcodedMenu();
    for (const item of list) {
       await this.saveItem(item);
    }
  }

  private getHardcodedMenu(): MenuItem[] {
    return [];
  }
}
