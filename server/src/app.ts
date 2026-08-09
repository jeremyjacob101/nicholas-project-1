import userRoutes from "./routes/user.routes.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: "../.env" });
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/users", userRoutes);

export default app;
