import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoyaltyService, LoyaltyCard } from '../../services/loyalty.service';
import { AuthService } from '../../services/auth.service';
import { MenuService, MenuItem } from '../../services/menu.service';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-barista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barista.component.html',
  styleUrls: ['./barista.component.scss']
})
export class BaristaComponent implements OnInit, OnDestroy {
  private loyaltyService = inject(LoyaltyService);
  private authService = inject(AuthService);
  public menuService = inject(MenuService);

  searchEmail = '';
  foundCard = signal<LoyaltyCard | null>(null);
  processing = signal(false);
  
  message = signal('');
  messageType = signal<'success'|'error'>('success');

  // Scanner State
  activeTab = signal<'email' | 'scan' | 'menu'>('scan');
  scannerActive = signal(false);
  scanSuccessAnim = signal(false); // Used to show checkmark overlay
  private html5QrCode: Html5Qrcode | null = null;

  // Menu State
  editingItem = signal<MenuItem | null>(null);
  addingCategory = signal(false);
  newCategoryInput = '';

  // Customer List State
  allCustomers = signal<LoyaltyCard[]>([]);
  customersLoading = signal(false);
  customerFilter = '';

  get filteredCustomers(): LoyaltyCard[] {
    const q = this.customerFilter.toLowerCase().trim();
    if (!q) return this.allCustomers();
    return this.allCustomers().filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }


  ngOnInit() {
    this.menuService.loadMenu();
    // Start scanner automatically if tab is scan
    setTimeout(() => {
      this.startScanner();
    }, 500);
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  switchTab(tab: 'email' | 'scan' | 'menu') {
    this.activeTab.set(tab);
    this.foundCard.set(null);
    this.message.set('');
    this.editingItem.set(null);
    
    if (tab === 'scan') {
      setTimeout(() => this.startScanner(), 100);
    } else {
      this.stopScanner();
    }

    if (tab === 'email') {
      this.loadCustomers();
    }
  }

  async loadCustomers() {
    this.customersLoading.set(true);
    try {
      const list = await this.loyaltyService.getAllCustomers();
      this.allCustomers.set(list);
    } catch (e) {
      console.error('Error loading customers', e);
    } finally {
      this.customersLoading.set(false);
    }
  }

  async startScanner() {
    if (this.scannerActive() || this.activeTab() !== 'scan') return;

    try {
      this.html5QrCode = new Html5Qrcode("reader");
      await this.html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => this.onScanSuccess(decodedText),
        (errorMessage) => { /* ignore normal scan errors */ }
      );
      this.scannerActive.set(true);
    } catch (err) {
      console.warn('Error starting scanner', err);
      this.showFeedback('No se pudo acceder a la cámara. Revisa los permisos.', 'error');
    }
  }

