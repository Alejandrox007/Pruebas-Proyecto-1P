import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DoctorsComponent } from './doctors.component';
import { Doctor } from '../../services/api.service';

describe('DoctorsComponent', () => {
  const doctor: Doctor = {
    id: 1, name: 'Juan', lastName: 'Pérez', specialtyId: 1, specialty: 'Cardiología',
    phone: '+593999999999', email: 'doctor@test.com', licenseNumber: 'MED-1'
  };
  let api: any;
  let toast: any;
  let component: DoctorsComponent;

  beforeEach(() => {
    api = {
      getDoctors: vi.fn().mockReturnValue(of([doctor])),
      getSpecialties: vi.fn().mockReturnValue(of([{ id: 1, name: 'Cardiología' }])),
      createDoctor: vi.fn().mockReturnValue(of(doctor)),
      updateDoctor: vi.fn().mockReturnValue(of(doctor)),
      deleteDoctor: vi.fn().mockReturnValue(of(doctor))
    };
    toast = { showToast: vi.fn() };
    component = new DoctorsComponent(api, toast, new FormBuilder());
  });

  function validForm(): void {
    component.form.setValue({
      name: 'Juan', lastName: 'Pérez', specialtyId: 1, phone: '+593999999999',
      email: 'doctor@test.com', licenseNumber: 'MED-1', initialPassword: 'SecurePass1!'
    });
  }

  it('loads, creates, edits, updates, clears and deletes doctors', () => {
    component.ngOnInit();
    expect(component.doctors).toEqual([doctor]);
    validForm();
    component.onSubmit();
    expect(api.createDoctor).toHaveBeenCalled();
    component.editDoctor(doctor);
    component.form.patchValue({ phone: '+593988888888' });
    component.onSubmit();
    expect(api.updateDoctor).toHaveBeenCalled();
    component.editDoctor(doctor);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteDoctor(1);
    expect(api.deleteDoctor).toHaveBeenCalled();
    component.clearForm();
    expect(component.editingId).toBeNull();
  });

  it('handles invalid forms, missing passwords, cancellation and errors', () => {
    component.onSubmit();
    validForm();
    component.form.patchValue({ initialPassword: '' });
    component.onSubmit();
    component.deleteDoctor(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteDoctor(1);

    api.getDoctors.mockReturnValue(throwError(() => new Error()));
    component.loadDoctors();
    api.createDoctor.mockReturnValue(throwError(() => new Error()));
    validForm();
    component.onSubmit();
    api.updateDoctor.mockReturnValue(throwError(() => new Error()));
    component.editDoctor(doctor);
    component.onSubmit();
    api.deleteDoctor.mockReturnValue(throwError(() => new Error()));
    vi.mocked(window.confirm).mockReturnValue(true);
    component.deleteDoctor(1);
    expect(toast.showToast).toHaveBeenCalled();
  });
});
