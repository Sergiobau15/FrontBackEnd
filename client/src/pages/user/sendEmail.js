import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SendEmail = () => {
    const [Correo, setCorreo] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const accountDropdownRef = useRef(null);
    const navigate = useNavigate();

    const validarCorreo = (correo) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!Correo) {
            setError('El correo electrónico es obligatorio.');
            return;
        }

        if (!validarCorreo(Correo)) {
            setError('El correo electrónico no es válido.');
            return;
        }

        try {
            await axios.post('http://localhost:3002/users/recover', { Correo: Correo }); // Cambiado de correo a Correo
            sessionStorage.setItem('CorreoUsuario', Correo);
            setSuccess('El código de recuperación ha sido enviado a tu correo electrónico.');
            setTimeout(() => {
                navigate('/enviarCodigo', { state: { correo: Correo } });
            }, 3000);
        } catch (error) {
            const mensajeError = error.response?.data?.message || 'Error inesperado al enviar el código.';
            setError(mensajeError);
            console.error('Error al enviar el código:', mensajeError);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
                setIsAccountDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div>
            <header className="bg-gray-800 py-4 shadow-md w-full">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
                    <Link to="/" className="text-lg font-bold text-gray-100">
                        Solo Electricos
                    </Link>

                    <nav className="flex justify-center space-x-4 mt-4 md:mt-0">
                        <ul className="flex flex-wrap justify-center space-x-4">
                            <li>
                                <Link to="/" className="text-gray-100 hover:text-gray-300">
                                    Inicio
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className="relative" ref={accountDropdownRef}>
                        <button
                            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                            className="text-gray-100 hover:text-gray-300 focus:outline-none flex items-center"
                        >
                            Mi Cuenta
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="ml-2 h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 9.293a1 1 0 011.414 0L10 12.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                        {isAccountDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                                <Link
                                    to="/registroUsuarioCliente"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Registrarme
                                </Link>
                                <Link
                                    to="/login"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Iniciar sesión
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto mt-8 p-4">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        Recuperar Contraseña
                    </h2>
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 border border-green-300 rounded-md flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-3 3v-6m9 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            {success}
                        </div>
                    )}
                    <form onSubmit={handleSendCode} className="space-y-6">
                        <div>
                            <label
                                htmlFor="Correo"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                id="Correo"
                                name="Correo"
                                placeholder="Ingresar correo electrónico"
                                className={`w-full mt-1 p-3 border ${
                                    error ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-blue-500 focus:border-blue-500`}
                                value={Correo}
                                onChange={(e) => setCorreo(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            Enviar código
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default SendEmail;