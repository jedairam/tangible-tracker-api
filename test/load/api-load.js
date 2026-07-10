import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Objetivo de la prueba técnica: ~50 peticiones por segundo
export const options = {
  scenarios: {
    health_probe: {
      executor: 'constant-arrival-rate',
      exec: 'health',
      rate: 10,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 5,
      maxVUs: 30,
    },
    list_tasks: {
      executor: 'constant-arrival-rate',
      exec: 'listTasks',
      rate: 40,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      maxVUs: 80,
      startTime: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.95'],
  },
};

export function health() {
  const response = http.get(`${BASE_URL}/health`);

  check(response, {
    'health status 200 or 503': (r) => r.status === 200 || r.status === 503,
    'health has success envelope': (r) => {
      try {
        const body = r.json();
        return body.success === true && body.data !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(0.1);
}

export function listTasks() {
  const response = http.get(`${BASE_URL}/api/tasks`);

  check(response, {
    'tasks status 200': (r) => r.status === 200,
    'tasks has success envelope': (r) => {
      try {
        const body = r.json();
        return body.success === true && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  sleep(0.1);
}
