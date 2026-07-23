import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Doctor, Specialty } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  specialties: Specialty[] = [];
  form!: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.apiService.getSpecialties().subscribe((items) => this.specialties = items);
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]+$/)]],
      specialtyId: [null, Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      licenseNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      initialPassword: ['', [
        Validators.minLength(10),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
      ]]
    });
  }

  loadDoctors(): void {
    this.loading = true;
    this.apiService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showToast('Error al cargar doctores', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.toastService.showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const doctor = { ...this.form.value };

    if (this.editingId) {
      delete doctor.initialPassword;
      this.apiService.updateDoctor(this.editingId, doctor).subscribe({
        next: () => {
          this.toastService.showToast('Doctor actualizado exitosamente', 'success');
          this.clearForm();
          this.loadDoctors();
        },
        error: (error) => {
          this.toastService.showToast('Error al actualizar doctor', 'error');
        }
      });
    } else {
      if (!doctor.initialPassword) {
        this.toastService.showToast('La contraseña inicial es obligatoria', 'error');
        return;
      }
      this.apiService.createDoctor(doctor).subscribe({
        next: () => {
          this.toastService.showToast('Doctor creado exitosamente', 'success');
          this.clearForm();
          this.loadDoctors();
        },
        error: (error) => {
          this.toastService.showToast('Error al crear doctor', 'error');
        }
      });
    }
  }

  editDoctor(doctor: Doctor): void {
    this.editingId = doctor.id || null;
    this.form.patchValue({
      name: doctor.name,
      lastName: doctor.lastName,
      specialtyId: doctor.specialtyId,
      phone: doctor.phone,
      email: doctor.email,
      licenseNumber: doctor.licenseNumber,
      initialPassword: ''
    });
  }

  deleteDoctor(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar este doctor?')) return;

    this.apiService.deleteDoctor(id).subscribe({
      next: () => {
        this.toastService.showToast('Doctor eliminado exitosamente', 'success');
        this.loadDoctors();
      },
      error: (error) => {
        this.toastService.showToast('Error al eliminar doctor', 'error');
      }
    });
  }

  clearForm(): void {
    this.form.reset();
    this.editingId = null;
  }
}
