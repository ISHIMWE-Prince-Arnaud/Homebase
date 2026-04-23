import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { EventQueryKeys, RealtimeEvents } from "./events";
import { RealtimeContext } from "./context";
import { showToast } from "@/lib/toast";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) {
      return;
    }

    // Connect to socket
    // We rely on the browser sending the HttpOnly cookie with the handshake request
    const newSocket = io(
      import.meta.env.VITE_API_URL || "http://localhost:3000",
      {
        withCredentials: true,
        transports: ["websocket"],
        autoConnect: true,
      }
    );

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setSocket(newSocket);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    // Listen for all defined events
    Object.values(RealtimeEvents).forEach((event) => {
      newSocket.on(event, (data) => {
        console.log(`Received event: ${event}`, data);

        // Show toast for new notifications
        if (event === RealtimeEvents.NOTIFICATION_CREATED && data.notification) {
          showToast.success(
            "New notification",
            data.notification.message
          );
        }

        // Invalidate queries
        const queryKeys = EventQueryKeys[event];
        if (queryKeys) {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }

      });
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id, queryClient, user]);

  return (
    <RealtimeContext.Provider value={{ socket, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
