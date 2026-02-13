import express from 'express';
import { getLeads } from '../controllers/leadsController.js'; // Importante o .js

const router = express.Router();

router.post('/search', getLeads);

export default router;