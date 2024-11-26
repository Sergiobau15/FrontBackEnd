const db = require("../config/conexion");

const createOrder = (req, res) => {
  const { nombre, numero, direccion, metodo, productos, user_id } = req.body; // Obtener user_id de la solicitud
  
  console.log("Datos del pedido:", req.body);

  // Validar que todos los datos necesarios están presentes
  if (!nombre || !numero || !direccion || !metodo || !productos || productos.length === 0 || !user_id) {
    console.error("Faltan datos en el pedido");
    return res.status(400).send("Faltan datos en el pedido.");
  }

  // Iniciar la transacción
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err);
      return res.status(500).send("Error al iniciar transacción.");
    }

    // Insertar el pedido en la tabla 'pedido', ahora con user_id
    db.query(
      'INSERT INTO pedido (Nombre, Numero, Direccion, Metodo, user_id) VALUES (?, ?, ?, ?, ?)', // Incluir user_id
      [nombre, numero, direccion, metodo, user_id],
      (err, results) => {
        if (err) {
          console.error("Error al registrar el pedido:", err);
          return db.rollback(() => {
            res.status(500).send("Error al registrar el pedido");
          });
        }

        const pedidoId = results.insertId;
        console.log("Pedido creado con ID:", pedidoId);

        // Preparar los productos para el detalle del pedido
        const values = productos.map(producto => [
          pedidoId,
          producto.producto_id,
          producto.cantidad,
          producto.precio_unitario,
          producto.cantidad * producto.precio_unitario
        ]);

        const sql = 'INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, precio_total) VALUES ?';

        // Insertar productos en la tabla 'detalle_pedido'
        db.query(sql, [values], (err, results) => {
          if (err) {
            console.error("Error al insertar productos del pedido:", err);
            return db.rollback(() => {
              res.status(500).send("Error al registrar los productos del pedido.");
            });
          }

          console.log("Productos del pedido insertados");

          // Actualizar la cantidad de los productos
          productos.forEach(producto => {
            const sqlUpdate = 'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?';
            db.query(sqlUpdate, [producto.cantidad, producto.producto_id], (err, results) => {
              if (err) {
                console.error("Error al actualizar la cantidad del producto:", err);
                return db.rollback(() => {
                  res.status(500).send("Error al actualizar las cantidades de los productos.");
                });
              }

              console.log(`Producto ${producto.producto_id} actualizado con éxito`);
            });
          });

          // Confirmar la transacción
          db.commit((err) => {
            if (err) {
              console.error("Error al confirmar la transacción:", err);
              return db.rollback(() => {
                res.status(500).send("Error al registrar el pedido y sus productos.");
              });
            }

            console.log("Transacción confirmada");
            res.status(201).send("Pedido y productos registrados con éxito.");
          });
        });
      }
    );
  });
};




const createOrdercar = (req, res) => {
  const { user_id, nombre, numero, direccion, metodo, fecha, estado, productos } = req.body;

  // Verificar si el ID del usuario está presente
  if (!user_id) {
    return res.status(401).send('No estás autenticado. Inicia sesión para realizar un pedido.');
  }

  // Validar que los datos necesarios estén presentes
  if (!nombre || !numero || !direccion || !metodo || !fecha || !productos || productos.length === 0) {
    return res.status(400).send('Faltan datos en el pedido.');
  }

  // Iniciar la transacción
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).send('Error al iniciar transacción.');
    }

    // Registrar el pedido en la tabla "pedido"
    db.query(
      'INSERT INTO pedido (nombre, numero, direccion, metodo, fecha, estado, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, numero, direccion, metodo, fecha, estado, user_id],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).send('Error al registrar el pedido.');
          });
        }

        const pedidoId = results.insertId;

        // Preparar los valores para insertar los productos del pedido
        const values = productos.map(producto => [
          pedidoId,
          producto.producto_id,
          producto.cantidad,
          producto.precio_unitario,
          producto.precio_total,
          producto.estado || 'Activo',
        ]);

        // Insertar los productos del pedido en la tabla "detalle_pedido"
        const sql = 'INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, precio_total, estado) VALUES ?';

        db.query(sql, [values], (err, results) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).send('Error al registrar los productos del pedido.');
            });
          }

          // Descontar el stock de los productos
          let stockError = false;
          productos.forEach((producto, index) => {
            const updateStockSql = 'UPDATE productos SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?';
            db.query(updateStockSql, [producto.cantidad, producto.producto_id, producto.cantidad], (err, results) => {
              if (err) {
                stockError = true;
                return db.rollback(() => {
                  res.status(500).send('Error al actualizar el stock del producto.');
                });
              }

              if (results.affectedRows === 0) {
                stockError = true;
                return db.rollback(() => {
                  res.status(400).send('No hay suficiente stock para algunos productos.');
                });
              }

              if (index === productos.length - 1 && !stockError) {
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).send('Error al registrar el pedido y sus productos.');
                    });
                  }

                  res.status(201).send('Pedido y productos registrados con éxito.');
                });
              }
            });
          });

          // Si hay error con el stock, revertimos la transacción
          if (stockError) {
            db.rollback(() => {
              res.status(500).send('Error al procesar los productos o el stock.');
            });
          }
        });
      }
    );
  });
};


