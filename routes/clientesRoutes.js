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

// Agrega más rutas según tus necesidades

module.exports = router;
