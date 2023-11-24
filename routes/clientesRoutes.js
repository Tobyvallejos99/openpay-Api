
const express = require('express');
const clientesController = require('../controllers/clientesController');

const router = express.Router();

router.post('/clientes', async (req, res) => {
  await clientesController.insertarCliente(req, res);
});

router.delete('/clientes/:id', async (req, res) => {
  await clientesController.eliminarCliente(req, res);
});

router.get('/clientes/:id', async (req, res) => {
  await clientesController.obtenerCliente(req, res);
});

router.put('/clientes/:id', async (req, res) => {
  const clienteId = req.params.id;
  const nuevoCliente = req.body; // Obtén los datos del cuerpo de la solicitud

  await clientesController.updateCliente(req, res); // Pasa req y res como parámetros
});

module.exports = router;
