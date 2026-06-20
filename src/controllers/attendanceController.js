const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const dayBounds = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start: d, end };
};

// GET /api/attendance?date=YYYY-MM-DD&class=5&section=A
const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date, class: cls, section } = req.query;
    if (!date || !cls || !section) {
      return res.status(400).json({ success: false, message: 'date, class and section are required' });
    }

    const { start, end } = dayBounds(date);

    const [record, students] = await Promise.all([
      Attendance.findOne({
        school: req.schoolId, class: cls, section,
        date: { $gte: start, $lte: end },
      }).populate('markedBy', 'name'),
      Student.find({ school: req.schoolId, class: cls, section, isActive: true })
        .sort({ rollNumber: 1 })
        .select('firstName lastName rollNumber studentId'),
    ]);

    res.json({ success: true, data: { record, students } });
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance — upsert for class+section+date
const saveAttendance = async (req, res, next) => {
  try {
    const { date, class: cls, section, records } = req.body;
    if (!date || !cls || !section || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'date, class, section and records are required' });
    }

    const { start, end } = dayBounds(date);

    const existing = await Attendance.findOne({
      school: req.schoolId, class: cls, section,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      existing.records  = records;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json({ success: true, data: existing, updated: true });
    }

    const attendance = await Attendance.create({
      school:   req.schoolId,
      date:     start,
      class:    cls,
      section,
      markedBy: req.user._id,
      records,
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/report?class=5&section=A&from=YYYY-MM-DD&to=YYYY-MM-DD
const getClassReport = async (req, res, next) => {
  try {
    const { class: cls, section, from, to } = req.query;
    if (!cls || !section) {
      return res.status(400).json({ success: false, message: 'class and section are required' });
    }

    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate   = to   ? new Date(to)   : new Date();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const [students, records] = await Promise.all([
      Student.find({ school: req.schoolId, class: cls, section, isActive: true })
        .sort({ rollNumber: 1 })
        .select('firstName lastName rollNumber studentId'),
      Attendance.find({
        school: req.schoolId, class: cls, section,
        date: { $gte: fromDate, $lte: toDate },
      }),
    ]);

    const totalDays = records.length;

    const data = students.map((student) => {
      let present = 0, absent = 0, late = 0, halfDay = 0;

      records.forEach((rec) => {
        const entry = rec.records.find((r) => r.student.toString() === student._id.toString());
        if (!entry) return;
        if (entry.status === 'present')   present++;
        else if (entry.status === 'absent')   absent++;
        else if (entry.status === 'late')     late++;
        else if (entry.status === 'half-day') halfDay++;
      });

      const effectiveDays = present + late + halfDay * 0.5;
      const percentage    = totalDays > 0 ? Math.round((effectiveDays / totalDays) * 100) : 0;

      return {
        student: { _id: student._id, firstName: student.firstName, lastName: student.lastName, rollNumber: student.rollNumber, studentId: student.studentId },
        present, absent, late, halfDay, percentage, totalDays,
      };
    });

    res.json({ success: true, totalDays, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/overview?date=YYYY-MM-DD
const getOverview = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { start, end } = dayBounds(date || new Date().toISOString().split('T')[0]);

    const records = await Attendance.find({
      school: req.schoolId,
      date: { $gte: start, $lte: end },
    }).populate('markedBy', 'name');

    const data = records.map((r) => {
      const present  = r.records.filter((s) => s.status === 'present').length;
      const absent   = r.records.filter((s) => s.status === 'absent').length;
      const late     = r.records.filter((s) => s.status === 'late').length;
      const halfDay  = r.records.filter((s) => s.status === 'half-day').length;
      return { class: r.class, section: r.section, total: r.records.length, present, absent, late, halfDay, markedBy: r.markedBy?.name, markedAt: r.updatedAt };
    }).sort((a, b) => Number(a.class) - Number(b.class) || a.section.localeCompare(b.section));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/student/:studentId?from=YYYY-MM-DD&to=YYYY-MM-DD
const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const student = await Student.findOne({ _id: studentId, school: req.schoolId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const records = await Attendance.find({
      school: req.schoolId,
      class: student.class,
      section: student.section,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 });

    const daily = records.map((rec) => {
      const entry = rec.records.find((r) => r.student.toString() === studentId);
      return { date: rec.date, status: entry?.status || null, remarks: entry?.remarks || '' };
    }).filter((d) => d.status);

    const summary = daily.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, { present: 0, absent: 0, late: 0, 'half-day': 0 });

    const totalDays = records.length;
    const effectiveDays = summary.present + summary.late + summary['half-day'] * 0.5;
    const percentage = totalDays > 0 ? Math.round((effectiveDays / totalDays) * 100) : 0;

    res.json({ success: true, data: { student, daily, summary, totalDays, percentage } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAttendanceByDate, saveAttendance, getClassReport, getOverview, getStudentAttendance };
