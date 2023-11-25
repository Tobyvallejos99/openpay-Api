const db = require('../config/db');

async function insertarCliente(req, res) {
  const cliente = req.body;

  try {
    const clienteExistente = await verificarClienteExistente(cliente.id);

    if (clienteExistente) {
      console.log('El cliente ya está registrado.');
      res.status(400).send('El cliente ya está registrado');
      return;
    }

    const addressId = await insertAddress(cliente.address);
    const storeId = await insertStore(cliente.store);

    await insertCliente(cliente, addressId, storeId);

    console.log('Cliente insertado correctamente.');
    res.status(201).send('Cliente creado exitosamente');
  } catch (err) {
    console.error('Error al insertar cliente: ', err);
    res.status(500).send('Error interno del servidor');
  }
}

async function verificarClienteExistente(clienteId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.length > 0);
      }
    });
  });
}

async function eliminarCliente(req, res) {
  const clienteId = req.params.id;

  try {
    const clienteInfo = await getClienteInfo(clienteId);

    if (!clienteInfo) {
      console.log('Cliente no encontrado.');
      res.status(404).send('Cliente no encontrado');
      return;
    }

    await deleteCliente(clienteId, clienteInfo.address_id, clienteInfo.store_id);

    console.log('Cliente eliminado correctamente.');
    res.status(200).send('Cliente eliminado exitosamente');
  } catch (err) {
    console.error('Error al eliminar cliente: ', err);
    res.status(500).send('Error interno del servidor');
  }
}

async function getClienteInfo(clienteId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, result) => {
      if (err) reject(err);
      if (result.length === 0) resolve(null);
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

async function deleteCliente(clienteId, addressId, storeId) {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) reject(err);

      db.query('DELETE FROM clientes WHERE id = ?', [clienteId], (err) => {
        if (err) {
          db.rollback(() => {
            reject(err);
          });
        }

        db.query('DELETE FROM address WHERE id = ?', [addressId], (err) => {
          if (err) {
            db.rollback(() => {
              reject(err);
            });
          }

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

async function insertAddress(address) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO address SET ?', address, (err, result) => {
      if (err) reject(err);
      resolve(result.insertId);
    });
  });
}

async function insertStore(store) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO store SET ?', store, (err, result) => {
      if (err) reject(err);
      resolve(result.insertId);
    });
  });
}

async function insertCliente(cliente) {
  return new Promise(async (resolve, reject) => {
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
      address,
      store,
    } = cliente;

    try {
      // Insertar la dirección
      const addressId = await insertAddress(address);

      // Insertar la tienda
      const storeId = await insertStore(store);

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

      db.query('INSERT INTO clientes SET ?', clienteData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function obtenerCliente(req, res) {
  const clienteId = req.params.id;

  try {
    const cliente = await getCliente(clienteId);

    if (!cliente) {
      console.log('Cliente no encontrado.');
      res.status(404).send('Cliente no encontrado');
      return;
    }

    res.status(200).json(cliente);
  } catch (err) {
    console.error('Error al obtener cliente: ', err);
    res.status(500).send('Error interno del servidor');
  }
}

async function getCliente(clienteId) {
  return new Promise(async (resolve, reject) => {
    try {
      const clienteInfo = await queryClienteInfo(clienteId);
      if (!clienteInfo) {
        resolve(null);
        return;
      }

      const addressInfo = await queryAddressInfo(clienteInfo.address_id);
      const storeInfo = await queryStoreInfo(clienteInfo.store_id);

      resolve({
        id: clienteInfo.id,
        name: clienteInfo.name,
        creation_date: clienteInfo.creation_date,
        last_name: clienteInfo.last_name,
        email: clienteInfo.email,
        phone_number: clienteInfo.phone_number,
        status: clienteInfo.status,
        balance: clienteInfo.balance,
        address: addressInfo,
        store: storeInfo,
        clabe: clienteInfo.clabe,
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function queryClienteInfo(clienteId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, result) => {
      if (err) reject(err);
      resolve(result.length > 0 ? result[0] : null);
    });
  });
}

async function queryAddressInfo(addressId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM address WHERE id = ?', [addressId], (err, result) => {
      if (err) reject(err);
      resolve(result.length > 0 ? result[0] : null);
    });
  });
}

async function queryStoreInfo(storeId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM store WHERE id = ?', [storeId], (err, result) => {
      if (err) reject(err);
      resolve(result.length > 0 ? result[0] : null);
    });
  });
}

async function updateCliente(req, res) {
  const clienteId = req.params.id;
  const nuevoCliente = req.body;

  try {
    const clienteExistente = await verificarClienteExistente(clienteId);

    if (!clienteExistente) {
      console.log('Cliente no encontrado.');
      res.status(404).send('Cliente no encontrado');
      return;
    }

    if (!nuevoCliente || typeof nuevoCliente !== 'object' || !('id' in nuevoCliente) || nuevoCliente.id === undefined) {
      console.log('Datos del cliente no válidos.');
      res.status(400).send('Datos del cliente no válidos');
      return;
    }

    const { address, store, ...datosCliente } = nuevoCliente;

    const setClienteClause = Object.keys(datosCliente).map(key => `${key} = ?`).join(', ');
    const valuesCliente = Object.values(datosCliente);
    valuesCliente.push(clienteId);

    await db.query(`UPDATE clientes SET ${setClienteClause} WHERE id = ?`, valuesCliente);

    if (address) {
      if (address.id) {
        const addressExistente = await verificarAddressExistente(address.id);

        if (addressExistente) {
          await updateAddress(address.id, address);
          console.log('Dirección actualizada correctamente.');
        } else {
          console.log('Dirección no encontrada.');
          res.status(404).send('Dirección no encontrada');
          return;
        }
      } else {
        console.log('ID de dirección no proporcionado.');
      }
    }

    if (store) {
      if (store.id) {
        const storeExistente = await verificarTiendaExistente(store.id);

        if (storeExistente) {
          await updateStore(store.id, store);
          console.log('Tienda actualizada correctamente.');
        } else {
          console.log('Tienda no encontrada.');
          res.status(404).send('Tienda no encontrada');
          return;
        }
      } else {
        console.log('ID de tienda no proporcionado.');
      }
    }

    console.log('Cliente actualizado correctamente.');
    res.status(200).send('Cliente actualizado correctamente.');
  } catch (err) {
    console.error('Error al actualizar cliente: ', err);
    res.status(500).send('Error interno del servidor');
  }
}

async function verificarAddressExistente(addressId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM address WHERE id = ?', [addressId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.length > 0);
      }
    });
  });
}

async function verificarTiendaExistente(tiendaId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM store WHERE id = ?', [tiendaId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.length > 0);
      }
    });
  });
}

async function updateAddress(addressId, addressData) {
  return new Promise((resolve, reject) => {
    db.query('UPDATE address SET ? WHERE id = ?', [addressData, addressId], (err, result) => {
      if (err) reject(err);
      resolve(result.affectedRows > 0); // Verificar si alguna fila fue afectada
    });
  });
}

async function updateStore(storeId, storeData) {
  return new Promise((resolve, reject) => {
    db.query('UPDATE store SET ? WHERE id = ?', [storeData, storeId], (err, result) => {
      if (err) reject(err);
      resolve(result.affectedRows > 0); // Verificar si alguna fila fue afectada
    });
  });
}

module.exports = {
  insertarCliente,
  eliminarCliente,
  updateCliente,
  obtenerCliente,
};
