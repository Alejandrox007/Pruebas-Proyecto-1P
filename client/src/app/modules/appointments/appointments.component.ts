import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Appointment, Doctor, Patient } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  readonly role = this.auth.user!.role;
  readonly form = this.fb.group({
    doctorId: [null as number | null, Validators.required],
    patientId: [null as number | null],
    scheduledAt: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
  });

  minDate: string = '';
  selectedDateVal: string = '';
  selectedTimeVal: string = '';
  readonly timeSlots: string[] = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  get selectedDate(): string {
    return this.selectedDateVal;
  }

  get selectedTime(): string {
    return this.selectedTimeVal;
  }

  getFilteredTimeSlots(): string[] {
    const dateStr = this.selectedDate;
    if (!dateStr) {
      return this.timeSlots;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (dateStr === todayStr) {
      const minTime = today.getTime() + 2 * 60 * 60 * 1000;
      return this.timeSlots.filter(slot => {
        const slotDate = new Date(`${dateStr}T${slot}`);
        return slotDate.getTime() >= minTime;
      });
    }

    return this.timeSlots;
  }

  updateScheduledAt(): void {
    const date = this.selectedDateVal;
    const time = this.selectedTimeVal;
    this.form.patchValue({
      scheduledAt: date && time ? `${date}T${time}` : ''
    }, { emitEvent: false });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const dateStr = input.value;
    if (dateStr) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const day = dateObj.getDay();
      if (day === 0 || day === 6) {
        this.toast.showToast('Las citas solo se pueden agendar de lunes a viernes', 'error');
        input.value = '';
        this.selectedDateVal = '';
        this.updateScheduledAt();
        return;
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const currentDay = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${currentDay}`;

      if (dateStr === todayStr) {
        const minTime = today.getTime() + 2 * 60 * 60 * 1000;
        const availableSlots = this.timeSlots.filter(slot => {
          const slotDate = new Date(`${dateStr}T${slot}`);
          return slotDate.getTime() >= minTime;
        });

        if (availableSlots.length === 0) {
          this.toast.showToast('Ya ha pasado la última hora de citas disponible para el día de hoy', 'error');
          input.value = '';
          this.selectedDateVal = '';
          this.updateScheduledAt();
          return;
        }
      }
    }

    this.selectedDateVal = dateStr;

    const time = this.selectedTimeVal;
    if (dateStr && time) {
      const today = new Date();
      const minTime = today.getTime() + 2 * 60 * 60 * 1000;
      const slotDate = new Date(`${dateStr}T${time}`);
      if (slotDate.getTime() < minTime) {
        this.toast.showToast('La hora seleccionada ya no está disponible para hoy', 'error');
        this.selectedTimeVal = '';
      }
    }

    this.updateScheduledAt();
  }

  onTimeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const time = select.value;
    const date = this.selectedDateVal;

    if (date && time) {
      const today = new Date();
      const minTime = today.getTime() + 2 * 60 * 60 * 1000;
      const slotDate = new Date(`${date}T${time}`);
      if (slotDate.getTime() < minTime) {
        this.toast.showToast('La cita debe ser programada con al menos dos horas de anticipación', 'error');
        select.value = '';
        this.selectedTimeVal = '';
        this.updateScheduledAt();
        return;
      }
    }

    this.selectedTimeVal = time;
    this.updateScheduledAt();
  }

  onReasonInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const sanitized = textarea.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,;:()\-¿?¡!]/g, '');
    if (textarea.value !== sanitized) {
      textarea.value = sanitized;
      this.form.patchValue({ reason: sanitized });
    }
  }

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly toast: ToastService
  ) { }

  ngOnInit(): void {
    this.load();
    if (this.role !== 'doctor') this.api.getDoctors().subscribe((items) => this.doctors = items.filter((item) => item.active !== false));
    if (this.role === 'admin') this.api.getPatients().subscribe((items) => this.patients = items);

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;

    this.form.get('scheduledAt')?.valueChanges.subscribe(val => {
      if (val) {
        const match = val.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
        if (match) {
          this.selectedDateVal = match[1];
          this.selectedTimeVal = match[2];
        } else {
          this.selectedDateVal = '';
          this.selectedTimeVal = '';
        }
      } else {
        this.selectedDateVal = '';
        this.selectedTimeVal = '';
      }
    });
  }

  translateError(msg: string): string {
    if (!msg) return '';
    const translations: Record<string, string> = {
      'Appointments must be scheduled at least two hours ahead': 'Las citas deben ser programadas con al menos dos horas de anticipación.',
      'Appointments are Monday-Friday, 08:00-18:00, every 30 minutes': 'Las citas son de lunes a viernes, de 08:00 a 18:00, cada 30 minutos.',
      'patientId is required for administrators': 'El ID del paciente es requerido para los administradores.',
      'Patient does not exist': 'El paciente no existe.',
      'Doctor does not exist or is inactive': 'El médico no existe o está inactivo.',
      'The doctor is not available at that time': 'El médico no está disponible en ese horario.',
      'This appointment is assigned to another doctor': 'Esta cita está asignada a otro médico.',
      'You can only manage your own appointments': 'Solo puedes gestionar tus propias citas.',
      'Patients can only cancel appointments': 'Los pacientes solo pueden cancelar citas.',
      'Appointment not found': 'Cita no encontrada.',
      'A record with those values already exists': 'Ya existe un registro con esos valores.',
      'The record is in use or references invalid data': 'El registro está en uso o hace referencia a datos inválidos.',
      'API route not found': 'Ruta de la API no encontrada.',
      'Internal server error': 'Error interno del servidor.'
    };
    if (translations[msg]) {
      return translations[msg];
    }
    if (msg.startsWith('Cannot change ')) {
      const parts = msg.split(' to ');
      const fromStatus = parts[0].replace('Cannot change ', '');
      const toStatus = parts[1];
      const statusMap: Record<string, string> = {
        pending: 'pendiente',
        confirmed: 'confirmada',
        completed: 'completada',
        cancelled: 'cancelada'
      };
      const fromSp = statusMap[fromStatus] || fromStatus;
      const toSp = statusMap[toStatus] || toStatus;
      return `No se puede cambiar el estado de ${fromSp} a ${toSp}.`;
    }
    return msg;
  }

  load(): void {
    this.api.getAppointments().subscribe({
      next: (items) => this.appointments = items,
      error: () => this.toast.showToast('No se pudieron cargar las citas', 'error')
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.toast.showToast('Completa correctamente los datos de la cita', 'error');
      return;
    }
    const value = this.form.getRawValue();
    this.api.createAppointment({
      doctorId: Number(value.doctorId),
      ...(this.role === 'admin' ? { patientId: Number(value.patientId) } : {}),
      scheduledAt: new Date(value.scheduledAt!).toISOString(),
      reason: value.reason!
    }).subscribe({
      next: () => {
        this.toast.showToast('Cita agendada exitosamente');
        this.form.reset();
        this.load();
      },
      error: (error) => this.toast.showToast(this.translateError(error.error?.message) || 'No se pudo agendar la cita', 'error')
    });
  }

  changeStatus(appointment: Appointment, status: string): void {
    this.api.updateAppointment(appointment.id!, status).subscribe({
      next: () => {
        this.toast.showToast('Estado actualizado');
        this.load();
      },
      error: (error) => this.toast.showToast(this.translateError(error.error?.message) || 'No se pudo actualizar', 'error')
    });
  }
}
