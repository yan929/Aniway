import apiClient from "../../util/api";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";

import ConfirmDeleteModal from "../Modal/ConfirmModal.jsx";

function DeleteAccountSection() {
  const { user, logoutUser } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);

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
        <div className="pt-6 pr-6 pb-6 rounded-md dark:bg-gray-800 bg-gray-100">
          <h2 className="text-xl font-bold mb-1 text-left dark:text-white">
            Delete Account
          </h2>
          <hr className="border-gray-400 mb-2 dark:border-gray-700" />
          <p className="text-sm text-gray-600 mb-4 text-left dark:text-gray-400">
            This page section lets you permanently delete your account from the
            application. When you click the button, your account and all related
            data will be removed, you will be logged out, and redirected to the
            homepage. If you are not logged in, you will be redirected away from
            this page automatically.
          </p>

          <div className="mt-4 flex justify-start">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2 
    bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600
    text-white font-semibold rounded-full 
    shadow-md hover:shadow-lg hover:scale-[1.03] 
    transition-all duration-300 ease-in-out 
    focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 dark:text-black"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <p>no setting</p>
      )}

      <ConfirmDeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={"Delete Account"}
        message={
          "Are you sure you want to delete your account? This action is irreversible."
        }
        onConfirm={() => {
          handleUserDelete();
          setShowModal(false);
        }}
      />
    </>
  );
}

export default DeleteAccountSection;
