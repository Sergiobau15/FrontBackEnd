import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import AlertModal from '../AlertModal'; // Importa el componente Alert

const RegisterUser = () => {
    const navigate = useNavigate();
    const [nombres, setNombres] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [genero, setGenero] = useState("");
    const [rol, setRol] = useState("");
    const [errores, setErrores] = useState({});
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [mensajeAlerta, setMensajeAlerta] = useState("");
    const [buttonColor, setButtonColor] = useState("");
    const [title, setTitle] = useState("");

    const regexNombre = /^[a-zA-ZÀ-ÿ\s]{1,40}$/;
    const regexCorreo = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    const regexTelefono = /^[0-9]{7,14}$/;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validarFormulario()) {
            registroUsuario();
        } else {
            setMensajeAlerta("Por favor, corrija los errores antes de continuar.");
            setButtonColor("red");
            setTitle("Error al registrar");
            setMostrarAlerta(true);
        }
    };

    const validarFormulario = () => {
        let erroresTemp = {};

        if (!regexNombre.test(nombres)) {
            erroresTemp.nombres = "El nombre solo puede contener letras y espacios.";
        }

        if (!regexNombre.test(apellidos)) {
            erroresTemp.apellidos = "Los apellidos solo pueden contener letras y espacios.";
        }

        if (!regexCorreo.test(correo)) {
            erroresTemp.correo = "El formato del correo electrónico no es válido.";
        }

        if (!regexTelefono.test(telefono)) {
            erroresTemp.telefono = "El número de teléfono debe contener entre 7 y 14 dígitos.";
        }

        if (!direccion.trim()) {
            erroresTemp.direccion = "La dirección no puede estar vacía.";
        }

        if (!genero) {
            erroresTemp.genero = "Debe seleccionar un género.";
        }

        if (!rol) {
            erroresTemp.rol = "Debe seleccionar un rol.";
        }

        setErrores(erroresTemp);
        return Object.keys(erroresTemp).length === 0;
    };

    const registroUsuario = () => {
        axios.post("http://localhost:3002/users/create", {
            Nombres: nombres,
            Apellidos: apellidos,
            Correo: correo,
            Telefono: telefono,
            Direccion: direccion,
            Genero: genero,
            Rol: rol
        }).then(() => {
            setMensajeAlerta("Registro exitoso.");
            setButtonColor("green");
            setTitle("Éxito");
            setMostrarAlerta(true);
            // Redirect to the users page after showing success alert
            setTimeout(() => {
                navigate('/usuarios');
            }, 1500); // Wait a bit before redirecting
        }).catch(error => {
            console.error("Hubo un error en el registro:", error);
            setMensajeAlerta("Hubo un error en el registro.");
            setButtonColor("red");
            setTitle("Error");
            setMostrarAlerta(true);
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-1">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="container mx-auto p-4 m-4">
                        <div className="max-w-4xl mx-auto p-8 bg-white rounded-md shadow-md">
                            <h2 className="text-2xl font-semibold text-center mb-6">Registrar Usuario</h2>
                            <form onSubmit={handleSubmit}>
                                {/* Campos del formulario */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="Nombres" className="block text-sm mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            id="Nombres"
                                            placeholder="Nombre"
                                            className={`border rounded w-full px-2 py-1 ${errores.nombres ? 'border-red-500' : ''}`}
                                            onChange={(e) => setNombres(e.target.value)}
                                        />
                                        {errores.nombres && <span className="text-red-500 text-sm">{errores.nombres}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="Apellidos" className="block text-sm mb-1">Apellidos</label>
                                        <input
                                            type="text"
                                            id="Apellidos"
                                            placeholder="Apellidos"
                                            className={`border rounded w-full px-2 py-1 ${errores.apellidos ? 'border-red-500' : ''}`}
                                            onChange={(e) => setApellidos(e.target.value)}
                                        />
                                        {errores.apellidos && <span className="text-red-500 text-sm">{errores.apellidos}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="Telefono" className="block text-sm mb-1">Número Telefónico</label>
                                        <input
                                            type="text"
                                            id="Telefono"
                                            placeholder="Número Telefónico"
                                            className={`border rounded w-full px-2 py-1 ${errores.telefono ? 'border-red-500' : ''}`}
                                            onChange={(e) => setTelefono(e.target.value)}
                                        />
                                        {errores.telefono && <span className="text-red-500 text-sm">{errores.telefono}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="Genero" className="block text-sm mb-1">Género</label>
                                        <select
                                            id="Genero"
                                            className={`border rounded w-full px-2 py-1 ${errores.genero ? 'border-red-500' : ''}`}
                                            onChange={(e) => setGenero(e.target.value)}
                                        >
                                            <option value="">Seleccione el género</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                        </select>
                                        {errores.genero && <span className="text-red-500 text-sm">{errores.genero}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="Direccion" className="block text-sm mb-1">Dirección de Residencia</label>
                                        <input
                                            type="text"
                                            id="Direccion"
                                            placeholder="Dirección"
                                            className={`border rounded w-full px-2 py-1 ${errores.direccion ? 'border-red-500' : ''}`}
                                            onChange={(e) => setDireccion(e.target.value)}
                                        />
                                        {errores.direccion && <span className="text-red-500 text-sm">{errores.direccion}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="Correo" className="block text-sm mb-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            id="Correo"
                                            placeholder="Correo Electrónico"
                                            className={`border rounded w-full px-2 py-1 ${errores.correo ? 'border-red-500' : ''}`}
                                            onChange={(e) => setCorreo(e.target.value)}
                                        />
                                        {errores.correo && <span className="text-red-500 text-sm">{errores.correo}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="Rol" className="block text-sm mb-1">Rol</label>
                                        <select
                                            id="Rol"
                                            className={`border rounded w-full px-2 py-1 ${errores.rol ? 'border-red-500' : ''}`}
                                            onChange={(e) => setRol(e.target.value)}
                                        >
                                            <option value="">Escoja un rol</option>
                                            <option value="Administrador">Administrador</option>
                                            <option value="Almacenista">Almacenista</option>
                                            <option value="Cajero">Cajero</option>
                                            <option value="Cliente">Cliente</option>
                                        </select>
                                        {errores.rol && <span className="text-red-500 text-sm">{errores.rol}</span>}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button type="button" className="bg-white text-black border border-gray-300 p-2 rounded hover:bg-gray-300 text-sm" onClick={() => navigate('/usuarios')}>Cancelar</button>
                                    <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 text-sm">Registrar Usuario</button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
            {mostrarAlerta && (
                <AlertModal
                    title={title}
                    buttonColor={buttonColor}
                    message={mensajeAlerta}
                    onClose={() => setMostrarAlerta(false)}
                />
            )}
        </AdminLayout>
    );
};

export default RegisterUser;