  async stopScanner() {
    if (this.html5QrCode && this.scannerActive()) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (err) { }
      this.scannerActive.set(false);
    }
  }

  private async onScanSuccess(decodedText: string) {
    if (this.processing() || this.scanSuccessAnim()) return;
    
    // Structure: uid::timestamp::randomStr
    const parts = decodedText.split('::');
    if (parts.length < 2) {
      this.showFeedback('Código QR no válido.', 'error');
      return;
    }
    
    const uid = parts[0];
    const timestamp = parseInt(parts[1], 10);
    
    // Use Math.abs in case device clocks are out of sync (phone ahead of computer)
    const isExpired = Math.abs(Date.now() - timestamp) > 300000; // 5 mins
    if (isExpired) {
      this.showFeedback('El código QR ha expirado. Pide al cliente que lo recargue.', 'error');
      return;
    }

    this.stopScanner(); // Pause scanner when we find someone
    
    // Show checkmark animation before showing card
    this.scanSuccessAnim.set(true);

    setTimeout(async () => {
      this.scanSuccessAnim.set(false);
      this.processing.set(true);

      try {
        const card = await this.loyaltyService.findCustomerByUid(uid);
        if (card) {
          this.foundCard.set(card);
          this.message.set(''); // Clear any previous errors
        } else {
          this.showFeedback('No se encontró a este cliente.', 'error');
          this.startScanner(); // restart if error
        }
      } catch (err: any) {
        console.error('Error procesando QR:', err);
        if (err?.code === 'permission-denied') {
           this.showFeedback('Permisos denegados. Actualiza Reglas en Firebase.', 'error');
        } else {
           this.showFeedback('Error al procesar el código.', 'error');
        }
        this.startScanner();
      } finally {
        this.processing.set(false);
      }
    }, 1200); // 1.2s delay for the checkmark animation
  }

  async searchByEmail() {
    if (!this.searchEmail.trim()) return;
    
    this.processing.set(true);
    this.message.set('');
    this.foundCard.set(null);

    try {
      const card = await this.loyaltyService.findCustomerByEmail(this.searchEmail.trim());
      if (card) {
        this.foundCard.set(card);
      } else {
        this.showFeedback('No existe un cliente con ese correo.', 'error');
      }
    } catch (error) {
      this.showFeedback('Error al buscar. Intenta de nuevo.', 'error');
    } finally {
      this.processing.set(false);
    }
  }

  async addStampToFound() {
    const card = this.foundCard();
    if (!card) return;

    this.processing.set(true);
    try {
      const result = await this.loyaltyService.addStamp(card.uid, this.authService.uid!);
      
      // Update local card immediately for UI
      card.stamps = result.redeemed ? 0 : card.stamps + 1;
      card.totalStamps++;
      this.foundCard.set({...card}); // trigger signal

      if (result.redeemed) {
        this.showFeedback('¡Tarjeta llena! Entrega el café de cortesía.', 'success');
      } else {
        this.showFeedback(`Sello agregado. Total: ${card.stamps}/10`, 'success');
      }
      
      // Clear after a few seconds if using scanner, so they can scan next person
      if (this.activeTab() === 'scan') {
        setTimeout(() => {
          this.foundCard.set(null);
          this.message.set('');
          this.startScanner();
        }, 4000);
      }
      
    } catch (error: any) {
      console.error('Error adding stamp:', error);
      if (error?.code === 'permission-denied') {
        this.showFeedback('Permiso denegado. Actualiza Reglas Firebase.', 'error');
      } else {
        this.showFeedback('No se pudo guardar el sello.', 'error');
      }
    } finally {
      this.processing.set(false);
    }
  }

  get stampsArray(): number[] {
    const card = this.foundCard();
    const arr = new Array(10).fill(0);
    if (!card) return arr;
    for (let i = 0; i < card.stamps; i++) {
      arr[i] = 1;
    }
    return arr;
  }

  private showFeedback(msg: string, type: 'success'|'error') {
    this.message.set(msg);
    this.messageType.set(type);
    
    if (type === 'error') {
      setTimeout(() => {
        if (this.message() === msg) this.message.set('');
      }, 5000);
    }
  }

  // --- Menu Editing ---
  startNewMenuItem() {
    this.addingCategory.set(false);
    this.newCategoryInput = '';
    this.editingItem.set({
      name: '',
      description: '',
      price: '',
      category: this.menuService.categories()[0] || '',
      emoji: '☕'
    });
  }

  editMenuItem(item: MenuItem) {
    this.addingCategory.set(false);
    this.newCategoryInput = '';
    // Clone item so we don't mutate list directly
    this.editingItem.set({...item});
  }

  cancelMenuEdit() {
    this.editingItem.set(null);
    this.addingCategory.set(false);
    this.newCategoryInput = '';
  }

  confirmNewCategory() {
    const name = this.newCategoryInput.trim();
    if (!name) return;
    const current = this.menuService.categories();
    if (!current.includes(name)) {
      this.menuService.categories.set([...current, name]);
    }
    // Assign it to the editing item
    const item = this.editingItem();
    if (item) item.category = name;
    this.addingCategory.set(false);
    this.newCategoryInput = '';
  }

  async saveMenuItem() {
    const item = this.editingItem();
    if (!item || !item.name || !item.price || !item.category) {
      this.showFeedback('Nombre, precio y categoría son requeridos.', 'error');
      return;
    }
    this.processing.set(true);
    try {
      await this.menuService.saveItem(item);
      this.editingItem.set(null);
      this.showFeedback('Elemento guardado correctamente.', 'success');
    } catch (e) {
      this.showFeedback('Error al guardar.', 'error');
    } finally {
      this.processing.set(false);
    }
  }

  async deleteMenuItem(id: string) {
    if(!confirm('¿Seguro de borrar este elemento?')) return;
    this.processing.set(true);
    try {
      await this.menuService.deleteItem(id);
      this.showFeedback('Elemento borrado.', 'success');
    } catch(e) {
      this.showFeedback('Error al borrar.', 'error');
    } finally {
      this.processing.set(false);
    }
  }
}

