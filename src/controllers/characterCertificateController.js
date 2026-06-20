const CharacterCertificateConfig = require('../models/CharacterCertificateConfig');

const DEFAULT_TEMPLATE = `TO WHOM IT MAY CONCERN

This is to certify that {{student_name}}, son/daughter of {{father_name}},
bearing Student ID {{student_id}} and Roll No. {{roll_number}}, was a
student of this institution from {{period_from}} to {{period_to}}.

Class              : {{class}} - {{section}}

During his/her entire period of study at this school, his/her conduct has
been {{conduct}} and character has been {{character}}.

He/She has been known to be sincere, disciplined, and well-behaved.

This certificate is issued at the request of the student / parent for the
purpose best known to them.`;

const getTemplate = async (req, res, next) => {
  try {
    const config = await CharacterCertificateConfig.findOne({ school: req.schoolId });
    res.json({ success: true, template: config?.template ?? DEFAULT_TEMPLATE });
  } catch (err) {
    next(err);
  }
};

const saveTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    const config = await CharacterCertificateConfig.findOneAndUpdate(
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
