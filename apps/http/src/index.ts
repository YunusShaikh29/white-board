import express, { json, Request, Response, NextFunction } from "express";
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
import { nanoid } from "nanoid";

// Logger utility
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  }
};

const app = express();

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app', 'https://your-custom-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('user-agent')
  });
  next();
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

    // Check room limit (5 rooms per user)
    const userRoomCount = await db.room.count({
      where: {
        adminId: userId as string,
      },
    });

    if (userRoomCount >= 5) {
      return res.status(400).json({
        message:
          "Room limit reached. You can create a maximum of 5 rooms. Upgrade to premium for unlimited rooms.",
        code: "ROOM_LIMIT_EXCEEDED",
      });
    }

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

// @ts-ignore
app.get("/rooms", middleware, async (req, res) => {
  try {
    const userId = req?.userId;
    const rooms = await db.room.findMany({
      where: {
        adminId: userId as string,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Failed to fetch rooms" });
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

// @ts-ignore
app.delete("/rooms/:roomId", middleware, async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const userId = req?.userId;

    // Check if room exists and belongs to the user
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        adminId: userId as string,
      },
    });

    if (!room) {
      return res
        .status(404)
        .json({ message: "Room not found or unauthorized" });
    }

    // Delete the room
    await db.room.delete({
      where: {
        id: roomId,
      },
    });

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Failed to delete room" });
  }
});

// @ts-ignore
app.delete("/shapes/:shapeId", middleware, async (req, res) => {
  try {
    const shapeId = Number(req.params.shapeId);
    // Optionally, check if user has permission to delete shape
    console.log("Deleting shape with ID:", shapeId);
    await db.shape.delete({
      where: { id: shapeId },
    });
    res.json({ message: "Shape deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete shape" });
  }
});

// Bulk delete shapes
// app.delete("/shapes/bulk", middleware, async (req, res) => {
//   try {
//     const { shapeIds } = req.body;
//     if (!Array.isArray(shapeIds) || shapeIds.some(id => typeof id !== "number")) {
//       return res.status(400).json({ message: "Invalid shapeIds" });
//     }
//     console.log("Deleting shapes with IDs:", shapeIds);
//     await db.shape.deleteMany({
//       where: { id: { in: shapeIds } }
//     });
//     res.json({ message: "Shapes deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to delete shapes" });
//   }
// });

// SESSION MANAGEMENT ENDPOINTS

// 1. START A SESSION - Only room owner can start a session
// @ts-ignore
app.post("/api/session/start", middleware, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req?.userId;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Check if room exists and belongs to the user
    const room = await db.room.findFirst({
      where: {
        id: Number(roomId),
        adminId: userId as string,
      },
    });

    if (!room) {
      return res
        .status(403)
        .json({ message: "Room not found or unauthorized" });
    }

    const sessionKey = nanoid(24); // Generate a unique 24-character key

    // Create or update session for this room
    const session = await db.session.upsert({
      where: { roomId: Number(roomId) },
      update: {
        isActive: true,
        sessionKey,
        updatedAt: new Date(),
      },
      create: {
        roomId: Number(roomId),
        isActive: true,
        sessionKey,
      },
    });

    res.json({
      message: "Session started successfully",
      sessionKey: session.sessionKey,
      roomId: room.id,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ message: "Failed to start session" });
  }
});

// 2. STOP A SESSION - Only room owner can stop a session
// @ts-ignore
app.post("/api/session/stop", middleware, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req?.userId;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Check if room exists and belongs to the user
    const room = await db.room.findFirst({
      where: {
        id: Number(roomId),
        adminId: userId as string,
      },
    });

    if (!room) {
      return res
        .status(403)
        .json({ message: "Room not found or unauthorized" });
    }

    // Update session to inactive
    await db.session.updateMany({
      where: { roomId: Number(roomId) },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    res.json({ message: "Session stopped successfully" });
  } catch (error) {
    console.error("Error stopping session:", error);
    res.status(500).json({ message: "Failed to stop session" });
  }
});

// 3. JOIN/VALIDATE A SESSION - Public endpoint for joining via session link
app.get("/api/session/join/:sessionKey", async (req, res) => {
  try {
    const { sessionKey } = req.params;

    if (!sessionKey) {
      res.status(400).json({ message: "Session key is required" });
    }

    // Find active session with this key
    const session = await db.session.findUnique({
      where: {
        sessionKey: sessionKey,
      },
      include: {
        room: true,
      },
    });

    if (!session || !session.isActive) {
      res.status(404).json({
        message: "Session not found or has ended",
        code: "SESSION_INVALID",
      });
    }

    res.json({
      message: "Session is valid",
      roomId: session?.roomId,
      roomName: session?.room.slug,
    });
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ message: "Failed to validate session" });
  }
});

// 4. GET SESSION STATUS - Check if a room has an active session
// @ts-ignore
app.get("/api/session/status/:roomId", middleware, async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const userId = req?.userId;

    // Check if room belongs to the user
    const room = await db.room.findFirst({
      where: {
        id: roomId,
        adminId: userId as string,
      },
    });

    if (!room) {
      return res
        .status(403)
        .json({ message: "Room not found or unauthorized" });
    }

    // Get session status
    const session = await db.session.findUnique({
      where: { roomId },
    });

    res.json({
      hasActiveSession: session?.isActive || false,
      sessionKey: session?.isActive ? session.sessionKey : null,
      createdAt: session?.createdAt || null,
    });
  } catch (error) {
    console.error("Error getting session status:", error);
    res.status(500).json({ message: "Failed to get session status" });
  }
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  logger.info(`HTTP server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
});
