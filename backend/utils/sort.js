export function getSort(sort) {

    switch(sort) {

        case "name":

            return {

                name: "asc"

            };

        case "energy":

            return {

                energy: "asc"

            };

        default:

            return {

                collectorNumber: "asc"

            };

    }

}