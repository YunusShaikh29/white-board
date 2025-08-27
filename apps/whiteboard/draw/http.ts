import axios from "axios";

export async function getExistingShapes(roomId: number) {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND}/shapes/${roomId}`
      );
      const shapes = res.data.shapes;
      return shapes || [];
    } catch (error) {
      console.error("Failed to fetch existing shapes:", error);
      return [];
    }
  }