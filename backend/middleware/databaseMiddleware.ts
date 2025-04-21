import { models } from "mongoose";

const Anime = models.Anime
const Location = models.Location

export class DatabaseMiddleware {
    static async queryForAnimeByName(animeName) {
        const animeByEN = await Anime.findOne({name_en: animeName});
        const animeByCN = await Anime.findOne({name_cn: animeName});

        if (!(animeByEN && animeByCN)) {
            return new Response(null, {status: 404})
        }

        return new Response(animeByEN ? animeByEN : animeByCN, {status: 200})
    }
    // TODO: Add more methods as required
}