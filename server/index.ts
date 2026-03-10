import express from 'express';
import dotenv from 'dotenv';
import { router as domainsRouter } from './routes/domains';
import { router as dnsRecordsRouter } from './routes/dnsRecords';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4727;

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use('/api', domainsRouter);
app.use('/api', dnsRecordsRouter);

app.listen(PORT, () => {
  console.log(`dns-text-api listening on port ${PORT}`);
});
