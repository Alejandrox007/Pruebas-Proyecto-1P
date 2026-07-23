import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

it('loads the administrator summary', () => {
  const component = new DashboardComponent({ getAdminSummary: () => of({ doctors: 2 }) } as any);
  component.ngOnInit();
  expect(component.summary.doctors).toBe(2);
});
