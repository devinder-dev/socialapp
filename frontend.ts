import index from "./frontend/index.html";

Bun.serve({
  routes: {
    "/": index,
  },
  port: 3002,
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Frontend running at http://localhost:3002");
