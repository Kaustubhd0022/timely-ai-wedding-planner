import { Sidebar } from "@/components/sidebar";
import { SaathiChatClient } from "@/components/saathi-chat-client";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
      <SaathiChatClient />
    </>
  );
}
