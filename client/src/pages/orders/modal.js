const Modal = ({ isVisible, message, onClose, onConfirm, isConfirmation, title }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg w-full">
        {/* Si se proporciona un título, lo mostramos */}
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        
        <p className="mb-4">{message}</p>

        <div className="flex justify-end space-x-2">
          {isConfirmation ? (
            <>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  onConfirm(); // Confirmar y ejecutar la acción
                  onClose(); // Cerrar el modal
                }}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
              >
                Confirmar
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
