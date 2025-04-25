import Anime from "../models/Anime.js";

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

  // TODO: Add more methods as required
}
