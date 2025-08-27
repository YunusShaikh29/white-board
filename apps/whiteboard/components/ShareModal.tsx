"use client";

import { useState, useEffect } from "react";
import { X, Copy, Play, Square, ExternalLink } from "lucide-react";

export function ShareModal({
  roomId,
  onClose,
}: {
  roomId: number;
  onClose: () => void;
}) {
  const [sessionStatus, setSessionStatus] = useState<{
    hasActiveSession: boolean;
    sessionKey: string | null;
  }>({ hasActiveSession: false, sessionKey: null });
  
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copyButtonText, setCopyButtonText] = useState("Copy link");

  // Check current session status
  useEffect(() => {
    checkSessionStatus();
  }, [roomId]);

  // Update share URL when session becomes active
  useEffect(() => {
    if (sessionStatus.hasActiveSession && sessionStatus.sessionKey) {
      setShareUrl(`${window.location.origin}/join/${sessionStatus.sessionKey}`);
    } else {
      setShareUrl("");
    }
  }, [sessionStatus]);

  const checkSessionStatus = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch(`http://localhost:5050/api/session/status/${roomId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data);
      }
    } catch (error) {
      console.error("Error checking session status:", error);
    }
  };

  const startSession = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5050/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionStatus({
          hasActiveSession: true,
          sessionKey: data.sessionKey
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("Start session error:", response.status, errorData);
        alert(`Failed to start session: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Error starting session");
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("http://localhost:5050/api/session/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });

      if (response.ok) {
        setSessionStatus({
          hasActiveSession: false,
          sessionKey: null
        });
        setShareUrl("");
      } else {
        alert("Failed to stop session");
      }
    } catch (error) {
      console.error("Error stopping session:", error);
      alert("Error stopping session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopyButtonText("Copied!");
        setTimeout(() => setCopyButtonText("Copy link"), 2000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
        setCopyButtonText("Failed to copy");
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Live Collaboration</h2>
        
        {!sessionStatus.hasActiveSession ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Start a live collaboration session to invite people to work on your drawing in real-time.
            </p>
            <button
              onClick={startSession}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 mx-auto transition-all"
            >
              <Play size={20} />
              {isLoading ? "Starting..." : "Start Session"}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Session Active</span>
              </div>
              <button
                onClick={stopSession}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
              >
                <Square size={16} />
                {isLoading ? "Stopping..." : "Stop Session"}
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Share this link with collaborators. Anyone with the link can view and edit this whiteboard.
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-grow p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopy}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 transition-all"
              >
                <Copy size={16} />
                {copyButtonText}
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ExternalLink size={14} />
              <span>Link will expire when session is stopped</span>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Tip:</strong> Only you can start/stop sessions for your rooms. Collaborators will automatically be disconnected when you stop the session.
          </p>
        </div>
      </div>
    </div>
  );
}
