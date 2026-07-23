const express = require('express');
const controller = require('../controllers/pacientes.controller');
const asyncHandler = require('../middleware/async-handler');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
router.get('/', asyncHandler(controller.getAllPatients));
router.put('/:id', authorize('admin', 'client'), validate({ params: schemas.idParams, body: schemas.patientUpdate }), asyncHandler(controller.updatePatient));
router.delete('/:id', authorize('admin'), validate({ params: schemas.idParams }), asyncHandler(controller.deletePatient));

module.exports = router;
