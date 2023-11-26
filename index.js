const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db');
const clientesRoutes = require('./routes/clientesRoutes');
const cors = require('cors');
const app = express();
const port = 3000;


app.use(bodyParser.json());

app.use(cors());

app.use(clientesRoutes);

app.post('/cargos', (req, res) => {
  // ... (manejar cargos)
});

app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
});
