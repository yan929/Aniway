import apiClient from "../../util/api";
import { useNavigate } from "react-router-dom";


function DeleteAccountSection() {
  const navigate = useNavigate();

  const handleUserDelete = async () => {
    console.log("Test deletion");

    try {
      const response = await apiClient.post(`/api/user/delete`);

      if (response.status === 200) {
        navigate("/");
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };
  return (
    <div className="bg-gray-100 p-6 rounded-md">
      <h2 className="text-xl font-bold mb-1">Delete Account</h2>
      <hr className="border-gray-400 mb-2" />
      <p className="text-sm text-gray-600 mb-4">Remove account from the page</p>
      <button
        className="bg-gray-800 text-white font-semibold px-5 py-2 rounded-full hover:bg-gray-900"
        onClick={handleUserDelete}
      >
        Delete
      </button>
    </div>
  );
}

export default DeleteAccountSection;
