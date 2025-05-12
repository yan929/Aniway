import { useState,useContext } from "react";
import UserForm from "../../components/Setting/userForm";
import DeleteAccountSection from "../../components/Setting/deleteArea";
import LocSearchBar from "../../components/Search/locSearch";
import { AppContext } from "../../context/AppContext.jsx";

function Setting() {
  const [activeTab, setActiveTab] = useState("account");
  const { user } = useContext(AppContext);

  return (
    <>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r px-6 py-8">
          <h2 className="text-xl font-bold">Settings</h2>
          <div
            className={`cursor-pointer font-medium ${
              activeTab === "account"
                ? "text-black underline"
                : "text-gray-600 hover:text-black"
            }`}
            onClick={() => {
              setActiveTab("account");
            }}
          >
            Account
          </div>
          <div
            className={`cursor-pointer font-medium ${
              activeTab === "delete"
                ? "text-black underline"
                : "text-gray-600 hover:text-black"
            }`}
            onClick={() => {
              setActiveTab("delete");
            }}
          >
            Delete
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-10 py-10">
          {activeTab === "account" && <UserForm user={user}/>}
          {activeTab === "delete" && <DeleteAccountSection  />}
        </main>
      </div>
    </>
  );
}

export default Setting;
