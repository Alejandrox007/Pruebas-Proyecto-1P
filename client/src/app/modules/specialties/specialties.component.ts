import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Specialty } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-specialties',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './specialties.component.html',
  styleUrls: ['./specialties.component.scss']
})
export class SpecialtiesComponent implements OnInit {
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
    this.loadSpecialties();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  loadSpecialties(): void {
    this.loading = true;
    this.apiService.getSpecialties().subscribe({
      next: (specialties) => {
        this.specialties = specialties;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showToast('Error al cargar especialidades', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.toastService.showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const specialty = this.form.value;

    if (this.editingId) {
      this.apiService.updateSpecialty(this.editingId, specialty).subscribe({
        next: () => {
          this.toastService.showToast('Especialidad actualizada exitosamente', 'success');
          this.clearForm();
          this.loadSpecialties();
        },
        error: (error) => {
          this.toastService.showToast('Error al actualizar especialidad', 'error');
        }
      });
    } else {
      this.apiService.createSpecialty(specialty).subscribe({
        next: () => {
          this.toastService.showToast('Especialidad creada exitosamente', 'success');
          this.clearForm();
          this.loadSpecialties();
        },
        error: (error) => {
          this.toastService.showToast('Error al crear especialidad', 'error');
        }
      });
    }
  }

  editSpecialty(specialty: Specialty): void {
    this.editingId = specialty.id || null;
    this.form.patchValue({
      name: specialty.name,
      description: specialty.description
    });
  }

  deleteSpecialty(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar esta especialidad?')) return;

    this.apiService.deleteSpecialty(id).subscribe({
      next: () => {
        this.toastService.showToast('Especialidad eliminada exitosamente', 'success');
        this.loadSpecialties();
      },
      error: (error) => {
        this.toastService.showToast('Error al eliminar especialidad', 'error');
      }
    });
  }

  clearForm(): void {
    this.form.reset();
    this.editingId = null;
  }
}
