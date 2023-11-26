const express = require('express');
const clientesController = require('../controllers/clientesController');

const router = express.Router();

// Ruta para insertar un nuevo cliente
router.post('/clientes', async (req, res) => {
  await clientesController.insertarCliente(req, res);
});

// Ruta para eliminar un cliente por id
router.delete('/clientes/:id', async (req, res) => {
  await clientesController.eliminarCliente(req, res);
});

// Ruta para obtener un cliente por id o name
router.get('/clientes/:value', async (req, res) => {
  await clientesController.obtenerCliente(req, res);
});

// Ruta para actualizar un cliente por id
router.put('/clientes/:id', async (req, res) => {
  await clientesController.updateCliente(req, res);
});

module.exports = router;
