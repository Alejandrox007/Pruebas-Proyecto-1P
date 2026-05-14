const express = require('express');
// importo funciones del controller 
const {getAllSpecialties, addnewSpecialty, updateSpecialty, deleteSpecialty} = require('../controllers/especialidades.controller');

const router = express.Router();

//rutas /api/especialidades/ para get y post
//rutas /api/especialidades/:id para put y delete


// ruta GET para obtener todas las especialidades
router.get('/', getAllSpecialties);

// Ruta POST para crear nueva especialidad
router.post('/', addnewSpecialty);

// Ruta PUT para modificar especialidad mediante su id
router.put('/:id', updateSpecialty);

// Ruta DELETE para eliminar especialidad mediante su id
router.delete('/:id', deleteSpecialty);

module.exports = router;