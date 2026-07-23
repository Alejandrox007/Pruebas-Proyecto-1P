const express = require('express');
const controller = require('../controllers/citas.controller');
const asyncHandler = require('../middleware/async-handler');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
router.get('/', asyncHandler(controller.getAppointments));
router.post('/', authorize('admin', 'client'), validate({ body: schemas.appointmentCreate }), asyncHandler(controller.createAppointment));
router.patch('/:id', validate({ params: schemas.idParams, body: schemas.appointmentUpdate }), asyncHandler(controller.updateAppointment));

module.exports = router;
