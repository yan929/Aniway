import HorizontalLocationCard from "../PopularItem/HorizontalLocationCard";
import AniLocCard from "./AniLocCard";

function DisplayAniLoc({ aniLocList }) {
  return (
    <div className="ani-info">
      <AniLocCard
        locList={aniLocList}
        onLocationClick={(location) => {
          console.log("Location clicked:", location);
        }}
      />
    </div>
  );
}

export default DisplayAniLoc;
