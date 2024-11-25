const db = require('../config/conexion');
const fs = require('fs').promises; // Para manejar operaciones de archivo
const path = require('path');

// Función auxiliar para construir la URL completa de la imagen
const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `http://localhost:3002${imagePath}`;
};

// Creación de productos (modificado)
const createProduct = (req, res) => {
  const { nombre, cantidad, precio, descripcion, categoria_id } = req.body;
  const estado = "Activo";
  
  if (!req.file) {
    return res.status(400).send("Se requiere una imagen para el producto.");
  }

  // Guardar la ruta relativa de la imagen
  const imagen = `/uploads/products/${req.file.filename}`;

  db.query(
    'INSERT INTO productos (nombre, cantidad, precio, descripcion, imagen, categoria_id, estado) VALUES(?,?,?,?,?,?,?)',
    [nombre, cantidad, precio, descripcion, imagen, categoria_id, estado],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error al registrar el producto.");
      } else {
        // Devolver el producto creado con la URL completa de la imagen
        const newProduct = {
          id: result.insertId,
          nombre,
          cantidad,
          precio,
          descripcion,
          imagen: buildImageUrl(imagen),
          categoria_id,
          estado
        };
        res.status(201).json(newProduct);
      }
    }
  );
};


// Consulta específica de productos (modificado)
const specificProduct = (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM productos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al obtener el producto");
    }
    if (result.length === 0) {
      return res.status(404).send("Producto no encontrado");
    }
    
    // Construir la URL completa de la imagen
    const product = result[0];
    product.imagen = buildImageUrl(product.imagen);
    
    res.json(product);
  });
};

// Consulta de productos en estado activo (modificado)
const products = (req, res) => {
  db.query('SELECT * FROM productos WHERE estado="activo"', (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al obtener los productos");
    }
    
    // Construir las URLs completas de las imágenes
    const productsWithImages = result.map(product => ({
      ...product,
      imagen: buildImageUrl(product.imagen)
    }));
    
    res.json(productsWithImages);
  });
};

// Consulta de productos en estado inactivo (modificado)
const productsInactive = (req, res) => {
  db.query('SELECT * FROM productos WHERE estado="inactivo"', (err, result) => {
    if (err) {
      console.log("Error al consultar productos inactivos:", err);
      return res.status(500).send("Error al obtener los productos inactivos");
    }
    
    // Construir las URLs completas de las imágenes
    const productsWithImages = result.map(product => ({
      ...product,
      imagen: buildImageUrl(product.imagen)
    }));
    
    res.json(productsWithImages);
  });
};


//Activar un producto
const activateProduct = (req, res) => {
    const id = req.params.id;
    const { description, userId } = req.body;
  
    console.log("Activando producto con ID:", id);
    console.log("Descripción de la activación:", description);
    console.log("ID de usuario recibido:", userId);
  
    if (!userId) {
      return res.status(400).send("Falta el ID del usuario.");
    }
  
    db.query('UPDATE productos SET estado="activo" WHERE id=?', [id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error al actualizar el producto");
      }
  
      if (result.affectedRows > 0) {
        const insertHistoryQuery = 'INSERT INTO historial_activaciones (producto_id, descripcion, usuario_id) VALUES (?, ?, ?)';
        db.query(insertHistoryQuery, [id, description, userId], (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error al guardar el historial de activación.");
          }
          console.log("Historial de activación guardado con éxito");
          res.status(200).send("Producto activado y historial guardado con éxito.");
        });
      } else {
        res.status(404).send("Producto no encontrado");
      }
    });
  };


//Historico agregación y desagregación
const updateProductQuantity = (req, res) => {
  const id = req.params.id;
  const { 
    addQuantity, 
    removeQuantity, 
    userId, 
    removalReason,
    addReason 
  } = req.body;

  // Primero obtener la cantidad actual
  db.query('SELECT cantidad FROM productos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al obtener el producto");
    }

    if (result.length === 0) {
      return res.status(404).send("Producto no encontrado");
    }

    const currentQuantity = result[0].cantidad;
    const newQuantity = currentQuantity + (Number(addQuantity) || 0) - (Number(removeQuantity) || 0);

    // Actualizar la cantidad del producto
    db.query(
      'UPDATE productos SET cantidad = ? WHERE id = ?',
      [newQuantity, id],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Error al actualizar la cantidad");
        }

        // Registrar en el historial si hay agregación
        if (Number(addQuantity) > 0) {
          const addHistoryQuery = 'INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)';
          db.query(addHistoryQuery, [id, 'agregacion', addQuantity, addReason, userId], (err) => {
            if (err) {
              console.log(err);
              return res.status(500).send("Error al guardar el historial de agregación");
            }
          });
        }

        // Registrar en el historial si hay desagregación
        if (Number(removeQuantity) > 0) {
          const removeHistoryQuery = 'INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)';
          db.query(removeHistoryQuery, [id, 'desagregacion', removeQuantity, removalReason, userId], (err) => {
            if (err) {
              console.log(err);
              return res.status(500).send("Error al guardar el historial de desagregación");
            }
          });
        }

        res.status(200).send("Cantidad actualizada y historial guardado con éxito");
      }
    );
  });
};


