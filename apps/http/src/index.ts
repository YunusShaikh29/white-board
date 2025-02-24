import express, { json } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware.ts";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { db } from "@repo/db/index";
import { compare, hash } from "bcrypt";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

//@ts-ignore
app.post("/signup", async (req, res) => {
  try {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Validation Error",
        errors: parsedData.error.errors.map((err) => err.message),
      });
    }

    const { email, password, name } = parsedData.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const hashedPassword = await hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id },
      // token
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// @ts-ignore change @types/express version to fix this issue
app.post("/signin", async (req, res) => {
  try {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Validation Error",
        errors: parsedData.error.errors.map((err) => err.message),
      });
    }

    const { email, password } = parsedData.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No account found with this username",
        errorCode: "USER_NOT_FOUND",
      });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
        errorCode: "INVALID_PASSWORD",
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "3d",
    });

    res.status(200).json({
      message: "Sign in successful",
      userId: user.id,
      token,
    });
  } catch (error: any) {
    console.log("Signin Error", error);

    res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
      errorCode: "SERVER_ERROR",
    });
  }
});

// @ts-ignore
app.post("/room", middleware, async (req, res) => {
  try {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Validation Error from line 130",
        errors: parsedData.error.errors.map((error) => error.message),
      });
    }

    const { name } = parsedData.data;

    const userId = req?.userId;

    const existingRoom = await db.room.findFirst({
      where: {
        slug: name,
      },
    });

    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const room = await db.room.create({
      data: {
        slug: name,
        adminId: userId as string,
      },
    });

    res.status(200).json({
      message: "Room created successfully",
      roomId: room.id,
    });
  } catch (error: any) {
    console.log("Room creation failed", error);
    res.status(500).json({
      message: "Internal server Error",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const messages = await db.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 1000,
    });

    res.json({
      messages,
    });
  } catch (e) {
    console.log(e);
    res.json({
      messages: [],
    });
  }
});

/* Shapes creating endpoint */
/* 
app.post("/shapes", middleware, async (req, res) => {

  try {
    // Expecting shape data in the request body.
    // Example payload:
    // {
    //   roomId: 1,
    //   type: "RECT", // one of: RECT, CIRCLE, PENCIL, TEXT, LINE, RHOMBUS, ARROW
    //   x: 100, y: 150, width: 200, height: 100, // for RECT/RHOMBUS
    //   centerX: 150, centerY: 150, radius: 50, // for CIRCLE
    //   x1: 10, y1: 10, x2: 200, y2: 200, // for LINE/ARROW
    //   content: "Hello", // for TEXT
    //   points: [...] // for PENCIL (stored as JSON)
    // }
    const shapeData = req.body;

    const shape = await db.shape.create({
      data: {
        type: shapeData.type,
        room: { connect: { id: shapeData.roomId } },
        x: shapeData.x,
        y: shapeData.y,
        width: shapeData.width,
        height: shapeData.height,
        centerX: shapeData.centerX,
        centerY: shapeData.centerY,
        radius: shapeData.radius,
        x1: shapeData.x1,
        y1: shapeData.y1,
        x2: shapeData.x2,
        y2: shapeData.y2,
        content: shapeData.content,
        points: shapeData.points,
      },
    });

    res.status(201).json({
      message: "Shape created successfully",
      shape,
    });
  } catch (error) {
    console.error("Error creating shape:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}) */

app.get("/shapes/:roomId", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const shapes = await db.shape.findMany({
      where: {
        roomId,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json({
      shapes,
    });
  } catch (error: any) {
    console.log("Error getting existing shapes", error);

    res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
      errorCode: "SERVER_ERROR",
    });
  }
});

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await db.room.findFirst({
    where: {
      slug,
    },
  });

  res.json({
    room,
  });
});

app.listen(5050, () => {
  console.log("http server listening");
});
