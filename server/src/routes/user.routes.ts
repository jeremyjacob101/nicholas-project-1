import { listUsers } from "../controllers/user.controller.ts";
import { Router } from "express";

const userRouter = Router();

userRouter.get("/", listUsers);

export default userRouter;
