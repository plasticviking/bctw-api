import pg, { PoolClient } from 'pg';

const isProd = process.env.NODE_ENV === 'production' ? true : false;
const pgPort = +(isProd ? process.env.POSTGRES_SERVER_PORT ?? '5432' : '5432');
const pgHost = isProd ? process.env.POSTGRES_SERVER_HOST : 'localhost';
const ROLLBACK = (process.env.ROLLBACK ?? true) && !isProd;

console.log('node env:', process.env.NODE_ENV);
console.log('database port', pgPort);
console.log('database host', pgHost);
console.log('rolling back persisting changes', ROLLBACK);

// Set up the database pool
const pgPool = new pg.Pool({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  host: pgHost,
  port: pgPort,
  max: 10,
});

pgPool.on('error', (err: Error, client: PoolClient): void => {
  console.log(`postgresql error: ${err}`);
});
pgPool.on('acquire', (client: PoolClient): void => {
  // console.log(`postgresql client acquired`);
});
pgPool.on('connect', (client: PoolClient): void => {
  // console.log(`postgresql client connected`);
});

export {
  isProd,
  pgPool,
  ROLLBACK
};
