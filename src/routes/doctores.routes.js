const express = require('express');
const { getAllDoctors, addNewDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctores.controller');

const router = express.Router();


// GET route to get all doctors
router.get('/', getAllDoctors);

// POST route to create a new doctor
router.post('/', addNewDoctor);

// PUT route to update a doctor by id
router.put('/:id', updateDoctor);

// DELETE route to delete a doctor by id
router.delete('/:id', deleteDoctor);

module.exports = router;

