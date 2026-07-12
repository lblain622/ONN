export function buildSearch(query) {

    const where = {};

    if (query.name) {

        where.name = {

            contains: query.name,

            mode: "insensitive"

        };

    }

    if (query.energy) {

        where.energy = Number(query.energy);

    }

    return where;

}