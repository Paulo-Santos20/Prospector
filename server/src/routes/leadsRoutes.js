import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { leadIdSchema, searchSchema } from '../schemas/lead.js';
import {
  getLeads,
  streamLeads,
  enrichLead,
  getLeadById,
  getProviderStatus,
} from '../controllers/leadsController.js';

const router = Router();

router.get('/provider-status', getProviderStatus);
router.post('/search', validate(searchSchema), getLeads);
router.post('/search/stream', validate(searchSchema), streamLeads);
router.post('/enrich', validate(leadIdSchema), enrichLead);
router.get('/:id', validate(leadIdSchema, 'params'), getLeadById);

export default router;
