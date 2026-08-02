import React, { useEffect, useRef, useState } from 'react';
import ConnectyCube from 'connectycube';
import { connectyCubeService } from '../services/ConnectyCubeService';

export const DistressVideoStream: React.FC<{
  callerId: number;
  calleeId: number;
  onCallEnd: () => void;
}> = ({ callerId, calleeId, onCallEnd }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [session, setSession] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    // Initialize WebRTC
    const mediaParams = { audio: true, video: true };
    
    // Set up listeners
    ConnectyCube.videochat.onCallListener = (session, extension) => {
      setSession(session);
      // Auto-accept in a real distress scenario
      session.getUserMedia(mediaParams).then((localStream: any) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        session.accept({});
      });
    };

    ConnectyCube.videochat.onAcceptCallListener = (session, userId, extension) => {
      // Call accepted
    };

    ConnectyCube.videochat.onRemoteStreamListener = (session, userId, remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    return () => {
      ConnectyCube.videochat.onCallListener = null;
      ConnectyCube.videochat.onAcceptCallListener = null;
      ConnectyCube.videochat.onRemoteStreamListener = null;
    };
  }, []);

  const initiateDistressCall = async () => {
    try {
      setIsCalling(true);
      const session = ConnectyCube.videochat.createNewSession([calleeId], ConnectyCube.videochat.CallType.VIDEO);
      setSession(session);
      
      const mediaParams = { audio: true, video: true };
      const localStream = await session.getUserMedia(mediaParams);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream as MediaStream;
      }
      
      session.call({});
    } catch (error) {
      console.error("Failed to initiate WebRTC distress stream", error);
      setIsCalling(false);
    }
  };

  const endCall = () => {
    if (session) {
      session.stop({});
      ConnectyCube.videochat.clearSession(session.ID);
      setSession(null);
    }
    setIsCalling(false);
    onCallEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 bg-red-500/20 text-red-400 border border-red-500 font-bold px-3 py-1 rounded animate-pulse text-xs tracking-wider">
        LIVE DISTRESS STREAM
      </div>
      
      <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        {!isCalling && (
          <button 
            onClick={initiateDistressCall}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            START STREAM
          </button>
        )}
        <button 
          onClick={endCall}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          END STREAM
        </button>
      </div>
    </div>
  );
};
