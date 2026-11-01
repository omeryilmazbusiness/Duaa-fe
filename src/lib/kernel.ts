import { HttpKernelApi } from "@/infrastructure/http/api";
import { tokenStore } from "@/infrastructure/session/token-store";

export const kernel = new HttpKernelApi(tokenStore);
export { tokenStore };
