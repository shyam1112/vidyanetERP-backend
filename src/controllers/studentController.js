const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { uploadToS3, deleteFromS3 } = require('../utils/s3Upload');

const buildAddress = (body) => ({
  street: body.street || '',
  city: body.city || '',
  state: body.state || '',
  pincode: body.pincode || '',
});

const buildParentPayload = (body, studentId) => ({
  student: studentId,
  father: {
    name: body.fatherName || '',
    phone: body.fatherPhone || '',
    email: body.fatherEmail || '',
    occupation: body.fatherOccupation || '',
    qualification: body.fatherQualification || '',
  },
  mother: {
    name: body.motherName || '',
    phone: body.motherPhone || '',
    email: body.motherEmail || '',
    occupation: body.motherOccupation || '',
    qualification: body.motherQualification || '',
  },
});

const hasParentData = (body) =>
  body.fatherName || body.fatherPhone || body.motherName || body.motherPhone;

const studentFields = (body) => {
  const { street, city, state, pincode,
    fatherName, fatherPhone, fatherEmail, fatherOccupation, fatherQualification,
    motherName, motherPhone, motherEmail, motherOccupation, motherQualification,
    ...rest } = body;
  return rest;
};

const getStudents = async (req, res, next) => {
  try {
    const { class: cls, section, academicYear, search, page = 1, limit = 10, isActive, withParent } = req.query;
    const query = { school: req.schoolId };
    if (cls) query.class = cls;
    if (section) query.section = section;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ class: 1, section: 1, rollNumber: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (withParent === 'true') {
      const ids = students.map((s) => s._id);
      const parents = await Parent.find({ student: { $in: ids } }).select('student father.name father.phone mother.name mother.phone');
      const parentMap = {};
      parents.forEach((p) => { parentMap[p.student.toString()] = p; });
      const data = students.map((s) => ({
        ...s.toObject(),
        parent: parentMap[s._id.toString()] || null,
      }));
      return res.json({ success: true, total, page: Number(page), data });
    }

    res.json({ success: true, total, page: Number(page), data: students });
  } catch (error) {
    next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, school: req.schoolId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const parent = await Parent.findOne({ student: req.params.id });
    res.json({ success: true, data: student, parent: parent || null });
  } catch (error) {
    next(error);
  }
};

const checkDuplicates = async (schoolId, { studentId, rollNumber, cls, section, excludeId } = {}) => {
  if (studentId) {
    const query = { school: schoolId, studentId };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Student.findOne(query).select('studentId');
    if (existing) {
      return `Student ID "${studentId}" is already in use by another student. Please use a different Student ID.`;
    }
  }
  if (rollNumber && cls && section) {
    const query = { school: schoolId, class: cls, section, rollNumber };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Student.findOne(query).select('rollNumber firstName lastName');
    if (existing) {
      return `Roll number "${rollNumber}" is already assigned to ${existing.firstName} ${existing.lastName} in Class ${cls} - Section ${section}. Please use a different roll number.`;
    }
  }
  return null;
};

const createStudent = async (req, res, next) => {
  try {
    const dupError = await checkDuplicates(req.schoolId, {
      studentId: req.body.studentId,
      rollNumber: req.body.rollNumber,
      cls: req.body.class,
      section: req.body.section,
    });
    if (dupError) return res.status(400).json({ success: false, message: dupError });

    let photoUrl = '';
    if (req.file) photoUrl = await uploadToS3(req.file, 'students');

    const student = await Student.create({
      ...studentFields(req.body),
      address: buildAddress(req.body),
      photo: photoUrl,
      school: req.schoolId,
    });

    if (hasParentData(req.body)) {
      await Parent.create(buildParentPayload(req.body, student._id));
    }

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, school: req.schoolId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const dupError = await checkDuplicates(req.schoolId, {
      studentId: req.body.studentId,
      rollNumber: req.body.rollNumber,
      cls: req.body.class,
      section: req.body.section,
      excludeId: req.params.id,
    });
    if (dupError) return res.status(400).json({ success: false, message: dupError });

    const updateData = { ...studentFields(req.body), address: buildAddress(req.body) };

    if (req.file) {
      if (student.photo) await deleteFromS3(student.photo);
      updateData.photo = await uploadToS3(req.file, 'students');
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (hasParentData(req.body)) {
      await Parent.findOneAndUpdate(
        { student: req.params.id },
        buildParentPayload(req.body, req.params.id),
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, school: req.schoolId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.photo) await deleteFromS3(student.photo);
    await Parent.findOneAndDelete({ student: req.params.id });
    await student.deleteOne();
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent };
