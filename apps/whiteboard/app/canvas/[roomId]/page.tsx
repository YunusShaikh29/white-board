import   RoomCanvas  from "@/components/RoomCanvas";

export default async function CanvasPage({
  params,
}: {
  params: {
    roomId: string;
  };
}) {
  // Convert string ID to number
  const roomId = parseInt((await params).roomId, 10);
  if (isNaN(roomId)) {
    throw new Error('Invalid room ID');
  }

  return <RoomCanvas roomId={roomId} />;
}
