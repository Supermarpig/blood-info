import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import AdminDashboard from "./_components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">回報管理後台</h1>
          <p className="text-sm text-gray-500">
            審核使用者回報、手動新增活動、設定表單選項
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <Button variant="outline" size="sm" type="submit" className="gap-1.5">
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </form>
      </header>

      <AdminDashboard />
    </div>
  );
}
