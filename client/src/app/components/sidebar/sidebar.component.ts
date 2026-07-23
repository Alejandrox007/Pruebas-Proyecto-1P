import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() readonly tabSelected = new EventEmitter<string>();
  readonly serverStatus$ = this.api.serverStatus$;
  readonly user = this.auth.user!;
  activeTab = this.user.role === 'admin' ? 'dashboard' : 'appointments';

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {}

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.tabSelected.emit(tab);
  }

  logout(): void {
    this.auth.logout();
  }
}
