export function getPagination(page = 1, limit = 20) {

    page = Number(page);

    limit = Number(limit);

    return {

        skip: (page - 1) * limit,

        take: limit

    };

}