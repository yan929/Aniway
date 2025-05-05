import { Link } from "react-router-dom";
function AniDetail() {
  return (
    <>
      <div>
        <Link to={"/"}>Back to home</Link>
        <br />
        <h2>This is anime</h2>
        {/* More info will be added after api is added~ */}
      </div>
    </>
  );
}

export default AniDetail;
