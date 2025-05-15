import { useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa"; // Error icon

export default function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500 text-white px-6 py-4 rounded-md shadow-lg flex items-center gap-3 animate-fade-in-down pointer-events-auto">
        <FaExclamationCircle className="text-2xl" />
        <div className="text-sm text-left">
          <strong className="block font-semibold">Error!</strong>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
