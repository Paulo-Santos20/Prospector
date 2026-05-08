import express from 'express';
import { getLeads, enrichLead, getSocials, getLeadById } from '../controllers/leadsController.js';

const router = express.Router();

router.post('/search', getLeads);
router.post('/enrich', enrichLead);
router.post('/socials', getSocials);
router.get('/:id', getLeadById);

export default router;