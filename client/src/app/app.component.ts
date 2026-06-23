import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DoctorsComponent } from './modules/doctors/doctors.component';
import { PatientsComponent } from './modules/patients/patients.component';
import { MedicinesComponent } from './modules/medicines/medicines.component';
import { SpecialtiesComponent } from './modules/specialties/specialties.component';
import { ToastComponent } from './components/toast/toast.component';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    DoctorsComponent,
    PatientsComponent,
    MedicinesComponent,
    SpecialtiesComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeTab = 'doctors';

  constructor(private apiService: ApiService) {}

  selectTab(tab: string): void {
    this.activeTab = tab;
  }
}
