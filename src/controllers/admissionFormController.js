const AdmissionFormConfig = require('../models/AdmissionFormConfig');

const DEFAULT_TEMPLATE = `ADMISSION FORM
==============================================================
Form No      : {{form_no}}            Date : {{date}}
Academic Year: {{academic_year}}
==============================================================

STUDENT DETAILS
--------------------------------------------------------------
Full Name          : {{student_name}}
Date of Birth      : {{dob}}
Gender             : {{gender}}
Blood Group        : {{blood_group}}
Class Admitted To  : {{class}} - {{section}}
Roll No            : {{roll_number}}
Student ID         : {{student_id}}
Date of Admission  : {{admission_date}}
Previous School    : {{previous_school}}
Previous Class     : {{previous_class}}
Address            : {{address}}
Phone              : {{student_phone}}
Email              : {{student_email}}

PARENT / GUARDIAN DETAILS
--------------------------------------------------------------
Father's Name      : {{father_name}}
Father's Phone     : {{father_phone}}
Father's Occupation: {{father_occupation}}
Mother's Name      : {{mother_name}}
Mother's Phone     : {{mother_phone}}
Mother's Occupation: {{mother_occupation}}

SCHOOL DETAILS
--------------------------------------------------------------
School Name        : {{school_name}}
Address            : {{school_address}}
Phone              : {{school_phone}}
==============================================================

Declaration: I/We hereby declare that the above information
is true and correct to the best of my/our knowledge.

Parent/Guardian Signature          Principal's Signature
______________________             ______________________`;

const getTemplate = async (req, res, next) => {
  try {
    const config = await AdmissionFormConfig.findOne({ school: req.schoolId });
    res.json({ success: true, template: config?.template ?? DEFAULT_TEMPLATE });
  } catch (err) {
    next(err);
  }
};

const saveTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    const config = await AdmissionFormConfig.findOneAndUpdate(
      { school: req.schoolId },
      { template },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, template: config.template });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplate, saveTemplate };
