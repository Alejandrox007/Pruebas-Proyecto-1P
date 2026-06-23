import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { firstValueFrom } from 'rxjs';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initial toast value be null', async () => {
    const toast = await firstValueFrom(service.toast$);
    expect(toast).toBeNull();
  });

  it('should show toast message and type, and clear it after 3000ms', () => {
    vi.useFakeTimers();
    let currentToast: any = null;
    
    // Subscribe to toast$ to keep track of changes
    const sub = service.toast$.subscribe((toast) => {
      currentToast = toast;
    });

    // Trigger toast
    service.showToast('Test Message', 'error');
    expect(currentToast).toEqual({ message: 'Test Message', type: 'error' });

    // Tick forward 2999ms, toast should still be visible
    vi.advanceTimersByTime(2999);
    expect(currentToast).toEqual({ message: 'Test Message', type: 'error' });

    // Tick forward 1 more ms (total 3000ms), toast should be cleared (null)
    vi.advanceTimersByTime(1);
    expect(currentToast).toBeNull();

    sub.unsubscribe();
  });

  it('should default to success type when type is not specified', () => {
    let currentToast: any = null;
    const sub = service.toast$.subscribe((toast) => {
      currentToast = toast;
    });

    service.showToast('Test Default');
    expect(currentToast).toEqual({ message: 'Test Default', type: 'success' });
    sub.unsubscribe();
  });
});
