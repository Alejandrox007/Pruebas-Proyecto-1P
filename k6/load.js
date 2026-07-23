import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const adminEmail = __ENV.ADMIN_EMAIL || 'admin@hospital.local';
const adminPassword = __ENV.ADMIN_PASSWORD || 'ChangeMe123!';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0 }
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<750', 'p(99)<1500'],
    checks: ['rate>0.99']
  }
};

export function setup() {
  const response = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({
    email: adminEmail,
    password: adminPassword
  }), { headers: { 'Content-Type': 'application/json' } });
  check(response, { 'admin login succeeds': (result) => result.status === 200 });
  return { token: response.json('token') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  const responses = http.batch([
    ['GET', `${baseUrl}/api/admin/summary`, null, { headers }],
    ['GET', `${baseUrl}/api/doctores`, null, { headers }],
    ['GET', `${baseUrl}/api/citas`, null, { headers }]
  ]);
  check(responses, { 'all protected reads succeed': (items) => items.every((item) => item.status === 200) });
  sleep(1);
}
