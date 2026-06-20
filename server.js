require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/students', require('./src/routes/studentRoutes'));
app.use('/api/parents', require('./src/routes/parentRoutes'));
app.use('/api/marks', require('./src/routes/marksRoutes'));
app.use('/api/exam-types', require('./src/routes/examTypeRoutes'));
app.use('/api/team', require('./src/routes/teamRoutes'));
app.use('/api/fees', require('./src/routes/feesRoutes'));
app.use('/api/grade-config', require('./src/routes/gradeConfigRoutes'));
app.use('/api/fee-config', require('./src/routes/feeConfigRoutes'));
app.use('/api/whatsapp', require('./src/routes/whatsappRoutes'));
app.use('/api/leaving-certificate', require('./src/routes/leavingCertificateRoutes'));
app.use('/api/admission-form', require('./src/routes/admissionFormRoutes'));
app.use('/api/bonafide-certificate', require('./src/routes/bonafideCertificateRoutes'));
app.use('/api/character-certificate', require('./src/routes/characterCertificateRoutes'));
app.use('/api/dob-certificate', require('./src/routes/dobCertificateRoutes'));
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
