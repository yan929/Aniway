import Anime from "../models/Anime.js";
import Location from "../models/Location.js";

export class DatabaseMiddleware {
  static async queryForAnimeByName (animeName) {
    /*
     * Queries for an anime from the database by its name.
     */
    const animeByEN = await Anime.findOne({ name_en: animeName });
    const animeByCN = await Anime.findOne({ name_cn: animeName });

    if (!(animeByEN && animeByCN)) {
      return new Response(null, { status: 404 });
    }

    return new Response(animeByEN ? animeByEN : animeByCN, { status: 200 });
  }

  static async queryForAllAnime () {
    /*
     * Queries for all animes stored in the database. Ideally should not
     * be used as it can be expensive resource-wise.
     */
    const allAnimes = await Anime.find({});
    return new Response(allAnimes, { status: 200 });
  }

  static async queryForLocationsByAnimeName(animeName) {
    /*
    * Queries for all locations associated with an anime.
    */
    const locationsByEN = await Location.find({ anime_en_names: animeName })
    const locationsByCN = await Location.find({ anime_cn_names: animeName })

    if (!(locationsByEN && locationsByCN)) {
      return new Response(null, { status: 404 });
    }

    return new Response(locationsByEN ? locationsByEN : locationsByCN, { status: 200 });
  }

  // TODO: Add more methods as required
}
