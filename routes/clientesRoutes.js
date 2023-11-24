// routes/clientesRoutes.js
const express = require('express');
const clientesController = require('../controllers/clientesController');

const router = express.Router();

router.post('/clientes', async (req, res) => {
  await clientesController.insertarCliente(req, res);
});

router.delete('/clientes/:id', async (req, res) => {
  await clientesController.eliminarCliente(req, res);
});

router.put('/clientes/:id', async (req, res) => {
  await clientesController.updateCliente(req, res);
});


router.put('/clientes/:id', async (req, res) => {
  const clienteId = req.params.id;
  const nuevoCliente = req.body;

  try {
    await clientesController.updateCliente(clienteId, nuevoCliente, res); // Pasa res como parámetro
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Agrega más rutas según tus necesidades

module.exports = router;
