const db = require('../config/db');

async function insertarCliente(req, res) {
  const cliente = req.body;

  try {
    // Verificar si el cliente ya está registrado
    const clienteExistente = await verificarClienteExistente(cliente.id);

    if (clienteExistente) {
      console.log('El cliente ya está registrado.');
      res.status(400).send('El cliente ya está registrado');
      return;
    }

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
}

async function getClienteInfo(clienteId) {
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

async function deleteCliente(clienteId, addressId, storeId) {
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

async function insertCliente(cliente, addressId, storeId) {
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

    db.query('SELECT * FROM clientes WHERE id = ?', [id], (err, result) => {
      if (err) {
        reject(err);
      } else if (result.length > 0) {
        reject('El cliente ya está registrado');
      } else {
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
        resolve(null); // Cliente no encontrado
        return;
      }

      // Obtener información detallada de la tabla 'address'
      const addressInfo = await queryAddressInfo(clienteInfo.address_id);

      // Obtener información detallada de la tabla 'store'
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
        address: addressInfo, // Agregar información detallada de 'address'
        store: storeInfo,     // Agregar información detallada de 'store'
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

    const { address, store, ...datosCliente } = nuevoCliente;
    const setClause = Object.keys(datosCliente).map(key => `${key} = ?`).join(', ');
    const values = Object.values(datosCliente);
    values.push(clienteId);

    console.log('UPDATE clientes SET', setClause, 'WHERE id = ?', values);
    await db.query(`UPDATE clientes SET ${setClause} WHERE id = ?`, values);

    if (address) {
      const addressExistente = await verificarAddressExistente(nuevoCliente.address_id);

      if (addressExistente) {
        await updateAddress(nuevoCliente.address_id, address);
      } else {
        console.log('Dirección no encontrada.');
        res.status(404).send('Dirección no encontrada');
        return;
      }
    }

    if (store) {
      await updateStore(nuevoCliente.store_id, store);
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



async function updateAddress(addressId, newAddress) {
  try {
    // Verificar si la dirección existe
    const addressExistente = await verificarAddressExistente(addressId);

    if (!addressExistente) {
      console.log('Dirección no encontrada.');
      throw new Error('Dirección no encontrada');
    }

    // Extraer las propiedades street, city, state, y zipcode
    const { street, city, state, zipcode } = newAddress;

    // Construir la parte de SET de la consulta SQL
    const setClause = 'street = ?, city = ?, state = ?, zipcode = ?';

    // Construir los valores a actualizar
    const values = [street, city, state, zipcode, addressId];

    // Imprimir la consulta SQL y los valores (para propósitos de depuración)
    console.log('UPDATE address SET', setClause, 'WHERE id = ?', values);

    // Realizar la actualización en la tabla address
    await db.query(`UPDATE address SET ${setClause} WHERE id = ?`, values);

    console.log('Dirección actualizada correctamente.');
  } catch (err) {
    console.error('Error al actualizar dirección: ', err);
    throw err;
  }
}


async function updateStore(storeId, newStore) {
  return new Promise((resolve, reject) => {
    db.query('UPDATE store SET ? WHERE id = ?', [newStore, storeId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = {
  insertarCliente,
  eliminarCliente,
  updateCliente,
  obtenerCliente,
};