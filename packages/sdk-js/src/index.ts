import { createExpressMiddleware } from "./express";

export { createExpressMiddleware as middleware };
export type { LiveBoardConfig, EventPayload, ResolvedConfig } from "./types";
export { SDK_VERSION } from "./version";

export default { middleware: createExpressMiddleware };
