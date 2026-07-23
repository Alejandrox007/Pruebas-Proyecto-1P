import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="list-section">
      <h2>Resumen operativo</h2>
      <div class="items-grid">
        <article class="item-card" *ngFor="let item of cards">
          <span class="status-label">{{ item.label }}</span>
          <div class="metric">{{ summary[item.key] || 0 }}</div>
        </article>
      </div>
    </section>
  `,
  styles: ['.metric{font-size:2.4rem;font-weight:700;color:var(--accent)}']
})
export class DashboardComponent implements OnInit {
  summary: Record<string, number> = {};
  readonly cards = [
    { key: 'users', label: 'Usuarios activos' },
    { key: 'doctors', label: 'Médicos' },
    { key: 'patients', label: 'Pacientes' },
    { key: 'appointments', label: 'Citas' },
    { key: 'pending', label: 'Citas pendientes' },
    { key: 'prescriptions', label: 'Recetas' }
  ];

  constructor(private readonly api: ApiService) {}
  ngOnInit(): void { this.api.getAdminSummary().subscribe((summary) => this.summary = summary); }
}
