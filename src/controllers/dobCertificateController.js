const DOBCertificateConfig = require('../models/DOBCertificateConfig');

const DEFAULT_TEMPLATE = `TO WHOM IT MAY CONCERN

This is to certify that {{student_name}}, son/daughter of {{father_name}}
and {{mother_name}}, bearing Student ID {{student_id}}, is / was a student
of this institution.

According to the admission records of this school, his/her date of birth is:

  {{dob}}
  (In words: {{dob_words}})

Gender             : {{gender}}
Class              : {{class}} - {{section}}
Roll No            : {{roll_number}}
Date of Admission  : {{admission_date}}

This information is based on the records maintained by this institution
at the time of admission and is issued for official purposes at the request
of the parent / guardian.`;

const getTemplate = async (req, res, next) => {
  try {
    const config = await DOBCertificateConfig.findOne({ school: req.schoolId });
    res.json({ success: true, template: config?.template ?? DEFAULT_TEMPLATE });
  } catch (err) {
    next(err);
  }
};

const saveTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    const config = await DOBCertificateConfig.findOneAndUpdate(
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
