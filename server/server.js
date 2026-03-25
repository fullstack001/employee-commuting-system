require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { seedAdmin } = require('./src/utils/seed');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
