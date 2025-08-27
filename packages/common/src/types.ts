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
  type: z.literal("rect"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const circleSchema = z.object({
  type: z.literal("circle"),
  centerX: z.number(),
  centerY: z.number(),
  // Make these optional but at least one must be present
  radius: z.number().optional(),
  radiusX: z.number().optional(),
  radiusY: z.number().optional(),
})

export const lineSchema = z.object({
  type: z.literal("line"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});

export const arrowSchema = z.object({
  type: z.literal("arrow"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});

export const textSchema = z.object({
  type: z.literal("text"),
  x: z.number(),
  y: z.number(),
  content: z.string(),
  font: z.string(),
  fontSize: z.number(),
  color: z.string()
});

export const pencilSchema = z.object({
  type: z.literal("pencil"),
  points: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
    })
  ),
});

export const rhombusSchema = z.object({
  type: z.literal("rhombus"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

/* Discrimination union
  discriminating based on what type did we get from FE
*/

export const shapeSchema = z.discriminatedUnion("type", [
  rectSchema,
  circleSchema,
  arrowSchema,
  lineSchema,
  pencilSchema,
  textSchema,
  rhombusSchema,
]);

// Update Shape type to include optional id in each variant
export type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      id?: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radiusX: number;
      radiusY: number;
      id?: number;
    }
  | {
      type: "rhombus";
      x: number;
      y: number;
      width: number;
      height: number;
      id?: number;
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      id?: number;
    }
  | {
      type: "arrow";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      id?: number;
    }
  | {
      type: "pencil";
      points: Point[];
      id?: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      content: string;
      font: string;
      fontSize: number;
      color: string;
      id?: number;
    }
  | null;
