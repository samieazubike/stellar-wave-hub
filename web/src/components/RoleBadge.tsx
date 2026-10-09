"use client";

import { useAuth } from "@/context/AuthContext";

const ROLE_STYLES: Record<string, string> = {
  admin: "tag-nova",
  maintainer: "tag-solar",
  contributor: "tag-plasma",
};

export default function RoleBadge() {
  const { user } = useAuth();
  if (!user || !user.role) return null;

  const style = ROLE_STYLES[user.role] ?? "tag-nova";

  return (
    <span className={`tag ${style} text-[10px] leading-none`}>
      {user.role}
    </span>
  );
}
