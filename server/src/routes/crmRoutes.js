import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { crmCreateSchema, crmUpdateSchema } from '../schemas/crm.js';
import { leadIdSchema, leadLeadIdSchema } from '../schemas/lead.js';
import {
  saveToCRM,
  getCRMLeads,
  updateCRMLead,
  updateCRMLeadByLeadId,
  deleteCRMLead,
} from '../controllers/crmController.js';

const router = Router();

router.get('/', getCRMLeads);
router.post('/', validate(crmCreateSchema), saveToCRM);
router.patch(
  '/by-lead/:leadId',
  validate(leadLeadIdSchema, 'params'),
  validate(crmUpdateSchema),
  updateCRMLeadByLeadId
);
router.patch('/:id', validate(leadIdSchema, 'params'), validate(crmUpdateSchema), updateCRMLead);
router.delete('/:id', validate(leadIdSchema, 'params'), deleteCRMLead);

export default router;
