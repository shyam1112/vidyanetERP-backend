const BonafideCertificateConfig = require('../models/BonafideCertificateConfig');

const DEFAULT_TEMPLATE = `TO WHOM IT MAY CONCERN

This is to certify that {{student_name}}, son/daughter of {{father_name}}
and {{mother_name}}, is a bonafide student of this institution studying in
Class {{class}} - {{section}} during the academic year {{academic_year}}.

Student ID         : {{student_id}}
Roll No            : {{roll_number}}
Date of Birth      : {{dob}}
Blood Group        : {{blood_group}}
Gender             : {{gender}}
Date of Admission  : {{admission_date}}

This certificate is issued for the purpose of {{purpose}} at the request
of the student / parent / guardian.`;

const getTemplate = async (req, res, next) => {
  try {
    const config = await BonafideCertificateConfig.findOne({ school: req.schoolId });
    res.json({ success: true, template: config?.template ?? DEFAULT_TEMPLATE });
  } catch (err) {
    next(err);
  }
};

const saveTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    const config = await BonafideCertificateConfig.findOneAndUpdate(
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
