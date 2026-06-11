import { createExpressMiddleware } from "./express";
import { createFastifyPlugin } from "./fastify";

export { createExpressMiddleware as middleware };
export { createFastifyPlugin as fastifyPlugin };
export type { LiveBoardConfig, EventPayload, ResolvedConfig } from "./types";
export { SDK_VERSION } from "./version";

export default { middleware: createExpressMiddleware, fastifyPlugin: createFastifyPlugin };
