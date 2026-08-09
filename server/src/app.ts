import uploadRoutes from "./routes/upload.routes.js";
import userRoutes from "./routes/user.routes.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: "../.env" });
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);

export default app;
