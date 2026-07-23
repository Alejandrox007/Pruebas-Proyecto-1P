const express = require('express');
const controller = require('../controllers/especialidades.controller');
const asyncHandler = require('../middleware/async-handler');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
router.get('/', asyncHandler(controller.getAllSpecialties));
router.post('/', authorize('admin'), validate({ body: schemas.specialty }), asyncHandler(controller.addnewSpecialty));
router.put('/:id', authorize('admin'), validate({ params: schemas.idParams, body: schemas.specialty }), asyncHandler(controller.updateSpecialty));
router.delete('/:id', authorize('admin'), validate({ params: schemas.idParams }), asyncHandler(controller.deleteSpecialty));

module.exports = router;
