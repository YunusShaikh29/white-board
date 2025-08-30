/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function JoinSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionKey = params.sessionKey as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Validating session...");
  const [roomInfo, setRoomInfo] = useState<{ roomId: number; roomName: string } | null>(null);

  useEffect(() => {
    if (!sessionKey) {
      setStatus('error');
      setMessage("Invalid session link");
      return;
    }

    validateAndJoinSession();
  }, [sessionKey]);

  const validateAndJoinSession = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/api/session/join/${sessionKey}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Session validation failed");
      }

      const data = await response.json();
      setRoomInfo(data);
      setStatus('success');
      setMessage("Session validated! Redirecting...");
      
      // Add sessionKey to URL params and redirect to canvas
      setTimeout(() => {
        router.push(`/canvas/${data.roomId}?sessionKey=${sessionKey}`);
      }, 1500);

    } catch (error: any) {
      console.error("Session validation error:", error);
      setStatus('error');
      
      if (error.message.includes("ended")) {
        setMessage("This collaboration session has ended or is no longer available.");
      } else {
        setMessage("Unable to join session. The link may be invalid or expired.");
      }
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Joining Collaboration Session
        </h1>
        
        <p className={`text-lg mb-6 ${getStatusColor()}`}>
          {message}
        </p>
        
        {roomInfo && status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">
              <strong>Room:</strong> {roomInfo.roomName}
            </p>
            <p className="text-green-600 text-sm mt-1">
              You will be connected to the live whiteboard in a moment...
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">
                If you believe this is an error, please contact the person who shared this link with you.
              </p>
            </div>
            
            <button
              onClick={() => router.push('/rooms')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to My Rooms
            </button>
          </div>
        )}
        
        {status === 'loading' && (
          <div className="text-gray-500 text-sm">
            This may take a few seconds...
          </div>
        )}
      </div>
    </div>
  );
}
