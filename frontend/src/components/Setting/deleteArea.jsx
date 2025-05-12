import apiClient from "../../util/api";
import { useContext, useEffect } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";

function DeleteAccountSection() {
  const { user, logoutUser } = useContext(AppContext);

  const navigate = useNavigate();

  const handleUserDelete = async () => {
    try {
      const response = await apiClient.post(
        "/api/user/delete",
        {},
        { withCredentials: true }
      );

      if (response) {
        logoutUser();
        navigate("/");
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <>
      {user ? (
        <div className="pt-6 pr-6 pb-6 rounded-md">
          <h2 className="text-xl font-bold mb-1 text-left">Delete Account</h2>
          <hr className="border-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-4 text-left">
            This page section lets you permanently delete your account from the
            application. When you click the button, your account and all related
            data will be removed, you will be logged out, and redirected to the
            homepage. If you are not logged in, you will be redirected away from
            this page automatically.
          </p>

          <div className="mt-4 flex justify-start">
            <button
              className="bg-gray-800 text-white font-semibold px-5 py-2 rounded-full hover:bg-gray-900"
              onClick={handleUserDelete}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <p>no setting</p>
      )}
    </>
  );
}

export default DeleteAccountSection;
