import express from "express";
import { middleware } from "./middleware";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SigninSchema,
} from "@repo/common/types";
import {db} from "@repo/db/db"

const app = express();

app.post("/signup", (req, res) => {
  const data = CreateUserSchema.safeParse(req.body);

  if (!data.success) {
    res.json({
      message: "Incorrect Inputs!",
    });
    return;
  }


  res.json({    
    userId: "123",
  });
});

app.post("/signin", (req, res) => {
  const data = SigninSchema.safeParse(req.body);

  if (!data.success) {
    res.json({
      message: "Incorrect Inputs!",
    });
    return;
  }

  const userId = "123";
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  res.json({ token });
});

app.post("/room", middleware, (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);

  if (!data.success) {
    res.json({
      message: "Incorrect Inputs!",
    });
    return;
  }

  res.json({
    roomId: 123,
  });
});

app.listen(3001, () => {
  console.log("http server running");
});
