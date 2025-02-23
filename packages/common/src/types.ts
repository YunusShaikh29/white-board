import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().min(3).max(20), //email => username
  password: z.string().min(8),
  name: z.string(),
});

export const SigninSchema = z.object({
  email: z.string().min(3).max(20),
  password: z.string().min(8),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(20),
});

/* Shapes schemas below */

export const rectSchema = z.object({
  shapeType: z.literal("rect"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const circleSchema = z.object({
  shapeType: z.literal("circle"),
  centerX: z.number(),
  centerY: z.number(),
  radius: z.number(),
});

export const lineSchema = z.object({
  shapeType: z.literal("line"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});

export const arrowSchema = z.object({
  shapeType: z.literal("arrow"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});

export const textSchema = z.object({
  shapeType: z.literal("text"),
  x: z.number(),
  y: z.number(),
  content: z.string(),
});

export const pencilSchem = z.object({
  shapeType: z.literal("pencil"),
  points: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
    })
  ),
});

export const rhombusSchema = z.object({
  shapeType: z.literal("rhombus"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

/* Discrimination union
  discriminating based on what shapeType did we get from FE
*/

export const shapeSchema = z.discriminatedUnion("shapeType", [
  rectSchema,
  circleSchema,
  arrowSchema,
  lineSchema,
  pencilSchem,
  textSchema,
  rhombusSchema,
]);
