import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AppointmentsComponent } from './appointments.component';

describe('AppointmentsComponent', () => {
  function setup(role: string) {
    const appointment = {
      id: 1, doctorId: 1, scheduledAt: '2030-01-02T15:00:00.000Z',
      reason: 'Control médico', status: 'pending'
    };
    const api: any = {
      getAppointments: vi.fn().mockReturnValue(of([appointment])),
      getDoctors: vi.fn().mockReturnValue(of([{ id: 1, active: true }, { id: 2, active: false }])),
      getPatients: vi.fn().mockReturnValue(of([{ id: 1 }])),
      createAppointment: vi.fn().mockReturnValue(of(appointment)),
      updateAppointment: vi.fn().mockReturnValue(of(appointment))
    };
    const toast: any = { showToast: vi.fn() };
    const component = new AppointmentsComponent(api, { user: { role } } as any, new FormBuilder(), toast);
    return { api, toast, component, appointment };
  }

  it('loads role-specific data for clients, admins and doctors', () => {
    const client = setup('client');
    client.component.ngOnInit();
    expect(client.component.doctors).toHaveLength(1);
    const admin = setup('admin');
    admin.component.ngOnInit();
    expect(admin.component.patients).toHaveLength(1);
    const doctor = setup('doctor');
    doctor.component.ngOnInit();
    expect(doctor.api.getDoctors).not.toHaveBeenCalled();
  });

  it('validates, creates and updates appointments', () => {
    const { component, api, appointment } = setup('client');
    component.create();
    component.form.setValue({
      doctorId: 1, patientId: null, scheduledAt: '2030-01-02T10:00', reason: 'Control médico'
    });
    component.create();
    expect(api.createAppointment).toHaveBeenCalled();
    component.changeStatus(appointment as any, 'cancelled');
    expect(api.updateAppointment).toHaveBeenCalled();

    const admin = setup('admin');
    admin.component.form.setValue({
      doctorId: 1, patientId: 2, scheduledAt: '2030-01-02T10:00', reason: 'Control médico'
    });
    admin.component.create();
    expect(admin.api.createAppointment).toHaveBeenCalledWith(expect.objectContaining({ patientId: 2 }));
  });

  it('handles loading, creation and update errors', () => {
    const { component, api, toast, appointment } = setup('client');
    api.getAppointments.mockReturnValue(throwError(() => new Error()));
    component.load();
    component.form.setValue({
      doctorId: 1, patientId: null, scheduledAt: '2030-01-02T10:00', reason: 'Control médico'
    });
    api.createAppointment.mockReturnValue(throwError(() => ({ error: { message: 'Busy' } })));
    component.create();
    api.updateAppointment.mockReturnValue(throwError(() => ({})));
    component.changeStatus(appointment as any, 'cancelled');
    expect(toast.showToast).toHaveBeenCalled();
  });
});
