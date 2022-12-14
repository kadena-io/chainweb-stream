import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { router } from './src/routes/sse.routes.js';

const { port } = config;
const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(router);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`KDA Events service (${config.network}) listening at http://localhost:${port}`);
});
