import { getJwtSecret } from "@/lib/jwt-secret";

export function register() {
	getJwtSecret();
}
