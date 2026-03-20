"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { SaathiChat } from "./saathi-chat";

function SaathiChatWrapper() {
  const searchParams = useSearchParams();
  const [weddingId, setWeddingId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
    }
  }, [searchParams]);

  if (!weddingId) return null;

  return <SaathiChat weddingId={weddingId} />;
}

export function SaathiChatClient() {
  return (
    <Suspense fallback={null}>
      <SaathiChatWrapper />
    </Suspense>
  );
}
