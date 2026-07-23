import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SidebarComponent } from './sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  const logout = vi.fn();
  const api = { serverStatus$: new BehaviorSubject<boolean | null>(null) };
  const auth = { user: { id: 1, email: 'admin@test.com', role: 'admin' }, logout };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('selects tabs, emits, reflects status and logs out', () => {
    const component = fixture.componentInstance;
    const emit = vi.spyOn(component.tabSelected, 'emit');
    expect(component.activeTab).toBe('dashboard');
    component.selectTab('doctors');
    expect(emit).toHaveBeenCalledWith('doctors');
    api.serverStatus$.next(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Operativo');
    api.serverStatus$.next(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin conexión');
    component.logout();
    expect(logout).toHaveBeenCalled();
  });
});