// Función para obtener todos los pedidos y sus productos
const orders = (req, res) => {
  const query = `
    SELECT o.id, o.Nombre, o.Numero, o.Direccion, o.Metodo, o.Fecha, 
           SUM(dp.cantidad * dp.precio_unitario) AS Total
    FROM pedido o
    JOIN detalle_pedido dp ON o.id = dp.pedido_id
    WHERE o.estado = 'activo'  -- Solo seleccionar pedidos con estado 'activo'
    GROUP BY o.id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la consulta' });
    }

    // Obtener los productos de cada pedido
    const ordersWithProductsPromises = results.map((order) => {
      return new Promise((resolve, reject) => {
        db.query(
          'SELECT p.id, p.nombre, dp.cantidad, dp.precio_unitario, dp.precio_total FROM detalle_pedido dp JOIN productos p ON dp.producto_id = p.id WHERE dp.pedido_id = ?', 
          [order.id],
          (err, products) => {
            if (err) {
              return reject(err);
            }
            order.products = products; // Añadir productos al pedido
            resolve(order);
          }
        );
      });
    });

    // Esperar a que todos los pedidos y productos estén listos
    Promise.all(ordersWithProductsPromises)
      .then((ordersWithProducts) => {
        res.json(ordersWithProducts); // Enviar pedidos con productos
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Error al obtener los productos');
      });
  });
};

  
// Función para obtener un pedido específico por ID
const getOrdersByUserId = (req, res) => {
  const { userId } = req.params;
  console.log('Received userId in backend:', userId);

  const query = `
  SELECT 
    p.id,
    p.Nombre AS Nombres,
    p.Numero AS Telefono,
    p.Direccion,
    p.Metodo AS paymentMethod,
    p.Fecha AS orderDate,
    p.estado AS status,
    (SELECT SUM(dp.precio_Total) 
     FROM Detalle_Pedido dp 
     WHERE dp.pedido_Id = p.id) AS totalPrice,
    (
      SELECT CONCAT('[', 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', pr.id, 
            'nombre', pr.nombre, 
            'precio', dp.precio_Unitario,
            'quantityToAdd', dp.cantidad
          )
        ), 
      ']')
      FROM Detalle_Pedido dp
      JOIN Productos pr ON dp.producto_Id = pr.id
      WHERE dp.pedido_Id = p.id
    ) as products
  FROM Pedido p
  WHERE p.user_id = ? 
    AND LOWER(p.estado) = 'activo'
`;


  db.query(query, [userId], (err, orders) => {
    if (err) {
      console.error('SQL Error details:', {
        message: err.message,
        code: err.code,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage
      });
      return res.status(500).json({ 
        message: 'Error al obtener los pedidos',
        error: err.message 
      });
    }

    console.log('Total orders found:', orders.length);
    console.log('Raw orders:', JSON.stringify(orders, null, 2));

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pedidos para este usuario' });
    }

    // Parsear los productos si es necesario
    const parsedOrders = orders.map(order => ({
      ...order,
      products: order.products ? JSON.parse(order.products) : [],
      totalPrice: parseFloat(order.totalPrice || 0).toFixed(2)
    }));

    res.json(parsedOrders);
  });
};
// Función para eliminar un pedido y sus productos
const deleteOrder = (req, res) => {
  const { id } = req.params;

  // Iniciar transacción
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err);
      return res.status(500).send("Error al iniciar transacción.");
    }

    // Actualizar el estado del pedido a "inactivo"
    db.query('UPDATE pedido SET estado = ? WHERE id = ?', ['inactivo', id], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error al actualizar el estado del pedido:", err);
          res.status(500).send("Error al actualizar el estado del pedido.");
        });
      }

      // Actualizar el estado de los productos del pedido a "inactivo"
      db.query('UPDATE detalle_pedido SET estado = ? WHERE pedido_id = ?', ['inactivo', id], (err, results) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error al actualizar el estado de los productos del pedido:", err);
            res.status(500).send("Error al actualizar el estado de los productos.");
          });
        }

        // Confirmar la transacción si todo está bien
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error al confirmar la transacción:", err);
              res.status(500).send("Error al confirmar la transacción.");
            });
          }
          res.status(200).send("Pedido y productos actualizados a inactivos.");
        });
      });
    });
  });
};

// Función para editar un pedido (solo los campos Nombre, Numero, Direccion, Metodo)
const editOrder = (req, res) => {
  const { id } = req.params;  // Obtener el ID de la URL
  const { Nombre, Numero, Direccion, Metodo } = req.body;

  // Validar que los campos necesarios estén presentes
  if (!Nombre || !Numero || !Direccion || !Metodo) {
    return res.status(400).json({ message: "Faltan datos para actualizar el pedido." });
  }

  // Realizar la actualización del pedido
  const query = 'UPDATE pedido SET Nombre = ?, Numero = ?, Direccion = ?, Metodo = ? WHERE id = ?';

  db.query(query, [Nombre, Numero, Direccion, Metodo, id], (err, results) => {
    if (err) {
      console.error("Error al actualizar el pedido:", err);
      return res.status(500).json({ message: "Error al actualizar el pedido." });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    console.log("Pedido actualizado con éxito");
    res.status(200).json({ message: "Pedido actualizado con éxito." });
  });
};



module.exports = {
  createOrder,
  createOrdercar,
  orders,
  getOrdersByUserId,
  deleteOrder,
  editOrder
};
