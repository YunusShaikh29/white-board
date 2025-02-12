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
    // Validate request body with Zod schema
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Validation Error",
        errors: parsedData.error.errors.map((err) => err.message),
      });
    }

    const { email, password, name } = parsedData.data;

    // Check if username already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // Enforce minimum password length
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Hash the password securely
    const hashedPassword = await hash(password, 10);

    // Create new user in the database
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Generate JWT Token (Optional)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Respond with success
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
        errors: parsedData.error.errors.map(error => error.message),
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

app.get("/chat/:roomId", async (req, res) => {
    const roomId = Number(req.params.roomId)
    const messages = await db.chat.findMany({
      where: {
        roomId
      },
      orderBy: {
        id: "desc"
      },
      take: 50
    })
    res.json({
      messages
    })
})

app.listen(5050, () => {
  console.log("http server listening");
});
