const express = require('express');
const { getAllMedicamentos, addNewMedicamento, updateMedicamento, deleteMedicamento } = require('../controllers/medicamentos.controller');

const router = express.Router();

// Ruta GET para obtener todos los medicamentos
router.get('/', getAllMedicamentos);

// Ruta POST para crear un nuevo medicamento
router.post('/', addNewMedicamento);

// Ruta PUT para modificar un medicamento mediante su id
router.put('/:id', updateMedicamento);

// Ruta DELETE para eliminar un medicamento mediante su id
router.delete('/:id', deleteMedicamento);

module.exports = router;
