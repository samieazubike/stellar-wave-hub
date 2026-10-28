import { revalidatePath } from "next/cache";

export const publicProjectCacheHeaders = {
	"Cache-Control": "public, max-age=0, s-maxage=60, must-revalidate",
};

export function revalidatePublicProjectCache() {
	revalidatePath("/api/projects");
	revalidatePath("/api/projects/[id]", "page");
	revalidatePath("/projects/[slug]", "page");
	revalidatePath("/projects/[slug]/opengraph-image", "page");
}
