"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorForm from "./VendorForm";
import VendorList from "./VendorList";
import { List, PlusCircle } from "lucide-react";

export default function ProcurementModule() {
  return (
    <Tabs defaultValue="list" className="space-y-4">
      <TabsList className="grid w-full max-w-xs grid-cols-2">
        <TabsTrigger value="list" className="gap-1.5">
          <List className="w-3.5 h-3.5" />
          업체 순위표
        </TabsTrigger>
        <TabsTrigger value="register" className="gap-1.5">
          <PlusCircle className="w-3.5 h-3.5" />
          업체 등록
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <VendorList />
      </TabsContent>

      <TabsContent value="register">
        <div className="max-w-xl">
          <VendorForm />
        </div>
      </TabsContent>
    </Tabs>
  );
}
