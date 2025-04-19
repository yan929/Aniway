import DynamicMapDemo from "../../component/GMap/GMapDemo"
import SearchBar from "../../component/Search/search"

function TripPlanner() {
    return (
        <>
            <h1>Trip Planner</h1>
            <SearchBar />
            <DynamicMapDemo />
        </>
    )
}


export default TripPlanner