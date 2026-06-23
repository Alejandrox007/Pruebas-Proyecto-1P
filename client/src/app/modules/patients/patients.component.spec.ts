import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PatientsComponent } from './patients.component';
import { ApiService, Patient } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('PatientsComponent', () => {
  let component: PatientsComponent;
  let fixture: ComponentFixture<PatientsComponent>;
  let mockApiService: any;
  let mockToastService: any;

  const dummyPatients: Patient[] = [
    { id: 1, name: 'Alice', lastName: 'Wonder', email: 'alice@w.com', gender: 'F', illness: 'Flu' },
    { id: 2, name: 'Bob', lastName: 'Builder', email: 'bob@b.com', gender: 'M', illness: 'Cold' }
  ];

  beforeEach(async () => {
    mockApiService = {
      getPatients: vi.fn().mockReturnValue(of(dummyPatients)),
      createPatient: vi.fn().mockReturnValue(of(dummyPatients[0])),
      updatePatient: vi.fn().mockReturnValue(of(dummyPatients[0])),
      deletePatient: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockToastService = {
      showToast: vi.fn()
    };

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [PatientsComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load patients on init', () => {
    expect(mockApiService.getPatients).toHaveBeenCalled();
    expect(component.patients).toEqual(dummyPatients);
    expect(component.loading).toBe(false);
  });

  it('should handle loadPatients error', () => {
    mockApiService.getPatients.mockReturnValue(throwError(() => new Error('Error')));
    component.loadPatients();
    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al cargar pacientes', 'error');
    expect(component.loading).toBe(false);
  });

  it('should form be invalid when empty, except for gender which defaults to M', () => {
    expect(component.form.valid).toBe(false);
    expect(component.form.get('gender')?.value).toBe('M');
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
    expect(mockApiService.createPatient).not.toHaveBeenCalled();
  });

  it('should submit form for new patient successfully', () => {
    component.form.patchValue({
      name: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@b.com',
      gender: 'M',
      illness: 'Allergy'
    });

    component.onSubmit();

    expect(mockApiService.createPatient).toHaveBeenCalledWith({
      name: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@b.com',
      gender: 'M',
      illness: 'Allergy'
    });
    expect(mockToastService.showToast).toHaveBeenCalledWith('Paciente creado exitosamente', 'success');
  });

  it('should handle error when creating patient', () => {
    component.form.patchValue({
      name: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@b.com',
      gender: 'M',
      illness: 'Allergy'
    });
    mockApiService.createPatient.mockReturnValue(throwError(() => new Error('Error')));

    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al crear paciente', 'error');
  });

  it('should submit form for edit patient successfully', () => {
    const existingPatient = dummyPatients[0];
    component.editPatient(existingPatient);

    expect(component.editingId).toBe(1);
    expect(window.scrollTo).toHaveBeenCalled();

    component.form.patchValue({ name: 'Alice Updated' });

    component.onSubmit();

    expect(mockApiService.updatePatient).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Alice Updated' }));
    expect(mockToastService.showToast).toHaveBeenCalledWith('Paciente actualizado exitosamente', 'success');
  });

  it('should handle error when updating patient', () => {
    const existingPatient = dummyPatients[0];
    component.editPatient(existingPatient);
    mockApiService.updatePatient.mockReturnValue(throwError(() => new Error('Error')));

    component.form.patchValue({ name: 'Alice Updated' });
    component.onSubmit();

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al actualizar paciente', 'error');
  });

  it('should delete patient after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deletePatient(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deletePatient).toHaveBeenCalledWith(1);
    expect(mockToastService.showToast).toHaveBeenCalledWith('Paciente eliminado exitosamente', 'success');
  });

  it('should handle error when deleting patient', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApiService.deletePatient.mockReturnValue(throwError(() => new Error('Error')));

    component.deletePatient(1);

    expect(mockToastService.showToast).toHaveBeenCalledWith('Error al eliminar paciente', 'error');
  });

  it('should not delete patient if confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deletePatient(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiService.deletePatient).not.toHaveBeenCalled();
  });

  it('should clear form and reset gender to M', () => {
    component.form.patchValue({ name: 'Some Patient', gender: 'F' });
    component.editingId = 123;

    component.clearForm();

    expect(component.editingId).toBeNull();
    expect(component.form.get('gender')?.value).toBe('M');
  });
});
