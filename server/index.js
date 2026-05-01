const express = require('express');
const cors = require('cors');
require('dotenv').config();

const cvRoutes = require('./routes/cvRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/cv', cvRoutes);
app.use('/api/interview', interviewRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
