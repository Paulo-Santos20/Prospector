import express from 'express';
import { getLeads, enrichLead, getSocials, getLeadById, getProviderStatus } from '../controllers/leadsController.js';

const router = express.Router();

router.get('/provider-status', getProviderStatus);
router.post('/search', getLeads);
router.post('/enrich', enrichLead);
router.post('/socials', getSocials);
router.get('/:id', getLeadById);

export default router;