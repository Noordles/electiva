import { createApp } from './app.js';
import { businessRoutes } from './routes.js';

export function createApplication(db, options = {}) {
  return createApp({ ...options, milestone: 'M3',
    capabilities: { authentication: true, persistedCatalog: true, enrollment: true },
    checkReady: () => db.ready(), configureRoutes: businessRoutes(db, options),
  });
}
