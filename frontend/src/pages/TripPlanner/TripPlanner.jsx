import DynamicMapDemo from "../../component/GMap/GMapDemo";
import SearchBar from "../../component/Search/search";
import ChatGPTDemo from "../../ChatGPTDemo";

function TripPlanner() {
  return (
    <>
      <h1>Trip Planner</h1>
      <SearchBar />
      <DynamicMapDemo />
      <ChatGPTDemo />
    </>
  );
}

export default TripPlanner;
