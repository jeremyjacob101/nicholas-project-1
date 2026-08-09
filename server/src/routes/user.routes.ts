import { listUsers } from "../controllers/user.controller.js";
import { Router } from "express";

const userRouter = Router();

userRouter.get("/", listUsers);

export default userRouter;
