import { useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";

export default function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-green-500 text-white px-6 py-4 rounded-md shadow-lg flex items-center gap-3 animate-fade-in-down pointer-events-auto">
        <FaCheckCircle className="text-2xl" />
        <div className="text-sm text-left">
          <strong className="block font-semibold">Success!</strong>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
