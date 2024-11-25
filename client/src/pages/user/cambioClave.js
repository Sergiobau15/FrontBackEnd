import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function CambioClave() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    const hasNumber = /\d/.test(pass);
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    return {
      length: pass.length >= 8,
      number: hasNumber,
      upper: hasUpperCase,
      lower: hasLowerCase,
      special: hasSpecialChar
    };
  };

  const strength = validatePassword(password);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!Object.values(strength).every(Boolean)) {
      setError('Por favor cumple con todos los requisitos de la contraseña');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    actualizarContrasena();
  };

  const actualizarContrasena = () => {
    const user = sessionStorage.getItem('CorreoUsuario');
    const correo = user;

    axios.post("http://localhost:3002/users/changePassword", {
      NuevaContrasena: password,
      Correo: correo
    })
      .then(() => {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');  // Redirige al login después de actualizar la contraseña
        }, 2000); // Espera 2 segundos antes de redirigir
      })
      .catch(error => {
        console.error("Hubo un error en la actualización de la contraseña:", error);
        setError("Hubo un error en la actualización de la contraseña.");
      });
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">

          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-center">
              <svg className="mx-auto h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="mt-4 text-3xl font-extrabold text-white">
                Recuperación de Contraseña
              </h2>
              <p className="mt-2 text-blue-100">
                Configura tu nueva contraseña para continuar
              </p>
            </div>

            <div className="px-6 py-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Nueva Contraseña
                  </label>
                  <div className="mt-1 relative group">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                      placeholder="Ingresa tu nueva contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmar Contraseña
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Requisitos:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries({
                      'Mínimo 8 caracteres': strength.length,
                      'Mayúscula': strength.upper,
                      'Minúscula': strength.lower,
                      'Número': strength.number,
                      'Caracter especial': strength.special
                    }).map(([text, isValid]) => (
                      <div key={text} className={`flex items-center space-x-2 text-sm ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
                        <svg className={`h-4 w-4 ${isValid ? 'text-green-600' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" />
                        </svg>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">Contraseña actualizada exitosamente. Redirigiendo al login...</p>}

                <div className="flex justify-center">
                  <button type="submit" className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Cambiar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
