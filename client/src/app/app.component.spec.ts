import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ApiService } from './services/api.service';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockApiService: any;

  beforeEach(async () => {
    mockApiService = {
      serverStatus$: of(true),
      getDoctors: () => of([]),
      getPatients: () => of([]),
      getMedicines: () => of([]),
      getSpecialties: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial activeTab as "doctors"', () => {
    expect(component.activeTab).toBe('doctors');
  });

  it('should update activeTab when selectTab is called', () => {
    component.selectTab('patients');
    expect(component.activeTab).toBe('patients');

    component.selectTab('medicines');
    expect(component.activeTab).toBe('medicines');
  });
});
