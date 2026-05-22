"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The admin login is now the general sign-in page. Keep this path working for
// old links/bookmarks by redirecting.
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
