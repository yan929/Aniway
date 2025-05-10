

function DisplayDetailAniInfo({ aniData }) {
  return (
    <div className="ani-info">
      <h2>This is detail info</h2>
      <h2>{aniData.name}</h2>
      <p>{aniData.description}</p>

      <img src={aniData.images.small} alt={aniData.name} />
    </div>
  );
}

export default DisplayDetailAniInfo;
