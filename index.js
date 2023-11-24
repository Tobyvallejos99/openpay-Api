// index.js
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db');
const clientesRoutes = require('./routes/clientesRoutes');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Configuración de la conexión a MySQL (omitida aquí, ya que está en db.js)

// Rutas CRUD para clientes
app.use(clientesRoutes);

// Resto de las rutas CRUD para clientes...

// Ruta para generar cargos
app.post('/cargos', (req, res) => {
  // ... (manejar cargos)
});

app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
});
