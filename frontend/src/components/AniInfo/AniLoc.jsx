import HorizontalLocationCard from "../PopularItem/HorizontalLocationCard";
import AniLocCard from "./AniLocCard";

function DisplayAniLoc({ aniLocList, onLocationClick, cardClassName, showListTitle }) {
  return (
    <div className="ani-info">
      <AniLocCard
        locList={aniLocList}
        onLocationClick={onLocationClick}
        cardClassName={cardClassName}
        showMainListTitle={showListTitle}
      />
    </div>
  );
}

export default DisplayAniLoc;
