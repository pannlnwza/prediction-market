import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import routes from './routes';
import { errorHandler } from '../../shared/errors';
import { initSocketServer } from './socket';

const app = express();
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());
app.use(routes);
app.use(errorHandler);

const httpServer = createServer(app);
initSocketServer(httpServer);

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT} (REST + WebSocket)`);
});

export default app;
