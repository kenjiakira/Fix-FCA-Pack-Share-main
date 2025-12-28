// Load environment variables
require('dotenv').config();

const App = require('./src/app');

const PORT = process.env.API_PORT || 3001;

const app = new App();
app.listen(PORT);

