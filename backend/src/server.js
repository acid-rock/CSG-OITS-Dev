import app from "./app.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.clear();
  console.log(`Listening to ${PORT}`);
});

// Catch startup errors (just in case)
server.on("error", (err) => {
  console.error("Server failed to start: ", err);
  process.exit(1);
});
