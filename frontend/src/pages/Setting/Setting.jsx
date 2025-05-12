import { useState,useContext } from "react";
import UserForm from "../../components/Setting/userForm";
import DeleteAccountSection from "../../components/Setting/deleteArea";
import LocSearchBar from "../../components/Search/locSearch";
import { AppContext } from "../../context/AppContext.jsx";

function Setting() {
  const [activeTab, setActiveTab] = useState("User Details");
  const { user } = useContext(AppContext);

  return (
    <>
    <div className="max-w-5xl mx-auto p-8">
  <h2 className="text-3xl font-semibold mb-6 text-left">Settings</h2>

  {/* Tabs */}
  <div className="flex border-b border-gray-200">
    {['User Details', 'Delete Account'].map((tab, i) => (
      <div
        key={tab}
        className={`mr-6 pb-2 text-sm font-medium border-b-2 ${
          activeTab === tab
            ? 'border-b-blue-500 text-blue-500'
            : 'border-transparent text-gray-400'
        }`}
        onClick={()=> setActiveTab(tab)}
      >
        {tab}
      </div>
    ))}
  </div>

    {activeTab === 'User Details' && <UserForm user={user} />}
    {activeTab === 'Delete Account' && <DeleteAccountSection />}

</div>

    </>
  );
}

export default Setting;
