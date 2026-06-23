import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let mockToastService: any;
  let toastSubject: BehaviorSubject<{ message: string; type: string } | null>;

  beforeEach(async () => {
    toastSubject = new BehaviorSubject<{ message: string; type: string } | null>(null);
    mockToastService = {
      toast$: toastSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display toast initially', () => {
    const toastElement = fixture.debugElement.query(By.css('.toast'));
    expect(toastElement).toBeNull();
  });

  it('should display toast when active', () => {
    toastSubject.next({ message: 'Success Message', type: 'success' });
    fixture.detectChanges();

    const toastElement = fixture.debugElement.query(By.css('.toast'));
    expect(toastElement).not.toBeNull();
    expect(toastElement.nativeElement.textContent.trim()).toBe('Success Message');
    expect(toastElement.nativeElement.classList.contains('success')).toBe(true);
  });

  it('should apply error class when type is error', () => {
    toastSubject.next({ message: 'Error Message', type: 'error' });
    fixture.detectChanges();

    const toastElement = fixture.debugElement.query(By.css('.toast'));
    expect(toastElement.nativeElement.classList.contains('error')).toBe(true);
  });
});
