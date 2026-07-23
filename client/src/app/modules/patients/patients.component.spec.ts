import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PatientsComponent } from './patients.component';
import { ApiService, Patient } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { FormBuilder } from '@angular/forms';

describe('PatientsComponent', () => {
  const patient: Patient = {
    id: 1, name: 'Ana', lastName: 'Pérez', email: 'ana@test.com',
    gender: 'Femenino', illness: 'Gripe', phone: '+593999999999'
  };
  let api: any;
  let toast: any;
  let component: PatientsComponent;

  beforeEach(() => {
    api = {
      getPatients: vi.fn().mockReturnValue(of([patient])),
      updatePatient: vi.fn().mockReturnValue(of(patient)),
      deletePatient: vi.fn().mockReturnValue(of(patient))
    };
    toast = { showToast: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: { user: { role: 'admin' } } }
      ]
    });
    component = new PatientsComponent(api, toast, new FormBuilder(), { user: { role: 'admin' } } as AuthService);
  });

  it('loads, edits, updates, clears and deletes a patient', () => {
    component.ngOnInit();
    expect(component.patients).toEqual([patient]);
    component.form.setValue({
      name: 'Ana', lastName: 'Pérez', phone: '+593999999999',
      gender: 'Femenino', illness: 'Gripe'
    });
    component.onSubmit();
    component.editPatient(patient);
    component.onSubmit();
    expect(api.updatePatient).toHaveBeenCalled();
    component.editPatient(patient);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deletePatient(1);
    expect(api.deletePatient).toHaveBeenCalledWith(1);
    component.clearForm();
    expect(component.editingId).toBeNull();
    expect(component.form.value.gender).toBe('Masculino');
  });

  it('handles validation, cancellation and API errors', () => {
    component.onSubmit();
    expect(toast.showToast).toHaveBeenCalled();
    component.deletePatient(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deletePatient(1);
    expect(api.deletePatient).not.toHaveBeenCalled();

    api.getPatients.mockReturnValue(throwError(() => new Error()));
    component.loadPatients();
    api.updatePatient.mockReturnValue(throwError(() => new Error()));
    component.editPatient(patient);
    component.onSubmit();
    api.deletePatient.mockReturnValue(throwError(() => new Error()));
    vi.mocked(window.confirm).mockReturnValue(true);
    component.deletePatient(1);
    expect(toast.showToast).toHaveBeenCalled();
  });
});
