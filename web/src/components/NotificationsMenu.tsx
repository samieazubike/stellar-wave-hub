"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export default function NotificationsMenu() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      return data.notifications || [];
    },
    enabled: !!token,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-stardust/50 transition-colors text-ash hover:text-starlight"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-supernova opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-supernova"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-space border border-dust/30 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-dust/30 bg-stardust/20">
            <h3 className="font-semibold text-starlight text-sm">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-dust/10 last:border-0 hover:bg-stardust/10 transition-colors ${!n.read ? 'bg-nova/5' : ''}`}
                >
                  <p className={`text-sm ${!n.read ? 'text-starlight font-medium' : 'text-ash'}`}>
                    {n.message}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-ash/60">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-xs text-nova hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-ash">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
