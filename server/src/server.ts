import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = Number(process.env.PORT);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
