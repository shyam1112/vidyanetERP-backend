const mongoose = require('mongoose');

const EXAM_TYPE_MAP = {
  'unit-test-1': 'Unit Test 1',
  'unit-test-2': 'Unit Test 2',
  'mid-term': 'Mid Term',
  'final': 'Final',
  'pre-board': 'Pre Board',
};

const migrateExamTypes = async () => {
  try {
    const marksCol = mongoose.connection.collection('marks');
    for (const [oldVal, newVal] of Object.entries(EXAM_TYPE_MAP)) {
      const result = await marksCol.updateMany({ examType: oldVal }, { $set: { examType: newVal } });
      if (result.modifiedCount > 0) {
        console.log(`Migrated ${result.modifiedCount} marks: "${oldVal}" → "${newVal}"`);
      }
    }
  } catch (err) {
    console.warn('Exam type migration skipped:', err.message);
  }
};

const dropLegacyIndexes = async () => {
  try {
    const studentCol = mongoose.connection.collection('students');
    const indexes = await studentCol.indexes();
    // Drop the old global unique index on studentId if it still exists
    const legacy = indexes.find(
      (idx) => idx.key && idx.key.studentId === 1 && !idx.key.school && idx.unique
    );
    if (legacy) {
      await studentCol.dropIndex(legacy.name);
      console.log('Dropped legacy global studentId unique index');
    }
  } catch (err) {
    // Non-fatal — index may already be gone
    console.warn('Legacy index cleanup skipped:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await migrateExamTypes();
    await dropLegacyIndexes();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
