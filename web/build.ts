import tailwind from "bun-plugin-tailwind";

await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir: "./dist",
  plugins: [tailwind],
  naming: {
    chunk: "chunk-[hash].[ext]",
    entry: "[name]-[hash].[ext]",
    asset: "assets/[name]-[hash].[ext]",
  },
});

console.log("Build complete!");
