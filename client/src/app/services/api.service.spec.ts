import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { ApiService, Doctor, Patient, Medicine, Specialty } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Manejar la petición inicial de checkServerStatus() en el constructor
    const req = httpMock.expectOne('/api/doctores');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update server status to true on successful connection check', () => {
    let status: boolean | null = null;
    service.serverStatus$.subscribe(s => status = s);

    // Llamar explícitamente a checkServerStatus
    service.checkServerStatus();

    const req = httpMock.expectOne('/api/doctores');
    expect(req.request.method).toBe('GET');
    req.flush([]); // éxito

    expect(status).toBe(true);
  });

  it('should update server status to false on failed connection check', () => {
    let status: boolean | null = null;
    service.serverStatus$.subscribe(s => status = s);

    // Llamar explícitamente a checkServerStatus
    service.checkServerStatus();

    const req = httpMock.expectOne('/api/doctores');
    expect(req.request.method).toBe('GET');
    req.flush('Error', { status: 500, statusText: 'Server Error' }); // error

    expect(status).toBe(false);
  });

  // DOCTORS TESTS
  describe('Doctors CRUD', () => {
    const mockDoctors: Doctor[] = [
      { id: 1, name: 'John', lastName: 'Doe', specialty: 'Cardiology', phone: '123', email: 'j@d.com', licenseNumber: 'LC123' }
    ];

    it('should get doctors list', () => {
      service.getDoctors().subscribe(doctors => {
        expect(doctors).toEqual(mockDoctors);
      });

      const req = httpMock.expectOne('/api/doctores');
      expect(req.request.method).toBe('GET');
      req.flush(mockDoctors);
    });

    it('should create a doctor', () => {
      const newDoctor: Doctor = { name: 'Jane', lastName: 'Smith', specialty: 'Pediatrics', phone: '456', email: 'j@s.com', licenseNumber: 'LC456' };
      service.createDoctor(newDoctor).subscribe(doctor => {
        expect(doctor).toEqual({ id: 2, ...newDoctor });
      });

      const req = httpMock.expectOne('/api/doctores');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newDoctor);
      req.flush({ id: 2, ...newDoctor });
    });

    it('should update a doctor', () => {
      const updatedDoctor: Doctor = { name: 'John Updated', lastName: 'Doe', specialty: 'Cardiology', phone: '123', email: 'j@d.com', licenseNumber: 'LC123' };
      service.updateDoctor(1, updatedDoctor).subscribe(doctor => {
        expect(doctor).toEqual(updatedDoctor);
      });

      const req = httpMock.expectOne('/api/doctores/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedDoctor);
      req.flush(updatedDoctor);
    });

    it('should delete a doctor', () => {
      service.deleteDoctor(1).subscribe(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/doctores/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  // PATIENTS TESTS
  describe('Patients CRUD', () => {
    const mockPatients: Patient[] = [
      { id: 1, name: 'Alice', lastName: 'Wonder', email: 'a@w.com', gender: 'F', illness: 'Flu' }
    ];

    it('should get patients list', () => {
      service.getPatients().subscribe(patients => {
        expect(patients).toEqual(mockPatients);
      });

      const req = httpMock.expectOne('/api/pacientes');
      expect(req.request.method).toBe('GET');
      req.flush(mockPatients);
    });

    it('should create a patient', () => {
      const newPatient: Patient = { name: 'Bob', lastName: 'Builder', email: 'b@b.com', gender: 'M', illness: 'Cold' };
      service.createPatient(newPatient).subscribe(patient => {
        expect(patient).toEqual({ id: 2, ...newPatient });
      });

      const req = httpMock.expectOne('/api/pacientes');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...newPatient });
    });

    it('should update a patient', () => {
      const updatedPatient: Patient = { name: 'Alice Updated', lastName: 'Wonder', email: 'a@w.com', gender: 'F', illness: 'Flu' };
      service.updatePatient(1, updatedPatient).subscribe(patient => {
        expect(patient).toEqual(updatedPatient);
      });

      const req = httpMock.expectOne('/api/pacientes/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedPatient);
    });

    it('should delete a patient', () => {
      service.deletePatient(1).subscribe(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/pacientes/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  // MEDICINES TESTS
  describe('Medicines CRUD', () => {
    const mockMedicines: Medicine[] = [
      { id: 1, name: 'Paracetamol', description: 'Pain killer' }
    ];

    it('should get medicines list', () => {
      service.getMedicines().subscribe(medicines => {
        expect(medicines).toEqual(mockMedicines);
      });

      const req = httpMock.expectOne('/api/medicamentos');
      expect(req.request.method).toBe('GET');
      req.flush(mockMedicines);
    });

    it('should create a medicine', () => {
      const newMedicine: Medicine = { name: 'Ibuprofen', description: 'Anti-inflammatory' };
      service.createMedicine(newMedicine).subscribe(medicine => {
        expect(medicine).toEqual({ id: 2, ...newMedicine });
      });

      const req = httpMock.expectOne('/api/medicamentos');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...newMedicine });
    });

    it('should update a medicine', () => {
      const updatedMedicine: Medicine = { name: 'Paracetamol 500mg', description: 'Pain killer' };
      service.updateMedicine(1, updatedMedicine).subscribe(medicine => {
        expect(medicine).toEqual(updatedMedicine);
      });

      const req = httpMock.expectOne('/api/medicamentos/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedMedicine);
    });

    it('should delete a medicine', () => {
      service.deleteMedicine(1).subscribe(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/medicamentos/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  // SPECIALTIES TESTS
  describe('Specialties CRUD', () => {
    const mockSpecialties: Specialty[] = [
      { id: 1, name: 'Pediatrics', description: 'Children care' }
    ];

    it('should get specialties list', () => {
      service.getSpecialties().subscribe(specialties => {
        expect(specialties).toEqual(mockSpecialties);
      });

      const req = httpMock.expectOne('/api/especialidades');
      expect(req.request.method).toBe('GET');
      req.flush(mockSpecialties);
    });

    it('should create a specialty', () => {
      const newSpecialty: Specialty = { name: 'Cardiology', description: 'Heart care' };
      service.createSpecialty(newSpecialty).subscribe(specialty => {
        expect(specialty).toEqual({ id: 2, ...newSpecialty });
      });

      const req = httpMock.expectOne('/api/especialidades');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...newSpecialty });
    });

    it('should update a specialty', () => {
      const updatedSpecialty: Specialty = { name: 'Pediatrics Special', description: 'Children care' };
      service.updateSpecialty(1, updatedSpecialty).subscribe(specialty => {
        expect(specialty).toEqual(updatedSpecialty);
      });

      const req = httpMock.expectOne('/api/especialidades/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedSpecialty);
    });

    it('should delete a specialty', () => {
      service.deleteSpecialty(1).subscribe(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/especialidades/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  it('should call checkServerStatus periodically', () => {
    vi.useFakeTimers();

    // Instanciar manualmente dentro de fakeTimers para capturar el setInterval
    const httpClient = TestBed.inject(HttpClient);
    const testService = new ApiService(httpClient);

    // Limpiar petición de construcción inicial
    const req1 = httpMock.expectOne('/api/doctores');
    req1.flush([]);

    // Avanzar 15 segundos en el tiempo para disparar el intervalo
    vi.advanceTimersByTime(15000);
    
    // Debería ocurrir una petición GET a /api/doctores debido al intervalo
    const req2 = httpMock.expectOne('/api/doctores');
    expect(req2.request.method).toBe('GET');
    req2.flush([]);
  });
});
