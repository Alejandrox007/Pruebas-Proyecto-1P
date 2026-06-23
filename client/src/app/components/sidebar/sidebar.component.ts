import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() tabSelected = new EventEmitter<string>();
  
  serverStatus$ = this.apiService.serverStatus$;
  activeTab = 'doctors';

  constructor(private apiService: ApiService) {}

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.tabSelected.emit(tab);
  }
}
