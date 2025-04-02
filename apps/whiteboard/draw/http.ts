import axios from "axios";

export async function getExistingShapes(roomId: string) {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_HTTP_BACKEND}/shapes/${roomId}`
    );
    const shapes = res.data.shapes;
    return shapes;
  }