"use client";

import { useEffect, useState } from "react";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Room, createRoom, getRooms, deleteRoom } from "@/services/rooms";
import { getStoredToken } from "@/services/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RoomsPage() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const router = useRouter();
  const MAX_ROOMS = 5;

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push('/signin');
      return;
    }

    fetchRooms();
  }, [router]);

  const fetchRooms = async () => {
    try {
      const fetchedRooms = await getRooms();
      setRooms(fetchedRooms);
    } catch (error) {
      toast.error('Failed to fetch whiteboards');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/signin');
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      await deleteRoom(roomToDelete.id);
      toast.success('Whiteboard deleted successfully!');
      setRooms(rooms.filter(room => room.id !== roomToDelete.id));
      setDeleteModalOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete whiteboard');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    // Check room limit on frontend
    if (rooms.length >= MAX_ROOMS) {
      toast.error(`You can only create ${MAX_ROOMS} rooms. Upgrade to premium for unlimited rooms.`);
      return;
    }

    setCreating(true);
    try {
      await createRoom(newRoomName);
      toast.success('Whiteboard created successfully!');
      setNewRoomName("");
      fetchRooms();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create whiteboard');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "rgb(24,24,27)" ? "bg-gradient-to-br from-zinc-900 to-zinc-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-50"}`}>
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Hero section */}
        {/* <div className={`mb-12 text-center ${theme === "rgb(24,24,27)" ? "text-white" : "text-gray-900"}`}>
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Whiteboard Space</h1>
          <p className={`text-lg ${theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-600"}`}>
            Create, collaborate, and bring your ideas to life
          </p>
        </div> */}
        {/* Header with actions */}
        <div className={`flex justify-between items-center mb-12 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 shadow-lg ${theme === "rgb(24,24,27)" ? "bg-zinc-800/50 border border-zinc-700" : "bg-white/50 border border-gray-200"}`}>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className={`rounded-xl transform transition-transform hover:scale-105 ${theme === "rgb(24,24,27)" ? "bg-zinc-700 hover:bg-zinc-600 border-zinc-600" : "hover:bg-gray-100"}`}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className={`rounded-xl transform transition-transform hover:scale-105 flex items-center gap-2
                ${theme === "rgb(24,24,27)" ? "bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-gray-200" : "hover:bg-gray-100 text-gray-700"}`}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Room limit indicator */}
            <div className={`text-sm text-right ${theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-600"}`}>
              <span className={`font-medium ${rooms.length >= MAX_ROOMS ? "text-red-500" : "text-green-500"}`}>
                {rooms.length}/{MAX_ROOMS}
              </span>{" "}
              rooms used
              {rooms.length >= MAX_ROOMS && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  Limit reached
                </span>
              )}
            </div>
            
            <form onSubmit={handleCreateRoom} className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter whiteboard name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className={`w-64 rounded-xl border-2 transition-all focus:ring-2 ${theme === "rgb(24,24,27)" ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"}`}
                required
                minLength={3}
                maxLength={20}
                disabled={rooms.length >= MAX_ROOMS}
              />
              <Button 
                type="submit"
                disabled={creating || rooms.length >= MAX_ROOMS}
                className={`rounded-xl transform transition-all hover:scale-105 ${
                  rooms.length >= MAX_ROOMS 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : theme === "rgb(24,24,27)" 
                      ? "bg-indigo-600 hover:bg-indigo-500" 
                      : "bg-indigo-600 hover:bg-indigo-500"
                } text-white shadow-lg hover:shadow-xl`}
                title={rooms.length >= MAX_ROOMS ? "Room limit reached. Upgrade to premium for unlimited rooms." : ""}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4 mr-2" />
                )}
                {rooms.length >= MAX_ROOMS ? "Limit Reached" : "New Whiteboard"}
              </Button>
            </form>
          </div>
        </div>

        <h2 className={`text-2xl font-bold mb-6 ${theme === "rgb(24,24,27)" ? "text-white" : "text-gray-900"}`}>
          Your Whiteboards
        </h2>

        {rooms.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl backdrop-blur-sm border ${theme === "rgb(24,24,27)" ? "bg-zinc-800/50 border-zinc-700" : "bg-white/50 border-gray-200"} shadow-lg`}>
            <div className="max-w-sm mx-auto">
              <PlusCircle className={`w-12 h-12 mx-auto mb-4 ${theme === "rgb(24,24,27)" ? "text-gray-400" : "text-gray-500"}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === "rgb(24,24,27)" ? "text-white" : "text-gray-900"}`}>
                No whiteboards yet
              </h3>
              <p className={`${theme === "rgb(24,24,27)" ? "text-gray-400" : "text-gray-500"}`}>
                Create your first whiteboard to start collaborating!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`group relative p-6 rounded-2xl backdrop-blur-sm border transition-all transform hover:scale-[1.02] hover:shadow-xl
                  ${theme === "rgb(24,24,27)" ? "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50" : "bg-white/50 border-gray-200 hover:bg-white/80"}`}
              >
                <div onClick={() => router.push(`/canvas/${room.id}`)} className="cursor-pointer">
                  <h3 className={`text-xl font-semibold mb-3 ${theme === "rgb(24,24,27)" ? "text-gray-100" : "text-gray-800"}`}>{room.slug}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${theme === "rgb(24,24,27)" ? "bg-indigo-400" : "bg-indigo-500"}`} />
                    <p className={`text-sm ${theme === "rgb(24,24,27)" ? "text-gray-400" : "text-gray-500"}`}>
                      Created {new Date(room.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoomToDelete(room);
                    setDeleteModalOpen(true);
                  }}
                  className={`absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all
                    ${theme === "rgb(24,24,27)" ? "hover:bg-zinc-600 text-gray-400 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}
                  title="Delete whiteboard"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {/* Premium upgrade section when limit reached */}
      {rooms.length >= MAX_ROOMS && (
        <div className={`mt-8 p-6 rounded-2xl backdrop-blur-sm border ${theme === "rgb(24,24,27)" ? "bg-amber-900/20 border-amber-800/50" : "bg-amber-50/80 border-amber-200"} shadow-lg`}>
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-2 ${theme === "rgb(24,24,27)" ? "text-amber-100" : "text-amber-900"}`}>
              🚀 Upgrade to Premium
            </h3>
            <p className={`mb-4 ${theme === "rgb(24,24,27)" ? "text-amber-200" : "text-amber-800"}`}>
              You've reached the free limit of {MAX_ROOMS} rooms. Upgrade to premium for unlimited rooms and exclusive features!
            </p>
            <Button 
              onClick={() => {
                toast.info('Premium features coming soon! 🎉');
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRoomToDelete(null);
        }}
        onConfirm={handleDeleteRoom}
        title="Delete Whiteboard"
        message={`Are you sure you want to delete ${roomToDelete?.slug}? All the shapes inside this room will be deleted. This action cannot be undone.`}
        theme={theme}
      />
    </div>
  );
}
