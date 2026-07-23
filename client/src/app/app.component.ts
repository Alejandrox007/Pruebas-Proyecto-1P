import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthComponent } from './modules/auth/auth.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { DoctorsComponent } from './modules/doctors/doctors.component';
import { PatientsComponent } from './modules/patients/patients.component';
import { MedicinesComponent } from './modules/medicines/medicines.component';
import { SpecialtiesComponent } from './modules/specialties/specialties.component';
import { AppointmentsComponent } from './modules/appointments/appointments.component';
import { PrescriptionsComponent } from './modules/prescriptions/prescriptions.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, AuthComponent, SidebarComponent, DashboardComponent, DoctorsComponent,
    PatientsComponent, MedicinesComponent, SpecialtiesComponent, AppointmentsComponent,
    PrescriptionsComponent, ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly user$ = this.auth.user$;
  activeTab = this.auth.user?.role === 'admin' ? 'dashboard' : 'appointments';

  constructor(private readonly auth: AuthService) {
    this.auth.user$.subscribe((user) => {
      if (user) this.activeTab = user.role === 'admin' ? 'dashboard' : 'appointments';
    });
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }
}
