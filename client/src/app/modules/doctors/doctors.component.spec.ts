import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DoctorsComponent } from './doctors.component';
import { ApiService, Doctor } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('DoctorsComponent', () => {
  let component: DoctorsComponent;
  let fixture: ComponentFixture<DoctorsComponent>;
  let mockApiService: any;
  let mockToastService: any;

  const dummyDoctors: Doctor[] = [
    { id: 1, name: 'John', lastName: 'Doe', specialty: 'Cardiology', phone: '123', email: 'j@d.com', licenseNumber: 'LC123' },
    { id: 2, name: 'Jane', lastName: 'Smith', specialty: 'Pediatrics', phone: '456', email: 'j@s.com', licenseNumber: 'LC456' }
  ];

  beforeEach(async () => {
    mockApiService = {
      getDoctors: vi.fn().mockReturnValue(of(dummyDoctors)),
      createDoctor: vi.fn().mockReturnValue(of(dummyDoctors[0])),
      updateDoctor: vi.fn().mockReturnValue(of(dummyDoctors[0])),
      deleteDoctor: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockToastService = {
      showToast: vi.fn()
    };

    vi.spyOn(window, 'scrollTo').mockImplementation(() => { });

    await TestBed.configureTestingModule({
      imports: [DoctorsComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctors on init', () => {
    expect(mockApiService.getDoctors).toHaveBeenCalled();
    expect(component.doctors).toEqual(dummyDoctors);
    expect(component.loading).toBe(false);
  });

  it('should handle loadDoctors error', () => {
    mockApiService.getDoctors.mockReturnValue(throwError(() => new Error('Error')));
    component.loadDoctors();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al cargar doctores', 'error');
    expect(component.loading).toBe(false);
  });

  it('should form be invalid when empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('should validate email field', () => {
    const emailCtrl = component.form.get('email');
    emailCtrl?.setValue('invalid-email');
    expect(emailCtrl?.valid).toBe(false);
    expect(emailCtrl?.hasError('email')).toBe(true);

    emailCtrl?.setValue('test@example.com');
    expect(emailCtrl?.valid).toBe(true);
  });

  it('should show error toast if form is invalid on submit', () => {
    component.onSubmit();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Por favor completa todos los campos', 'error');
    expect(mockApiService.createDoctor).not.toHaveBeenCalled();
  });

  it('should submit form for new doctor successfully', () => {
    component.form.patchValue({
      name: 'New',
      lastName: 'Doc',
      specialty: 'General',
      phone: '999',
      email: 'new@doc.com',
      licenseNumber: 'LC999'
    });

    component.onSubmit();

    expect(mockApiService.createDoctor).toHaveBeenCalledWith({
      name: 'New',
      lastName: 'Doc',
      specialty: 'General',
      phone: '999',
      email: 'new@doc.com',
      licenseNumber: 'LC999'
    });
    expect(mockToastService.showToast).toHaveBeenCalledWith('Doctor creado exitosamente', 'success');
  });

  it('should handle error when creating doctor', () => {
    component.form.patchValue({
      name: 'New',
      lastName: 'Doc',
      specialty: 'General',
      phone: '999',
      email: 'new@doc.com',
      licenseNumber: 'LC999'
    });
    mockApiService.createDoctor.mockReturnValue(throwError(() => new Error('Error')));

    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al crear doctor', 'error');
  });

  it('should submit form for edit doctor successfully', () => {
    const existingDoctor = dummyDoctors[0];
    component.editDoctor(existingDoctor);

    expect(component.editingId).toBe(1);
    expect(window.scrollTo).toHaveBeenCalled();

    component.form.patchValue({ name: 'John Updated' });

    component.onSubmit();

    expect(mockApiService.updateDoctor).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'John Updated' }));
    expect(mockToastService.showToast).toHaveBeenCalledWith('Doctor actualizado exitosamente', 'success');
  });

  it('should handle error when updating doctor', () => {
    const existingDoctor = dummyDoctors[0];
    component.editDoctor(existingDoctor);
    mockApiService.updateDoctor.mockReturnValue(throwError(() => new Error('Error')));

    component.form.patchValue({ name: 'John Updated' });
    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al actualizar doctor', 'error');
  });

  it('should delete doctor after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteDoctor(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteDoctor).toHaveBeenCalledWith(1);
    expect(mockToastService.showToast).toHaveBeenCalledWith('Doctor eliminado exitosamente', 'success');
  });

  it('should handle error when deleting doctor', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApiService.deleteDoctor.mockReturnValue(throwError(() => new Error('Error')));

    component.deleteDoctor(1);

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al eliminar doctor', 'error');
  });

  it('should not delete doctor if confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteDoctor(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteDoctor).not.toHaveBeenCalled();
  });

  it('should clear form', () => {
    component.form.patchValue({ name: 'Some Name' });
    component.editingId = 123;

    component.clearForm();

    expect(component.editingId).toBeNull();
    expect(component.form.get('name')?.value).toBeNull();
  });
});
