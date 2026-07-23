const express = require('express');
const controller = require('../controllers/medicamentos.controller');
const asyncHandler = require('../middleware/async-handler');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
router.get('/', authorize('admin', 'doctor'), validate({ query: schemas.medicineQuery }), asyncHandler(controller.getAllMedicamentos));
router.post('/', authorize('admin'), validate({ body: schemas.medicine }), asyncHandler(controller.addNewMedicamento));
router.put('/:id', authorize('admin'), validate({ params: schemas.idParams, body: schemas.medicineUpdate }), asyncHandler(controller.updateMedicamento));
router.delete('/:id', authorize('admin'), validate({ params: schemas.idParams }), asyncHandler(controller.deleteMedicamento));

module.exports = router;
