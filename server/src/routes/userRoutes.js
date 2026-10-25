import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../schemas/user.js';
import { getMe, updateMe } from '../controllers/userController.js';

const router = Router();

router.get('/me', getMe);
router.put('/me', validate(updateMeSchema), updateMe);

export default router;
