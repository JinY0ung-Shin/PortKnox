import type { PageServerLoad } from "./$types";
import { HOST_IP } from "$env/static/private";

export const load: PageServerLoad = () => {
        return {
                hostIp: HOST_IP || null,
        };
};
