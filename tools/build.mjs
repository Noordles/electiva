// A development .env or shell must not select React's development bundle for
// the production artifact. Set this before Vite/config/plugin modules load.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build({ root: 'client', configFile: 'client/vite.config.js', mode: 'production' });
