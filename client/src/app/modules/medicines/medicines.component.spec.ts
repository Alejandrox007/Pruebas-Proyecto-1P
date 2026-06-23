import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MedicinesComponent } from './medicines.component';
import { ApiService, Medicine } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MedicinesComponent', () => {
  let component: MedicinesComponent;
  let fixture: ComponentFixture<MedicinesComponent>;
  let mockApiService: any;
  let mockToastService: any;

  const dummyMedicines: Medicine[] = [
    { id: 1, name: 'Paracetamol', description: 'Pain relief' },
    { id: 2, name: 'Ibuprofen', description: 'Anti-inflammatory' }
  ];

  beforeEach(async () => {
    mockApiService = {
      getMedicines: vi.fn().mockReturnValue(of(dummyMedicines)),
      createMedicine: vi.fn().mockReturnValue(of(dummyMedicines[0])),
      updateMedicine: vi.fn().mockReturnValue(of(dummyMedicines[0])),
      deleteMedicine: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockToastService = {
      showToast: vi.fn()
    };

    vi.spyOn(window, 'scrollTo').mockImplementation(() => { });

    await TestBed.configureTestingModule({
      imports: [MedicinesComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load medicines on init', () => {
    expect(mockApiService.getMedicines).toHaveBeenCalled();
    expect(component.medicines).toEqual(dummyMedicines);
    expect(component.loading).toBe(false);
  });

  it('should handle loadMedicines error', () => {
    mockApiService.getMedicines.mockReturnValue(throwError(() => new Error('Error')));
    component.loadMedicines();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al cargar medicamentos', 'error');
    expect(component.loading).toBe(false);
  });

  it('should form be invalid when empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('should show error toast if form is invalid on submit', () => {
    component.onSubmit();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Por favor completa todos los campos', 'error');
    expect(mockApiService.createMedicine).not.toHaveBeenCalled();
  });

  it('should submit form for new medicine successfully', () => {
    component.form.patchValue({
      name: 'Aspirin',
      description: 'Blood thinner'
    });

    component.onSubmit();

    expect(mockApiService.createMedicine).toHaveBeenCalledWith({
      name: 'Aspirin',
      description: 'Blood thinner'
    });
    expect(mockToastService.showToast).toHaveBeenCalledWith('Medicamento creado exitosamente', 'success');
  });

  it('should handle error when creating medicine', () => {
    component.form.patchValue({
      name: 'Aspirin',
      description: 'Blood thinner'
    });
    mockApiService.createMedicine.mockReturnValue(throwError(() => new Error('Error')));

    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al crear medicamento', 'error');
  });

  it('should submit form for edit medicine successfully', () => {
    const existingMedicine = dummyMedicines[0];
    component.editMedicine(existingMedicine);

    expect(component.editingId).toBe(1);
    expect(window.scrollTo).toHaveBeenCalled();

    component.form.patchValue({ name: 'Paracetamol Updated' });

    component.onSubmit();

    expect(mockApiService.updateMedicine).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Paracetamol Updated' }));
    expect(mockToastService.showToast).toHaveBeenCalledWith('Medicamento actualizado exitosamente', 'success');
  });

  it('should handle error when updating medicine', () => {
    const existingMedicine = dummyMedicines[0];
    component.editMedicine(existingMedicine);
    mockApiService.updateMedicine.mockReturnValue(throwError(() => new Error('Error')));

    component.form.patchValue({ name: 'Paracetamol Updated' });
    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al actualizar medicamento', 'error');
  });

  it('should delete medicine after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteMedicine(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteMedicine).toHaveBeenCalledWith(1);
    expect(mockToastService.showToast).toHaveBeenCalledWith('Medicamento eliminado exitosamente', 'success');
  });

  it('should handle error when deleting medicine', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApiService.deleteMedicine.mockReturnValue(throwError(() => new Error('Error')));

    component.deleteMedicine(1);

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al eliminar medicamento', 'error');
  });

  it('should not delete medicine if confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteMedicine(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteMedicine).not.toHaveBeenCalled();
  });

  it('should clear form', () => {
    component.form.patchValue({ name: 'Some Medicine' });
    component.editingId = 123;

    component.clearForm();

    expect(component.editingId).toBeNull();
    expect(component.form.get('name')?.value).toBeNull();
  });
});
