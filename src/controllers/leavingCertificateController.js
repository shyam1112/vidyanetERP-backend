const LeavingCertificateConfig = require('../models/LeavingCertificateConfig');

const DEFAULT_TEMPLATE = `This is to certify that {{student_name}}, son/daughter of {{father_name}} and {{mother_name}}, bearing Student ID {{student_id}} and Roll No. {{roll_number}}, was a bonafide student of this institution.

Date of Birth      : {{dob}}
Blood Group        : {{blood_group}}
Class              : {{class}} - {{section}}
Date of Admission  : {{admission_date}}
Date of Leaving    : {{leaving_date}}

He/She appeared in the {{last_exam}} examination conducted by this school.

His/Her progress in studies is {{progress}}.
His/Her conduct and character during the period of study has been {{conduct}}.

Reason for leaving: {{reason}}

This certificate is issued at the request of the parent/guardian for the purpose best known to them.`;

const getTemplate = async (req, res, next) => {
  try {
    const config = await LeavingCertificateConfig.findOne({ school: req.schoolId });
    res.json({ success: true, template: config?.template ?? DEFAULT_TEMPLATE });
  } catch (err) {
    next(err);
  }
};

const saveTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    const config = await LeavingCertificateConfig.findOneAndUpdate(
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
