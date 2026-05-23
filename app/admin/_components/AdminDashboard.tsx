"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Lightbulb, PlusCircle } from "lucide-react";
import ReportsPanel from "./ReportsPanel";
import WishlistPanel from "./WishlistPanel";
import AddEventPanel from "./AddEventPanel";

export default function AdminDashboard() {
  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="reports" className="gap-1.5">
          <ClipboardList className="h-4 w-4" />
          回報審核
        </TabsTrigger>
        <TabsTrigger value="wishlist" className="gap-1.5">
          <Lightbulb className="h-4 w-4" />
          功能許願
        </TabsTrigger>
        <TabsTrigger value="add" className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          手動新增
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="mt-4">
        <ReportsPanel />
      </TabsContent>

      <TabsContent value="wishlist" className="mt-4">
        <WishlistPanel />
      </TabsContent>

      <TabsContent value="add" className="mt-4">
        <AddEventPanel />
      </TabsContent>
    </Tabs>
  );
}
