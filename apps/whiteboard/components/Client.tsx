"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Client() {
  const router = useRouter();

  useEffect(() => {
    router.push("/rooms");
  }, [router]);

  return null;
}
