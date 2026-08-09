import app from "./app.js";

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
