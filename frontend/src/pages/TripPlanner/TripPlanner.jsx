import DynamicMapDemo from "../../component/GMap/GMapDemo";
import SearchBar from "../../component/Search/search";
import ChatGPTDemo from "../../ChatGPTDemo";
import { useState } from "react";

function TripPlanner() {
  const [selectedlocation, setSelectedLocation] = useState(null);
  return (
    <>
      <h1>Trip Planner</h1>
      <SearchBar setSelectedLocation={(loc) => setSelectedLocation(loc)} />
      <DynamicMapDemo selectedLocation={selectedlocation} />
      <ChatGPTDemo />
    </>
  );
}

export default TripPlanner;
