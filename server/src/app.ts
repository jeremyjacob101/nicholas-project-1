import uploadRoutes from "./routes/upload.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import express from "express";
import cors from "cors";
import "./config.ts";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use("/api", (_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);

export default app;
