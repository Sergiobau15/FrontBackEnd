import React from 'react';

const AlertModal = ({ title, message, buttonColor, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Fondo oscuro */}
            <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
            {/* Contenido del modal */}
            <div className="bg-white rounded-lg shadow-lg p-5 z-10">
                {/* Título dinámico */}
                <h2 className="text-lg font-bold text-center">{title}</h2>
                {/* Mensaje */}
                <p className="mt-2 text-center">{message}</p>
                <div className="flex justify-center mt-4">
                    {/* Botón con color dinámico */}
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-white rounded-md hover:brightness-90`}
                        style={{ backgroundColor: buttonColor }}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
