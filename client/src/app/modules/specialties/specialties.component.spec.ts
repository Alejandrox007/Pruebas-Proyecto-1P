import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpecialtiesComponent } from './specialties.component';
import { ApiService, Specialty } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('SpecialtiesComponent', () => {
  let component: SpecialtiesComponent;
  let fixture: ComponentFixture<SpecialtiesComponent>;
  let mockApiService: any;
  let mockToastService: any;

  const dummySpecialties: Specialty[] = [
    { id: 1, name: 'Cardiology', description: 'Heart health' },
    { id: 2, name: 'Pediatrics', description: 'Children healthcare' }
  ];

  beforeEach(async () => {
    mockApiService = {
      getSpecialties: vi.fn().mockReturnValue(of(dummySpecialties)),
      createSpecialty: vi.fn().mockReturnValue(of(dummySpecialties[0])),
      updateSpecialty: vi.fn().mockReturnValue(of(dummySpecialties[0])),
      deleteSpecialty: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockToastService = {
      showToast: vi.fn()
    };

    vi.spyOn(window, 'scrollTo').mockImplementation(() => { });

    await TestBed.configureTestingModule({
      imports: [SpecialtiesComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialtiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load specialties on init', () => {
    expect(mockApiService.getSpecialties).toHaveBeenCalled();
    expect(component.specialties).toEqual(dummySpecialties);
    expect(component.loading).toBe(false);
  });

  it('should handle loadSpecialties error', () => {
    mockApiService.getSpecialties.mockReturnValue(throwError(() => new Error('Error')));
    component.loadSpecialties();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al cargar especialidades', 'error');
    expect(component.loading).toBe(false);
  });

  it('should form be invalid when empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('should show error toast if form is invalid on submit', () => {
    component.onSubmit();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Por favor completa todos los campos', 'error');
    expect(mockApiService.createSpecialty).not.toHaveBeenCalled();
  });

  it('should submit form for new specialty successfully', () => {
    component.form.patchValue({
      name: 'Dermatology',
      description: 'Skin healthcare'
    });

    component.onSubmit();

    expect(mockApiService.createSpecialty).toHaveBeenCalledWith({
      name: 'Dermatology',
      description: 'Skin healthcare'
    });
    expect(mockToastService.showToast).toHaveBeenCalledWith('Especialidad creada exitosamente', 'success');
  });

  it('should handle error when creating specialty', () => {
    component.form.patchValue({
      name: 'Dermatology',
      description: 'Skin healthcare'
    });
    mockApiService.createSpecialty.mockReturnValue(throwError(() => new Error('Error')));

    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al crear especialidad', 'error');
  });

  it('should submit form for edit specialty successfully', () => {
    const existingSpecialty = dummySpecialties[0];
    component.editSpecialty(existingSpecialty);

    expect(component.editingId).toBe(1);
    expect(window.scrollTo).toHaveBeenCalled();

    component.form.patchValue({ name: 'Cardiology Updated' });

    component.onSubmit();

    expect(mockApiService.updateSpecialty).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Cardiology Updated' }));
    expect(mockToastService.showToast).toHaveBeenCalledWith('Especialidad actualizada exitosamente', 'success');
  });

  it('should handle error when updating specialty', () => {
    const existingSpecialty = dummySpecialties[0];
    component.editSpecialty(existingSpecialty);
    mockApiService.updateSpecialty.mockReturnValue(throwError(() => new Error('Error')));

    component.form.patchValue({ name: 'Cardiology Updated' });
    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al actualizar especialidad', 'error');
  });

  it('should delete specialty after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteSpecialty(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteSpecialty).toHaveBeenCalledWith(1);
    expect(mockToastService.showToast).toHaveBeenCalledWith('Especialidad eliminada exitosamente', 'success');
  });

  it('should handle error when deleting specialty', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApiService.deleteSpecialty.mockReturnValue(throwError(() => new Error('Error')));

    component.deleteSpecialty(1);

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al eliminar especialidad', 'error');
  });

  it('should not delete specialty if confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteSpecialty(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deleteSpecialty).not.toHaveBeenCalled();
  });

  it('should clear form', () => {
    component.form.patchValue({ name: 'Some Specialty' });
    component.editingId = 123;

    component.clearForm();

    expect(component.editingId).toBeNull();
    expect(component.form.get('name')?.value).toBeNull();
  });
});
