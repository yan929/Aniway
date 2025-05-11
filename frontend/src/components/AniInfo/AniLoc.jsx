import HorizontalLocationCard from "../PopularItem/HorizontalLocationCard";
import AniLocCard from "./AniLocCard";

function DisplayAniLoc({ aniLocList, onLocationClick, cardClassName }) {
  return (
    <div className="ani-info">
      <AniLocCard
        locList={aniLocList}
        onLocationClick={onLocationClick}
        cardClassName={cardClassName}
      />
    </div>
  );
}

export default DisplayAniLoc;
