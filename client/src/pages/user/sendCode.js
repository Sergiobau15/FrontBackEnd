import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const SendCode = () => {
  const [code, setCode] = useState(Array(6).fill(""));
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);

  // Manejar cambios en los inputs
  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Mover al siguiente input automáticamente
      if (value && index < code.length - 1) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  // Función para validar si el código es completo
  useEffect(() => {
    const isComplete = code.every((digit) => digit !== "");
    setIsButtonEnabled(isComplete);

  }, [code]);

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const usuario = sessionStorage.getItem('CorreoUsuario');
    console.log(usuario);

    const recoveryCode = code.join(""); // Combina los dígitos del código
    const correo = usuario; // Sustituye con el correo que corresponda

    try {
      // Llamar a la API de validación
      const response = await fetch("http://localhost:3002/users/validateCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Correo: correo, Codigo: recoveryCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al validar el código");
      }

      setSuccess("El código ha sido validado correctamente.");
      setTimeout(() => navigate("/cambioClave"), 2000);
    } catch (error) {
      setError(error.message || "El código ingresado no es válido.");
      console.error("Error al validar el código:", error);
    }
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

      <main className="container mx-auto mt-8 p-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Validar Código
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  className="w-12 h-12 text-center border border-gray-300 rounded-lg text-xl focus:ring-blue-500 focus:border-blue-500"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!isButtonEnabled}
              className={`w-full py-3 rounded-lg text-white transition ${isButtonEnabled
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Validar Código
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SendCode;

