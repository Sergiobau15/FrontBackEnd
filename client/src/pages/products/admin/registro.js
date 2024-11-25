import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/AdminLayout";
import StoreKeeperLayout from "../../../components/StoreKeeperLayout";
import Axios from "axios";

// Formulario de Producto Component
const ProductoForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    cantidad: "",
    precio: "",
    descripcion: "",
    categoria: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]); // Para almacenar las categorías
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const userSession = sessionStorage.getItem("usuario");
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      setUserRole(sessionData.Rol);
    }
  }, []);

  useEffect(() => {
    Axios.get("http://localhost:3002/products/categories")
      .then((response) => {
        console.log("Categorías recibidas:", response.data); // Agregamos log
        setCategories(response.data);
      })
      .catch((error) => {
        console.error("Error completo:", error); // Mostramos error completo
        setMessage("Error al cargar las categorías"); // Mostramos mensaje al usuario
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage("El archivo es demasiado grande. El tamaño máximo es 5MB.");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage("Por favor seleccione un archivo de imagen válido.");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage("Por favor seleccione una imagen");
      return;
    }
  
    const formDataToSend = new FormData();
    formDataToSend.append("nombre", formData.nombre);
    formDataToSend.append("cantidad", formData.cantidad);
    formDataToSend.append("precio", formData.precio);
    formDataToSend.append("descripcion", formData.descripcion);
    formDataToSend.append("categoria_id", formData.categoria);
    formDataToSend.append("imagen", selectedFile);
  
    try {
      const response = await Axios.post(
        "http://localhost:3002/products/create",
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (response.status === 201) {
        setMessage("Producto registrado con éxito.");
        navigate("/consultaProducto");
      } else {
        setMessage(`Error al registrar el producto: ${response.data.message}`);
      }
      
    } catch (error) {
      console.error("Error en la solicitud:", error);  // Agregar este log
      setMessage(`Error en la solicitud: ${error.message}`);
    }
  };
  

  const renderProductContent = () => (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-grow p-2">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
              Registro de Producto
            </h1>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="nombre"
                  >
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="cantidad"
                    >
                      Cantidad
                    </label>
                    <input
                      type="number"
                      id="cantidad"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="precio"
                    >
                      Precio
                    </label>
                    <input
                      type="number"
                      id="precio"
                      name="precio"
                      value={formData.precio}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="descripcion"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="imagen"
                  >
                    Imagen del Producto
                  </label>
                  <input
                    type="file"
                    id="imagen"
                    name="imagen"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                    required
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="max-w-xs max-h-48 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="categoria"
                  >
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
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
                {message && <p className="text-red-500">{message}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
                  >
                    Registrar Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  const renderLayout = () => {
    if (userRole === "Administrador") {
      return <AdminLayout>{renderProductContent()}</AdminLayout>;
    } else if (userRole === "Almacenista") {
      return <StoreKeeperLayout>{renderProductContent()}</StoreKeeperLayout>;
    }
    return null;
  };

  return <>{renderLayout()}</>;
};

export default ProductoForm;
