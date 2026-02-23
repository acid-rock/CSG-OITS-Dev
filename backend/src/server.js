import app from "./app.js";
import "dotenv/config";

const PORT = process.env.PORT || 5050;

app.listen(PORT, (err) => {
  if (err) return;

  console.clear();
  console.log(`Listening to port ${PORT}`);
});
