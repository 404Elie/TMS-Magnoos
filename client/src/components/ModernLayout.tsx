import ModernSidebar from "@/components/ModernSidebar";

interface ModernLayoutProps {
  children: React.ReactNode;
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ModernSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-gradient-to-br from-background to-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}