import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from '../../shared/errors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;
