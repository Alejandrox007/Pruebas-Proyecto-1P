const express = require('express');
const { getAllPatients, addnewPatient, updatePatient, deletePatient } = require('../controllers/pacientes.controller');

const router = express.Router();

// Ruta GET para obtener todos los pacientes
router.get('/', getAllPatients);

// Ruta POST para crear un nuevo paciente
router.post('/', addnewPatient);

// Ruta PUT para modificar un paciente mediante su id
router.put('/:id', updatePatient);

// Ruta DELETE para eliminar un paciente mediante su id
router.delete('/:id', deletePatient);

module.exports = router;
