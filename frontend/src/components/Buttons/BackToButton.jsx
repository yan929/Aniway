import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

function BackToButton({ message, page }) {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-transparent">
      <div className="flex justify-start px-0 pt-4">
        <button
          onClick={() => navigate(`/${page}`)}
          className="flex items-center gap-2 px-4 py-1.5 border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:border-blue-400 dark:text-blue-300 rounded-full transition duration-200 ml-2"
        >
          <FaArrowLeft />
          <span>Back to {message}</span>
        </button>
      </div>
    </div>
  );
}

export default BackToButton;
