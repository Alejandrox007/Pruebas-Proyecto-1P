const express = require('express');
const controller = require('../controllers/doctores.controller');
const asyncHandler = require('../middleware/async-handler');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
router.get('/', asyncHandler(controller.getAllDoctors));
router.post('/', authorize('admin'), validate({ body: schemas.doctorCreate }), asyncHandler(controller.addNewDoctor));
router.put('/:id', authorize('admin'), validate({ params: schemas.idParams, body: schemas.doctorUpdate }), asyncHandler(controller.updateDoctor));
router.delete('/:id', authorize('admin'), validate({ params: schemas.idParams }), asyncHandler(controller.deleteDoctor));

module.exports = router;
