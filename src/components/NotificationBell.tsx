"use client";

import { BellIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function NotificationBell({ unreadCount }: { unreadCount: String }) {
  return (
    <Link href="/notifications" className="relative">
      <BellIcon className="w-6 h-6 text-gray-600 hover:text-black cursor-pointer" />

      {unreadCount != "0" && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {Number(unreadCount)}
        </Badge>
      )}
    </Link>
  );
}

export default NotificationBell;
