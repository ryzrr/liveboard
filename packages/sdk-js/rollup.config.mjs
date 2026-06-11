import typescript from "@rollup/plugin-typescript";

const input = "src/index.ts";
const external = ["http", "https", "crypto"];

export default [
  // ESM bundle — also emits .d.ts declarations
  {
    input,
    output: {
      file: "dist/index.mjs",
      format: "esm",
      sourcemap: true,
    },
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist",
        outDir: "dist",
      }),
    ],
  },
  // CJS bundle — code only, declarations already emitted above
  {
    input,
    output: {
      file: "dist/index.cjs",
      format: "cjs",
      exports: "named",
      sourcemap: true,
    },
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        // Override both flags so TypeScript doesn't see declarationDir without declaration
        declaration: false,
        declarationDir: undefined,
        outDir: "dist",
      }),
    ],
  },
];