// Creación de categoria
const createCategory = (req,res)=>{
  const {nombre} = req.body;

  db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al registrar la categoría.");
    } else {
      console.log(result);
      return res.status(200).send("Categoría registrada con éxito!");
    }
  });
};

// Obtener todas las categorías
const getCategories = (req, res) => {
  console.log('Obteniendo categorías');
  db.query('SELECT * FROM categorias', (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error al obtener las categorías.");
    }
    console.log("Categorías obtenidas:", result);
    res.status(200).send(result);
  });
};


// Actualizar categoría
const updateCategory = (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  db.query(
    'UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Error al actualizar la categoría.",
          error: err.message
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada."
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Categoría actualizada con éxito!"
      });
    }
  );
};


// Eliminar categoría
const deleteCategory = (req, res) => {
  const { id } = req.params;

  // Primero verificar si la categoría está en uso
  db.query(
    'SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Error al verificar el uso de la categoría.",
          error: err.message
        });
      }

      if (result[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: "No se puede eliminar la categoría porque está siendo utilizada por productos."
        });
      }

      // Si no está en uso, proceder con la eliminación
      db.query(
        'DELETE FROM categorias WHERE id = ?',
        [id],
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              success: false,
              message: "Error al eliminar la categoría.",
              error: err.message
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: "Categoría no encontrada."
            });
          }

          res.status(200).json({
            success: true,
            message: "Categoría eliminada con éxito!"
          });
        }
      );
    }
  );
};


