import DynamicMapDemo from "../../components/GMap/GMapDemo";
import SearchBar from "../../components/Search/search";
import ChatGPTDemo from "../../ChatGPTDemo";

import { useState } from "react";

function TripPlanner() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  return (
    <>
      <h1>Trip Planner</h1>
      <SearchBar setSelectedLocation={(loc) => setSelectedLocation(loc)} />
      <DynamicMapDemo selectedLocation={selectedLocation} />
      <ChatGPTDemo />
    </>
  );
}

export default TripPlanner;
