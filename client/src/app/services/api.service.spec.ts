import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function healthOk(): void {
    http.expectOne('/api/health').flush({ status: 'ok' });
  }

  it('reports server availability and failure', () => {
    const states: Array<boolean | null> = [];
    service.serverStatus$.subscribe((value) => states.push(value));
    http.expectOne('/api/health').flush({ status: 'ok' });
    expect(states.at(-1)).toBe(true);
    service.checkServerStatus();
    http.expectOne('/api/health').flush({}, { status: 500, statusText: 'error' });
    expect(states.at(-1)).toBe(false);
  });

  it('executes every API contract with the expected method and body', () => {
    healthOk();
    const cases: Array<[() => unknown, string, string, unknown?]> = [
      [() => service.getDoctors().subscribe(), '/api/doctores', 'GET'],
      [() => service.createDoctor({ name: 'A', lastName: 'B', specialtyId: 1, phone: '1234567', email: 'a@b.co', licenseNumber: 'M1' }).subscribe(), '/api/doctores', 'POST'],
      [() => service.updateDoctor(1, { phone: '12345678' }).subscribe(), '/api/doctores/1', 'PUT'],
      [() => service.deleteDoctor(1).subscribe(), '/api/doctores/1', 'DELETE'],
      [() => service.getPatients().subscribe(), '/api/pacientes', 'GET'],
      [() => service.updatePatient(1, { illness: 'Gripe' }).subscribe(), '/api/pacientes/1', 'PUT'],
      [() => service.deletePatient(1).subscribe(), '/api/pacientes/1', 'DELETE'],
      [() => service.getMedicines().subscribe(), '/api/medicamentos', 'GET'],
      [() => service.createMedicine({ name: 'A', description: null }).subscribe(), '/api/medicamentos', 'POST'],
      [() => service.updateMedicine(1, { name: 'B' }).subscribe(), '/api/medicamentos/1', 'PUT'],
      [() => service.deleteMedicine(1).subscribe(), '/api/medicamentos/1', 'DELETE'],
      [() => service.getSpecialties().subscribe(), '/api/especialidades', 'GET'],
      [() => service.createSpecialty({ name: 'Cardio' }).subscribe(), '/api/especialidades', 'POST'],
      [() => service.updateSpecialty(1, { name: 'Neuro' }).subscribe(), '/api/especialidades/1', 'PUT'],
      [() => service.deleteSpecialty(1).subscribe(), '/api/especialidades/1', 'DELETE'],
      [() => service.getAppointments().subscribe(), '/api/citas', 'GET'],
      [() => service.createAppointment({ doctorId: 1, scheduledAt: 'x', reason: 'reason' }).subscribe(), '/api/citas', 'POST'],
      [() => service.updateAppointment(1, 'confirmed').subscribe(), '/api/citas/1', 'PATCH'],
      [() => service.updateAppointment(1, 'completed', 'ok').subscribe(), '/api/citas/1', 'PATCH'],
      [() => service.getPrescriptions().subscribe(), '/api/recetas', 'GET'],
      [() => service.createPrescription({ appointmentId: 1, diagnosis: 'x', instructions: 'y', medications: [] }).subscribe(), '/api/recetas', 'POST'],
      [() => service.getAdminSummary().subscribe(), '/api/admin/summary', 'GET']
    ];
    for (const [call, url, method] of cases) {
      call();
      const req = http.expectOne(url);
      expect(req.request.method).toBe(method);
      req.flush({});
    }
  });
});
