"use client";
import LandingPage from "@/components/LandingPage";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/services/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      if (token) {
        router.replace("/rooms");
      }
    }
  }, [router]);

  return <LandingPage />;
}
