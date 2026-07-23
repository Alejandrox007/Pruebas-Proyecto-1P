import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';

describe('AppComponent', () => {
  it('selects the initial tab by role and changes tabs', async () => {
    const user$ = new BehaviorSubject<any>({ id: 1, email: 'admin@test.com', role: 'admin' });
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: AuthService, useValue: { user: user$.value, user$ } }]
    }).overrideComponent(AppComponent, { set: { template: '' } }).compileComponents();
    const component = TestBed.createComponent(AppComponent).componentInstance;
    expect(component.activeTab).toBe('dashboard');
    component.selectTab('doctors');
    expect(component.activeTab).toBe('doctors');
    user$.next({ id: 2, email: 'client@test.com', role: 'client' });
    expect(component.activeTab).toBe('appointments');
  });
});