const updateProduct = async (req, res) => {
  const id = req.params.id;
  const { 
    nombre, 
    cantidad, 
    precio, 
    descripcion, 
    categoria_id, 
    addQuantity, 
    removeQuantity, 
    addReason, 
    removalReason, 
    userId
  } = req.body;
  
  let imagen = null;

  try {
    // Verificar si hay un archivo de imagen
    if (req.file) {
      imagen = `/uploads/products/${req.file.filename}`;
      console.log("Nueva imagen recibida:", imagen);

      // Obtener la imagen anterior para borrarla
      db.query('SELECT imagen, cantidad FROM productos WHERE id = ?', [id], async (err, oldProduct) => {
        if (err) {
          console.log("Error al obtener la imagen anterior:", err);
          return res.status(500).send("Error al obtener la imagen anterior.");
        }

        if (oldProduct.length === 0) {
          return res.status(404).send("Producto no encontrado");
        }

        console.log("Imagen anterior en base de datos:", oldProduct[0].imagen);

        // Verificar si existe la imagen anterior
        if (oldProduct[0].imagen) {
          const oldImagePath = path.join(__dirname, '..', 'public', oldProduct[0].imagen);

          // Verificar si el archivo existe antes de intentar eliminarlo
          try {
            await fs.promises.access(oldImagePath); // Verifica si el archivo existe
            await fs.promises.unlink(oldImagePath); // Elimina la imagen anterior
            console.log(`Imagen antigua eliminada: ${oldImagePath}`);
          } catch (error) {
            console.log(`No se pudo eliminar la imagen anterior: ${oldImagePath}`);
          }
        }

        // Si hay cantidades a agregar o eliminar, actualizamos la cantidad
        let newQuantity = oldProduct[0].cantidad;

        if (addQuantity && addQuantity > 0) {
          newQuantity += addQuantity; // Aumentamos la cantidad
        }

        if (removeQuantity && removeQuantity > 0) {
          // Validar que no se elimine más de lo que hay en stock
          if (removeQuantity > oldProduct[0].cantidad) {
            return res.status(400).send("La cantidad a desagregar no puede ser mayor que la cantidad disponible.");
          }
          newQuantity -= removeQuantity; // Disminuimos la cantidad
        }

        // Lógica para actualizar la cantidad y la razón de la agregación o desagregación
        const updateQuery = `
          UPDATE productos 
          SET 
            nombre = ?, 
            cantidad = ?, 
            precio = ?, 
            descripcion = ?, 
            categoria_id = ? 
            ${imagen ? ', imagen = ?' : ''}
          WHERE id = ?
        `;
        const queryParams = [
          nombre, 
          newQuantity, 
          precio, 
          descripcion, 
          categoria_id,
          ...(imagen ? [imagen] : []),
          id
        ];

        console.log("Consulta SQL de actualización:", updateQuery);
        console.log("Parámetros de la consulta:", queryParams);

        // Ejecutar la consulta de actualización
        db.query(updateQuery, queryParams, (err, result) => {
          if (err) {
            console.log("Error en la actualización:", err);
            return res.status(500).send("Error al actualizar el producto.");
          }

          // Registrar el historial si hay cambios en la cantidad
          if (Number(addQuantity) > 0) {
            const addHistoryQuery = 'INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)';
            db.query(addHistoryQuery, [id, 'agregacion', addQuantity, addReason, userId], (err) => {
              if (err) {
                console.log(err);
                return res.status(500).send("Error al guardar el historial de agregación");
              }
            });
          }

          if (Number(removeQuantity) > 0) {
            const removeHistoryQuery = 'INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)';
            db.query(removeHistoryQuery, [id, 'desagregacion', removeQuantity, removalReason, userId], (err) => {
              if (err) {
                console.log(err);
                return res.status(500).send("Error al guardar el historial de desagregación");
              }
            });
          }

          // Obtener el producto actualizado para devolverlo en la respuesta
          db.query('SELECT * FROM productos WHERE id = ?', [id], (err, result) => {
            if (err) {
              console.log("Error al obtener el producto actualizado:", err);
              return res.status(500).send("Producto actualizado pero error al obtener los datos actualizados.");
            }

            console.log("Producto actualizado:", result[0]);
            const updatedProduct = result[0];
            updatedProduct.imagen = buildImageUrl(updatedProduct.imagen);
            res.json(updatedProduct);
          });
        });
      });
    } else {
      // Si no hay imagen, simplemente actualizamos la cantidad y el resto de los datos
      db.query('SELECT cantidad FROM productos WHERE id = ?', [id], (err, result) => {
        if (err) {
          console.log("Error al obtener el producto:", err);
          return res.status(500).send("Error al obtener el producto");
        }

        if (result.length === 0) {
          return res.status(404).send("Producto no encontrado");
        }

        const currentQuantity = result[0].cantidad;
        let newQuantity = currentQuantity;

        if (addQuantity && addQuantity > 0) {
          newQuantity += addQuantity; // Aumentamos la cantidad
        }

        if (removeQuantity && removeQuantity > 0) {
          // Validar que no se elimine más de lo que hay en stock
          if (removeQuantity > currentQuantity) {
            return res.status(400).send("La cantidad a desagregar no puede ser mayor que la cantidad disponible.");
          }
          newQuantity -= removeQuantity; // Disminuimos la cantidad
        }

        // Actualizamos la cantidad del producto
        const updateQuery = `
          UPDATE productos 
          SET 
            nombre = ?, 
            cantidad = ?, 
            precio = ?, 
            descripcion = ?, 
            categoria_id = ? 
          WHERE id = ?
        `;
        const queryParams = [
          nombre, 
          newQuantity, 
          precio, 
          descripcion, 
          categoria_id,
          id
        ];

        db.query(updateQuery, queryParams, (err) => {
          if (err) {
            console.log("Error al actualizar el producto", err);
            return res.status(500).send("Error al actualizar el producto");
          }

          // Registrar en el historial si hay agregación
          if (Number(addQuantity) > 0) {
            const addHistoryQuery = 'INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)';
            db.query(addHistoryQuery, [id, 'agregacion', addQuantity, addReason, userId], (err) => {
              if (err) {
                console.log(err);
                return res.status(500).send("Error al guardar el historial de agregación");
              }
            });
          }

          // Registrar en el historial si hay desagregación
          if (Number(removeQuantity) > 0) {
            const removeHistoryQuery = 'INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)';
            db.query(removeHistoryQuery, [id, 'desagregacion', removeQuantity, removalReason, userId], (err) => {
              if (err) {
                console.log(err);
                return res.status(500).send("Error al guardar el historial de desagregación");
              }
            });
          }

          res.status(200).send("Producto actualizado con éxito y cantidad modificada.");
        });
      });
    }
  } catch (error) {
    console.log("Error al actualizar el producto:", error);
    res.status(500).send("Error al actualizar el producto.");
  }
};




//Inactivación de un producto
const inactivateProduct = (req, res) => {
    const id = req.params.id;
    const { userId, description } = req.body;
  
    console.log("Datos recibidos en el backend:", { userId, description });

    console.log("Inactivando producto con ID:", id);
    console.log("Descripción de la inactivación:", description);
    console.log("ID de usuario recibido:", userId);
  
    if (!userId) {
      return res.status(400).send("Falta el ID del usuario.");
    }
  
    db.query('UPDATE productos SET estado="Inactivo" WHERE id=?', [id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error al actualizar el producto");
      }
  
      if (result.affectedRows > 0) {
        const insertHistoryQuery = 'INSERT INTO historial_inactivaciones (producto_id, descripcion, usuario_id) VALUES (?, ?, ?)';
        db.query(insertHistoryQuery, [id, description, userId], (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error al guardar el historial de inactivación.");
          }
          console.log("Historial de inactivación guardado con éxito");
          res.status(200).send("Producto inactivado y historial guardado con éxito.");
        });
      } else {
        res.status(404).send("Producto no encontrado");
      }
    });
  };


module.exports = {
    createProduct,
    specificProduct,
    products,
    updateProduct,
    inactivateProduct,
    productsInactive,
    activateProduct,
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    updateProductQuantity
}