import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService, MenuItem } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public menuSvc = inject(MenuService);
  activeCategory = 'Métodos de Extracción';

  async ngOnInit() {
    await this.menuSvc.loadMenu();
    if (this.menuSvc.categories().length > 0) {
      this.activeCategory = this.menuSvc.categories()[0];
    }
  }

  get filteredItems(): MenuItem[] {
    return this.menuSvc.items().filter(i => i.category === this.activeCategory);
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
  }
}
