import React, { useState, useEffect } from "react";

const AdministradorActualizarProducto = ({ productId, onClose, userId }) => {
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [addQuantity, setAddQuantity] = useState('');
  const [removeQuantity, setRemoveQuantity] = useState('');
  const [removalReason, setRemovalReason] = useState("");
  const [addReason, setAddReason] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:3002/products/${productId}`);
        const data = await response.json();
        setProduct(data);
        setPreviewUrl(data.imagen); // Establecer la URL de la imagen existente para vista previa
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:3002/products/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("El archivo es demasiado grande. El tamaño máximo es 5MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert("Por favor seleccione un archivo de imagen válido.");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddQuantityChange = (e) => {
    const value = e.target.value;
    setAddQuantity(value < 0 ? '' : value);
  };

  const handleRemoveQuantityChange = (e) => {
    const value = e.target.value;
    if (value <= product.cantidad) {
      setRemoveQuantity(value < 0 ? '' : value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(removeQuantity) > 0 && !removalReason) {
      alert("La razón de desagregación es requerida.");
      return;
    }

    if (Number(addQuantity) > 0 && !addReason) {
      alert("La razón de agregación es requerida.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("nombre", product.nombre);
    formDataToSend.append("cantidad", product.cantidad + (Number(addQuantity) || 0) - (Number(removeQuantity) || 0));
    formDataToSend.append("precio", product.precio);
    formDataToSend.append("descripcion", product.descripcion);
    formDataToSend.append("categoria_id", product.categoria_id);

    if (selectedFile) {
      formDataToSend.append("imagen", selectedFile);
    } else {
      formDataToSend.append("imagen", product.imagen);  // Enviar la URL de la imagen si no se seleccionó una nueva
    }

    try {
      // Actualizar producto
      await fetch(`http://localhost:3002/products/updateProduct/${productId}`, {
        method: "PUT",
        body: formDataToSend,
      });
      
    // Actualizar cantidades si se agregaron o eliminaron productos
    if (Number(addQuantity) > 0 || Number(removeQuantity) > 0) {
      await fetch(`http://localhost:3002/products/updateQuantity/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addQuantity,
          removeQuantity,
          userId,
          removalReason,
          addReason,
        }),
      });
    }

      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  if (!product || categories.length === 0) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Actualizar Producto</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Columna 1: Información básica */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={product.nombre}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desagregar Cantidad</label>
                  <input
                    type="number"
                    value={removeQuantity}
                    onChange={handleRemoveQuantityChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Ingrese cantidad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón de Desagregación</label>
                  <textarea
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>
              </div>

              {/* Columna 2: Gestión de cantidades */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Actual</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={product.cantidad}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Cantidad</label>
                  <input
                    type="number"
                    value={addQuantity}
                    onChange={handleAddQuantityChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Ingrese cantidad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón de Agregación</label>
                  <textarea
                    value={addReason}
                    onChange={(e) => setAddReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>
              </div>

              {/* Columna 3: Desagregación y descripción */}
              <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input
                    type="number"
                    name="precio"
                    value={product.precio}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    name="categoria_id"
                    value={product.categoria_id}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Vista previa de la imagen"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción completa - Ancho completo */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={product.descripcion}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Actualizar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdministradorActualizarProducto;