import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import CartIcon from '../CarIcon';

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorModalIsOpen, setErrorModalIsOpen] = useState(false);
  const [confirmDeleteModalIsOpen, setConfirmDeleteModalIsOpen] = useState(false); // Modal de confirmación de eliminación
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Cargar pedidos del usuario al cargar el componente
  useEffect(() => {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario || !usuario.ID) {
      console.error('No user ID found');
      navigate('/login');
      return;
    }

    const fetchPedidos = async () => {
      try {
        const response = await axios.get(`http://localhost:3002/orders/user/${usuario.ID}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setPedidos(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Error al cargar los pedidos');
      }
    };

    fetchPedidos();
  }, [navigate]);

  // Función para abrir el modal de edición de pedido
  const openModal = (pedido) => {
    setSelectedPedido(pedido);
    setModalIsOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedPedido(null);
    setShowProductsModal(false);
  };

  // Función para manejar la eliminación de un pedido
  const handleDelete = async (id) => {
    try {
      // Realizar la solicitud GET para desactivar el pedido
      const response = await axios.get(`http://localhost:3002/orders/desactivate/${id}`);
      
      // Si la desactivación fue exitosa, actualizar el estado local de pedidos
      setPedidos(pedidos.filter(pedido => pedido.id !== id));
      setConfirmDeleteModalIsOpen(false); // Cerrar el modal de confirmación
    } catch (error) {
      console.error('Error al desactivar el pedido:', error);
      setError('Error al desactivar el pedido. Intente más tarde.');
    }
  };

  // Función para manejar la edición de un pedido
  const handleEdit = async () => {
    if (!selectedPedido.Telefono || !selectedPedido.Direccion || !selectedPedido.paymentMethod) {
      setError('Todos los campos son obligatorios.');
      setErrorModalIsOpen(true); // Abre el modal de error
      return;
    }
  
    setError(''); // Limpiar cualquier error previo
  
    // Adaptar los campos para que coincidan con el controlador del backend
    const updatedPedido = {
      Nombre: selectedPedido.Nombres,       // Ajustar al nombre que espera el backend
      Numero: selectedPedido.Telefono,      // Ajustar al número de teléfono
      Direccion: selectedPedido.Direccion,  // Dirección del pedido
      Metodo: selectedPedido.paymentMethod, // Método de pago
    };
  
    try {
      // Realizar la solicitud PUT para actualizar el pedido
      const response = await axios.put(`http://localhost:3002/orders/edit/${selectedPedido.id}`, updatedPedido);
  
      // Volver a cargar todos los pedidos
      const usuario = JSON.parse(sessionStorage.getItem('usuario'));
      const responsePedidos = await axios.get(`http://localhost:3002/orders/user/${usuario.ID}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      setPedidos(responsePedidos.data); // Actualizar el estado con los nuevos pedidos
  
      closeModal(); // Cerrar el modal de edición
  
    } catch (error) {
      setError('Error al editar el pedido. Intente más tarde.');
      setErrorModalIsOpen(true); // Mostrar modal de error
    }
  };
  
    

  // Función para formatear las fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Función para alternar el modal de productos
  const toggleProductsModal = () => {
    setShowProductsModal(!showProductsModal);
  };

  // Función para alternar el menú desplegable de usuario
  const toggleDropdown = () => {
    setIsDropdownOpen(prevState => !prevState);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <div>
      <header className="bg-gray-800 py-4 shadow-md w-full">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/consultaProductoCliente" className="text-lg font-bold text-gray-100">Solo Electricos</Link>
            <div className="flex items-center space-x-6">
              <Link to="/Cart" className="flex items-center text-gray-100 hover:text-gray-300">
                <CartIcon />
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  id="dropdown-button"
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 py-1 text-white hover:bg-gray-300 rounded-md focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div id="dropdown-menu" className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
                    <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                      <button onClick={handleLogout}>Cerrar Sesión</button>
                    </li>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Mis Pedidos</h2>
        {pedidos.length === 0 ? (
          <p className="text-center text-gray-600">No tienes pedidos realizados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-lg shadow-md p-4 transition-transform transform hover:scale-105">
                <p className="text-gray-900">Nombre: {pedido.Nombres}</p>
                <p className="text-gray-700">Teléfono: {pedido.Telefono}</p>
                <p className="text-gray-700">Dirección: {pedido.Direccion}</p>
                <p className="text-gray-700">Método de Pago: {pedido.paymentMethod}</p>
                <p className="text-gray-700">Fecha: {formatDate(pedido.orderDate)}</p>
                <p className="text-gray-700">Total: <span className="font-bold">${pedido.totalPrice}</span></p>
                <button
                  onClick={() => { setSelectedPedido(pedido); toggleProductsModal(); }}
                  className="text-blue-500 hover:underline mt-2"
                >
                  Ver más
                </button>
                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    onClick={() => openModal(pedido)}
                    className="bg-blue-500 text-white px-4 py-2 rounded transition-all duration-300 hover:bg-blue-400 hover:text-gray-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setSelectedPedido(pedido) & setConfirmDeleteModalIsOpen(true)}
                    className="bg-red-500 text-white px-4 py-2 rounded transition-all duration-300 hover:bg-red-400 hover:text-gray-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {confirmDeleteModalIsOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-md p-6 w-11/12 md:w-1/3">
              <h2 className="text-xl font-bold text-black">Confirmar eliminación</h2>
              <p className="text-gray-700">¿Estás seguro de que deseas eliminar este pedido?</p>
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setConfirmDeleteModalIsOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(selectedPedido.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-400"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

{/* Modal de edición de pedido */}
{modalIsOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-md p-6 w-11/12 md:w-1/3">
      <h2 className="text-xl font-bold mb-4">Editar Pedido</h2>
      {selectedPedido && (
        <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
          {/* Teléfono */}
          <label className="block mb-2">
            Teléfono:
            <input
              type="text"
              value={selectedPedido.Telefono}
              onChange={(e) => setSelectedPedido({ ...selectedPedido, Telefono: e.target.value })}
              className="border rounded p-2 w-full"
            />
          </label>
          
          {/* Dirección */}
          <label className="block mb-2">
            Dirección:
            <input
              type="text"
              value={selectedPedido.Direccion}
              onChange={(e) => setSelectedPedido({ ...selectedPedido, Direccion: e.target.value })}
              className="border rounded p-2 w-full"
            />
          </label>
          
          {/* Método de Pago */}
          <label className="block mb-2">
            Método de Pago:
            <select
              value={selectedPedido.paymentMethod}
              onChange={(e) => setSelectedPedido({ ...selectedPedido, paymentMethod: e.target.value })}
              className="border rounded p-2 w-full"
            >
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </label>

          {/* Precio Total (Solo visualización, no editable) */}
          <div className="block mb-4">
            <p className="font-semibold">Precio Total: ${selectedPedido.totalPrice}</p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between mt-4">
            <button
              onClick={closeModal}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
)}

        {/* Modal de productos del pedido */}
        {showProductsModal && selectedPedido && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-md p-6 w-11/12 md:w-1/3">
              <h2 className="text-xl font-bold mb-4">Productos del Pedido ID: {selectedPedido.id}</h2>
              <ul>
                {selectedPedido.products.map((producto) => (
                  <li key={producto.id} className="text-gray-600">
                    {producto.nombre} - <span className="font-bold">${parseFloat(producto.precio).toFixed(2)} x {producto.quantityToAdd}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={toggleProductsModal}
                className="mt-4 bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal de error */}
        {errorModalIsOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-md p-6 w-11/12 md:w-1/3">
              <h2 className="text-xl font-bold text-red-500">¡Error!</h2>
              <p className="text-gray-700">{error}</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setErrorModalIsOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisPedidos;
