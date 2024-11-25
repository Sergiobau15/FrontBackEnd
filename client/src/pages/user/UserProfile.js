import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import StoreKeeperLayout from '../../components/StoreKeeperLayout';
import CashierLayout from '../../components/CashierLayout';
import { useCart } from '../CartContext';
import CartIcon from '../CarIcon';

const UserProfile = () => {
    const navigate = useNavigate();
    const { cart, setCart } = useCart();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        Nombres: '',
        Apellidos: '',
        Correo: '',
        Telefono: '',
        Direccion: '',
        Rol: '',
        Estado: '',
        Genero: '',
        Contrasena: '',
        CurrentPassword: '',
    });
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const id = usuario ? usuario.ID : null;

    useEffect(() => {
        if (!id) {
            setError('ID de usuario no disponible');
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://localhost:3002/users/user/${id}`);
                const userData = response.data?.data;
                if (userData) {
                    setProfile(userData);
                    setFormData({
                        Nombres: userData.Nombres,
                        Apellidos: userData.Apellidos,
                        Correo: userData.Correo,
                        Telefono: userData.Telefono,
                        Direccion: userData.Direccion,
                        Rol: userData.Rol,
                        Estado: userData.Estado,
                        Genero: userData.Genero,
                    });
                } else {
                    throw new Error('Datos del usuario no encontrados');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar los datos del usuario');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    const toggleDropdown = () => {
        setIsDropdownOpen(prevState => !prevState);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = { ...formData, ID: id };

        try {
            const response = await axios.put('http://localhost:3002/users/updateUser', data);
            if (response.status === 200) {
                setUpdateSuccess(true);
            }
        } catch (err) {
            setError('Error al actualizar los datos del usuario');
        }
    };

    const handleLogout = () => {
        const user = JSON.parse(sessionStorage.getItem('usuario'));
        if (user) {
            setCart([]); // Limpiar el carrito
            localStorage.removeItem(`cart_${user.id}`); // También eliminar del localStorage
        }
        sessionStorage.removeItem('usuario');
        setProfile(null);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    const renderUserProfile = () => {
        return (
            <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10"> {/* Cambié a max-w-5xl */}
                <h2 className="text-2xl font-semibold mb-4">Actualizar Perfil de {profile.Nombres} {profile.Apellidos}</h2>
                <p className="text-xl font-semibold mb-4">Datos: </p>
                <p className="text-l">Rol: {profile.Rol}</p>
                <p className="text-l mb-6">Genero: {profile.Genero}</p>

                {/* Mensaje de error */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 relative rounded-r-lg shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">¡Error!</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                            </div>
                            <button onClick={() => setError('')} className="absolute top-4 right-4 text-red-600 hover:text-red-800">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Mensaje de éxito */}
                {updateSuccess && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 relative rounded-r-lg shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">¡Actualización exitosa!</h3>
                                <p className="mt-1 text-sm text-green-700">Tu perfil ha sido actualizado correctamente.</p>
                            </div>
                            <button onClick={() => setUpdateSuccess(false)} className="absolute top-4 right-4 text-green-600 hover:text-green-800">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="Rol" value={formData.Rol} />
                    <input type="hidden" name="Estado" value={formData.Estado} />
                    <input type="hidden" name="Genero" value={formData.Genero} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                            type="hidden"
                            value={`${formData.Nombres} ${formData.Apellidos}`}
                            className="mt-2 p-2 border border-gray-300 rounded w-full"
                            disabled
                        />

                        <div className="form-group">
                            <label className="block font-medium text-gray-700">Correo Electrónico</label>
                            <input
                                type="email"
                                name="Correo"
                                value={formData.Correo}
                                onChange={handleChange}
                                className="mt-2 p-2 border border-gray-300 rounded w-full"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block font-medium text-gray-700">Teléfono</label>
                            <input
                                type="text"
                                name="Telefono"
                                value={formData.Telefono}
                                onChange={handleChange}
                                className="mt-2 p-2 border border-gray-300 rounded w-full"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block font-medium text-gray-700">Dirección</label>
                            <input
                                type="text"
                                name="Direccion"
                                value={formData.Direccion}
                                onChange={handleChange}
                                className="mt-2 p-2 border border-gray-300 rounded w-full"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block font-medium text-gray-700">Nueva Contraseña</label>
                            <input
                                type="password"
                                name="Contrasena"
                                placeholder='Si desea cambiar la contraseña llenar este campo'
                                value={formData.Contrasena}
                                onChange={handleChange}
                                className="mt-2 p-2 border border-gray-300 rounded w-full"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block font-medium text-gray-700">Contraseña Actual</label>
                            <input
                                type="password"
                                name="CurrentPassword"
                                placeholder='Si desea cambiar la contraseña llenar este campo'
                                value={formData.CurrentPassword}
                                onChange={handleChange}
                                className="mt-2 p-2 border border-gray-300 rounded w-full"
                            />
                        </div>

                        <div className="col-span-2 flex justify-center">
                            <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">Actualizar</button>
                        </div>
                    </div>
                </form>
            </div>
        );
    };


    const renderLayout = () => {
        if (profile.Rol === 'Administrador') {
            return (
                <AdminLayout>
                    {renderUserProfile()}
                </AdminLayout>
            );
        } else if (profile.Rol === 'Almacenista') {
            return (
                <StoreKeeperLayout>
                    {renderUserProfile()}
                </StoreKeeperLayout>
            );
        } else if (profile.Rol === 'Cajero') {
            return (
                <CashierLayout>
                    {renderUserProfile()}
                </CashierLayout>
            );
        } else if (profile.Rol === 'Cliente'){
            return (
                <div>
                    <header className="bg-gray-800 py-4 shadow-md w-full">
                        <div className="container mx-auto px-4 flex justify-between items-center">
                            <Link to="/consultaProductoCliente" className="text-lg font-bold text-white">Solo Electricos</Link>
                            <nav className="hidden md:flex space-x-4">
                                <ul className="flex space-x-4">
                                    <li><Link to="/consultaProductoCliente" className="text-white hover:text-gray-300">Inicio</Link></li>
                                    <li><Link to="/pedidoCliente" className="text-white hover:text-gray-300">Mis pedidos</Link></li>
                                </ul>
                            </nav>
                            <div className="flex items-center space-x-4">
                                <CartIcon />
                                <div className="relative">
                                    <button
                                        id="dropdown-button"
                                        onClick={toggleDropdown}
                                        className="flex items-center space-x-2 py-1 text-white hover:bg-gray-300 rounded-md focus:outline-none"
                                    >
                                        {profile ? (
                                            <span>{profile.Nombres} {profile.Apellidos}</span>
                                        ) : (
                                            <p>No hay sesión activa.</p>
                                        )}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </button>
                                    {isDropdownOpen && (
                                        <div id="dropdown-menu" className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
                                            {profile ? (
                                                <Link to={`/usuarioPerfil`} className='block px-4 py-2 text-gray-700 hover:bg-gray-300'>Mi Perfil</Link>
                                            ) : (
                                                <p>No hay sesión activa.</p>
                                            )}
                                            <div className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                                                <button onClick={handleLogout}>Cerrar Sesión</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button className="md:hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </header>
                    {renderUserProfile()}
                </div>
            );

        }


    }

    return (
        <>
            {renderLayout()}
        </>
    );
};

export default UserProfile;
