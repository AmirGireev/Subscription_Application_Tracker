// imports
import 'dotenv/config';
import app from './app';

// port
const port = process.env.PORT ?? 3000;
// start server
app.listen(port, () => console.log(`API running on port ${port}`));