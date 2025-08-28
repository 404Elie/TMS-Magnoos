import ModernSidebar from "./ModernSidebar";

interface ModernLayoutProps {
  children: React.ReactNode;
  currentRole?: string;
}

export default function ModernLayout({ children, currentRole }: ModernLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ModernSidebar currentRole={currentRole} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}