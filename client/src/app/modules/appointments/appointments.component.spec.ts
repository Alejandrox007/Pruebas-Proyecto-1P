import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
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

  it('covers state synchronization and helper properties', () => {
    const { component } = setup('client');
    component.ngOnInit();

    component.form.patchValue({ scheduledAt: '2030-01-02T10:30' });
    expect(component.selectedDate).toBe('2030-01-02');
    expect(component.selectedTime).toBe('10:30');

    component.form.patchValue({ scheduledAt: 'invalid' });
    expect(component.selectedDate).toBe('');
    expect(component.selectedTime).toBe('');

    component.form.patchValue({ scheduledAt: '' });
    expect(component.selectedDate).toBe('');
    expect(component.selectedTime).toBe('');
  });

  it('covers onDateChange weekend check', () => {
    const { component, toast } = setup('client');
    component.ngOnInit();
    const input = { value: '2026-08-01' } as any; // Saturday
    component.onDateChange({ target: input } as any);
    expect(toast.showToast).toHaveBeenCalledWith('Las citas solo se pueden agendar de lunes a viernes', 'error');
    expect(input.value).toBe('');
  });

  it('covers onDateChange today last hour check', () => {
    const { component, toast } = setup('client');
    component.ngOnInit();

    // Set system time to 16:00 (4:00 PM) so all slots are past or < 2 hours ahead
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T16:00:00'));

    const todayStr = '2026-07-28';
    const input = { value: todayStr } as any;
    component.onDateChange({ target: input } as any);
    expect(toast.showToast).toHaveBeenCalledWith('Ya ha pasado la última hora de citas disponible para el día de hoy', 'error');
    expect(input.value).toBe('');

    vi.useRealTimers();
  });

  it('covers onDateChange time slot validity check', () => {
    const { component, toast } = setup('client');
    component.ngOnInit();

    component.selectedDateVal = '2030-01-02';
    component.selectedTimeVal = '10:00';

    const input = { value: '2030-01-03' } as any;
    component.onDateChange({ target: input } as any);
    expect(component.selectedDateVal).toBe('2030-01-03');

    // Set system time to 10:00 AM on July 28
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T10:00:00'));

    const todayStr = '2026-07-28';
    component.selectedTimeVal = '08:00'; // 8:00 AM is past 10:00 AM
    const inputToday = { value: todayStr } as any;

    component.onDateChange({ target: inputToday } as any);
    expect(toast.showToast).toHaveBeenCalledWith('La hora seleccionada ya no está disponible para hoy', 'error');
    expect(component.selectedTimeVal).toBe('');

    vi.useRealTimers();
  });

  it('covers onTimeChange validation', () => {
    const { component, toast } = setup('client');
    component.ngOnInit();

    component.selectedDateVal = '2030-01-02';
    const selectValid = { value: '10:00' } as any;
    component.onTimeChange({ target: selectValid } as any);
    expect(component.selectedTimeVal).toBe('10:00');

    // Set system time to 10:00 AM on July 28
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T10:00:00'));

    const todayStr = '2026-07-28';
    component.selectedDateVal = todayStr;
    const selectInvalid = { value: '11:00' } as any; // 11:00 AM is only 1 hour ahead (< 2 hours)
    component.onTimeChange({ target: selectInvalid } as any);
    expect(toast.showToast).toHaveBeenCalledWith('La cita debe ser programada con al menos dos horas de anticipación', 'error');
    expect(selectInvalid.value).toBe('');
    expect(component.selectedTimeVal).toBe('');

    vi.useRealTimers();
  });

  it('covers onReasonInput sanitization', () => {
    const { component } = setup('client');
    const textarea = { value: 'Control médico con @símbolos #123!' } as any;
    component.onReasonInput({ target: textarea } as any);
    expect(textarea.value).toBe('Control médico con símbolos 123!');
    expect(component.form.value.reason).toBe('Control médico con símbolos 123!');
  });

  it('covers translateError function mapping and fallback', () => {
    const { component } = setup('client');
    expect(component.translateError('')).toBe('');
    expect(component.translateError('Unknown error')).toBe('Unknown error');
    expect(component.translateError('Appointments must be scheduled at least two hours ahead')).toBe('Las citas deben ser programadas con al menos dos horas de anticipación.');
    expect(component.translateError('A record with those values already exists')).toBe('Ya existe un registro con esos valores.');
    expect(component.translateError('Cannot change pending to confirmed')).toBe('No se puede cambiar el estado de pendiente a confirmada.');
    expect(component.translateError('Cannot change otherStatus to unknownStatus')).toBe('No se puede cambiar el estado de otherStatus a unknownStatus.');
  });

  it('covers getFilteredTimeSlots today check', () => {
    const { component } = setup('client');

    component.selectedDateVal = '';
    expect(component.getFilteredTimeSlots()).toEqual(component.timeSlots);

    component.selectedDateVal = '2030-01-02';
    expect(component.getFilteredTimeSlots()).toEqual(component.timeSlots);

    // Set system time to 10:00 AM on July 28
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T10:00:00'));

    const todayStr = '2026-07-28';
    component.selectedDateVal = todayStr;
    const filtered = component.getFilteredTimeSlots();
    expect(filtered).not.toContain('08:00');
    expect(filtered).not.toContain('08:30');
    expect(filtered).not.toContain('09:00');
    expect(filtered).not.toContain('09:30');
    expect(filtered).not.toContain('10:00');
    expect(filtered).not.toContain('10:30');
    expect(filtered).not.toContain('11:00');
    expect(filtered).not.toContain('11:30');
    expect(filtered).toContain('12:00');
    expect(filtered).toContain('12:30');

    vi.useRealTimers();
  });
});
