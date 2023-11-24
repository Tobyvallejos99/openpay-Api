const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Configurar conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'openpaydb',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos: ', err);
  } else {
    console.log('Conexión exitosa a la base de datos.');
  }
});

// Rutas CRUD para clientes
app.post('/clientes', async (req, res) => {
  const cliente = req.body;

  try {
    // Insertar en la tabla address
    const addressId = await insertAddress(cliente.address);

    // Insertar en la tabla store
    const storeId = await insertStore(cliente.store);

    // Insertar en la tabla clientes con las claves foráneas
    await insertCliente(cliente, addressId, storeId);

    console.log('Cliente insertado correctamente.');
    res.status(201).send('Cliente creado exitosamente');
  } catch (err) {
    console.error('Error al insertar cliente: ', err);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para eliminar un cliente y sus datos relacionados
app.delete('/clientes/:id', async (req, res) => {
  const clienteId = req.params.id;

  try {
    // Obtener la información del cliente para obtener los IDs relacionados
    const clienteInfo = await getClienteInfo(clienteId);

    if (!clienteInfo) {
      // El cliente no está registrado
      console.log('Cliente no encontrado.');
      res.status(404).send('Cliente no encontrado');
      return;
    }

    // Eliminar el cliente y sus datos relacionados
    await deleteCliente(clienteId, clienteInfo.address_id, clienteInfo.store_id);

    console.log('Cliente eliminado correctamente.');
    res.status(200).send('Cliente eliminado exitosamente');
  } catch (err) {
    console.error('Error al eliminar cliente: ', err);
    res.status(500).send('Error interno del servidor');
  }
});

// Función para obtener la información del cliente (incluyendo IDs relacionados)
function getClienteInfo(clienteId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, result) => {
      if (err) reject(err);
      if (result.length === 0) resolve(null); // Cliente no encontrado
      else {
        const clienteInfo = result[0];
        resolve({
          address_id: clienteInfo.address_id,
          store_id: clienteInfo.store_id
        });
      }
    });
  });
}

// Función para eliminar un cliente y sus datos relacionados
function deleteCliente(clienteId, addressId, storeId) {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) reject(err);

      // Eliminar en la tabla clientes
      db.query('DELETE FROM clientes WHERE id = ?', [clienteId], (err) => {
        if (err) {
          db.rollback(() => {
            reject(err);
          });
        }

        // Eliminar en la tabla address
        db.query('DELETE FROM address WHERE id = ?', [addressId], (err) => {
          if (err) {
            db.rollback(() => {
              reject(err);
            });
          }

          // Eliminar en la tabla store
          db.query('DELETE FROM store WHERE id = ?', [storeId], (err) => {
            if (err) {
              db.rollback(() => {
                reject(err);
              });
            }

            db.commit((err) => {
              if (err) {
                db.rollback(() => {
                  reject(err);
                });
              }

              resolve();
            });
          });
        });
      });
    });
  });
}

// Función para obtener la información del cliente (incluyendo IDs relacionados)
function getClienteInfo(clienteId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, result) => {
      if (err) reject(err);
      if (result.length === 0) resolve(null); // Cliente no encontrado
      else {
        const clienteInfo = result[0];
        resolve({
          address_id: clienteInfo.address_id,
          store_id: clienteInfo.store_id
        });
      }
    });
  });
}

// Función para insertar en la tabla address
function insertAddress(address) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO address SET ?', address, (err, result) => {
      if (err) reject(err);
      resolve(result.insertId);
    });
  });
}

// Función para insertar en la tabla store
function insertStore(store) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO store SET ?', store, (err, result) => {
      if (err) reject(err);
      resolve(result.insertId);
    });
  });
}

// Función para insertar en la tabla clientes
function insertCliente(cliente, addressId, storeId) {
  return new Promise((resolve, reject) => {
    const {
      id,
      creation_date,
      name,
      last_name,
      email,
      phone_number,
      external_id,
      status,
      balance,
      clabe,
    } = cliente;

    const clienteData = {
      id,
      creation_date,
      name,
      last_name,
      email,
      phone_number,
      external_id,
      status,
      balance,
      address_id: addressId,
      store_id: storeId,
      clabe,
    };

    // Verificar si el cliente ya existe
    db.query('SELECT * FROM clientes WHERE id = ?', [id], (err, result) => {
      if (err) {
        reject(err);
      } else if (result.length > 0) {
        // Cliente ya existe, enviar un mensaje de error
        reject('El cliente ya está registrado');
      } else {
        // Insertar el cliente si no existe
        db.query('INSERT INTO clientes SET ?', clienteData, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      }
    });
  });
}

// Resto de las rutas CRUD para clientes...

// Ruta para generar cargos
app.post('/cargos', (req, res) => {
  const cargo = req.body;
  db.query('INSERT INTO cargos SET ?', cargo, (err, result) => {
    if (err) {
      console.error('Error al insertar cargo: ', err);
      res.status(500).send('Error interno del servidor');
    } else {
      console.log('Cargo insertado correctamente.');
      res.status(201).send('Cargo creado exitosamente');
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
});
