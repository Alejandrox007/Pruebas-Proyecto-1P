const express = require('express');
const controller = require('../controllers/recetas.controller');
const asyncHandler = require('../middleware/async-handler');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
router.get('/', asyncHandler(controller.getPrescriptions));
router.post('/', authorize('doctor'), validate({ body: schemas.prescriptionCreate }), asyncHandler(controller.createPrescription));

module.exports = router;
