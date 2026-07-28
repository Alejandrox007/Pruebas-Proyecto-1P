import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { PrescriptionsComponent } from './prescriptions.component';

describe('PrescriptionsComponent', () => {
  function setup(role = 'doctor') {
    const prescription = {
      id: 1, appointmentId: 1, diagnosis: 'Gripe', instructions: 'Reposo',
      medications: [{ medicineId: 1, dosage: '1', frequency: '8h', duration: '3d' }]
    };
    const api: any = {
      getPrescriptions: vi.fn().mockReturnValue(of([prescription])),
      getAppointments: vi.fn().mockReturnValue(of([
        { id: 1, status: 'completed' }, { id: 2, status: 'pending' }
      ])),
      getMedicines: vi.fn().mockReturnValue(of([{ id: 1, name: 'Paracetamol' }])),
      createPrescription: vi.fn().mockReturnValue(of(prescription))
    };
    const toast: any = { showToast: vi.fn() };
    return {
      api, toast,
      component: new PrescriptionsComponent(api, { user: { role } } as any, new FormBuilder(), toast)
    };
  }

  it('loads doctor resources and read-only client data', () => {
    const doctor = setup();
    doctor.component.ngOnInit();
    expect(doctor.component.appointments).toHaveLength(1);
    expect(doctor.component.medicines).toHaveLength(1);
    const client = setup('client');
    client.component.ngOnInit();
    expect(client.api.getAppointments).not.toHaveBeenCalled();
  });

  it('validates and creates a prescription', () => {
    const { component, api } = setup();
    component.create();
    component.form.setValue({
      appointmentId: 1, diagnosis: 'Gripe', instructions: 'Reposo',
      medicineId: 1, dosage: '500mg', frequency: '8h', duration: '3 días'
    });
    component.create();
    expect(api.createPrescription).toHaveBeenCalled();
  });

  it('handles list and creation errors', () => {
    const { component, api, toast } = setup();
    api.getPrescriptions.mockReturnValue(throwError(() => new Error()));
    component.load();
    component.form.setValue({
      appointmentId: 1, diagnosis: 'Gripe', instructions: 'Reposo',
      medicineId: 1, dosage: '500mg', frequency: '8h', duration: '3 días'
    });
    api.createPrescription.mockReturnValue(throwError(() => ({ error: { message: 'Duplicate' } })));
    component.create();
    expect(toast.showToast).toHaveBeenCalled();
  });

  it('covers translateError and fallback scenarios', () => {
    const { component, api, toast } = setup();

    expect(component.translateError('')).toBe('');
    expect(component.translateError('Appointment not found')).toBe('Cita no encontrada.');
    expect(component.translateError('Random error')).toBe('Random error');

    component.form.setValue({
      appointmentId: 1, diagnosis: 'Gripe', instructions: 'Reposo',
      medicineId: 1, dosage: '500 mg', frequency: 'Cada 8 horas', duration: '3 días'
    });
    api.createPrescription.mockReturnValue(throwError(() => ({ error: {} })));
    component.create();
    expect(toast.showToast).toHaveBeenCalledWith('No se pudo registrar', 'error');
  });
});
