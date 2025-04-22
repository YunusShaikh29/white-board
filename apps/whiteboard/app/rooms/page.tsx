"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
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
import { PlusCircle, Loader2 } from "lucide-react";

export default function RoomsPage() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const router = useRouter();

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
            />
            <Button 
              type="submit"
              disabled={creating}
              className={`rounded-xl transform transition-all hover:scale-105 ${theme === "rgb(24,24,27)" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-indigo-600 hover:bg-indigo-500"} text-white shadow-lg hover:shadow-xl`}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2" />
              )}
              New Whiteboard
            </Button>
          </form>
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
