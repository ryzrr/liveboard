export interface LiveBoardConfig {
  apiKey: string;
  ingestUrl?: string;
  captureBody?: boolean;
  sampleRate?: number;
  ignoreRoutes?: string[];
  redactHeaders?: string[];
}

// Implementations added in Phase 2
export const middleware = (_config: LiveBoardConfig) => {
  throw new Error("Express middleware not yet implemented — coming in Phase 2");
};

export const fastifyPlugin = async () => {
  throw new Error("Fastify plugin not yet implemented — coming in Phase 2");
};

export default { middleware, fastifyPlugin };
