export interface Room {
  id: number;
  slug: string;
  adminId: string;
  createdAt: string;
}

export interface CreateRoomResponse {
  message: string;
  roomId?: number;
}

export const createRoom = async (name: string): Promise<CreateRoomResponse> => {
  const token = localStorage.getItem('jwt_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/room`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create room');
  }

  return response.json();
};

export const getRooms = async (): Promise<Room[]> => {
  const token = localStorage.getItem('jwt_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/rooms`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch rooms');
  }

  return response.json();
};

export const deleteRoom = async (roomId: number): Promise<void> => {
  const token = localStorage.getItem('jwt_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete room' }));
    throw new Error(error.message || 'Failed to delete room');
  }

  const result = await response.json();
  return result;
};
