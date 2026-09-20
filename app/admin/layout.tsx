import { getCachedSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = !process.env.DATABASE_URL?.trim();
  const session = demoMode ? null : await getCachedSession();
  const user = session?.user ?? (demoMode ? {
    id: "demo-admin",
    name: "Demo Administrator",
    email: "admin@revo.demo",
    role: "admin",
  } : null);

  if (!user) {
    redirect("/");
  }

  // Check if user is admin
  if (user.role !== "admin") {
    // Redirect based on user role
    if (user.role === "facility_owner") {
      redirect("/owner");
    } else {
      redirect("/");
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader user={user} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-background p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
