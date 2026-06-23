import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { ApiService } from '../../services/api.service';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockApiService: any;
  let serverStatusSubject: BehaviorSubject<boolean | null>;

  beforeEach(async () => {
    serverStatusSubject = new BehaviorSubject<boolean | null>(null);
    mockApiService = {
      serverStatus$: serverStatusSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial activeTab as "doctors"', () => {
    expect(component.activeTab).toBe('doctors');
  });

  it('should select tab and emit event on selectTab()', () => {
    vi.spyOn(component.tabSelected, 'emit');

    component.selectTab('patients');

    expect(component.activeTab).toBe('patients');
    expect(component.tabSelected.emit).toHaveBeenCalledWith('patients');
  });

  it('should receive serverStatus$ from ApiService', async () => {
    const statusPromise = new Promise<boolean | null>((resolve) => {
      component.serverStatus$.subscribe((status) => {
        if (status === true) {
          resolve(status);
        }
      });
    });

    serverStatusSubject.next(true);
    const status = await statusPromise;
    expect(status).toBe(true);
  });
});
