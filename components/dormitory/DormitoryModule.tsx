"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplicationForm from "./ApplicationForm";
import StudentList from "./StudentList";
import RoomGrid from "./RoomGrid";
import ScoringCriteria from "./ScoringCriteria";
import { FileText, Users, Building2, Scale } from "lucide-react";

export default function DormitoryModule() {
  return (
    <Tabs defaultValue="students" className="space-y-4">
      <TabsList className="grid w-full max-w-xl grid-cols-4">
        <TabsTrigger value="students" className="gap-1.5">
          <Users className="w-3.5 h-3.5" />
          학생 목록
        </TabsTrigger>
        <TabsTrigger value="apply" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          신청서 접수
        </TabsTrigger>
        <TabsTrigger value="rooms" className="gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          호실 배정
        </TabsTrigger>
        <TabsTrigger value="criteria" className="gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          배점 기준
        </TabsTrigger>
      </TabsList>

      <TabsContent value="students">
        <StudentList />
      </TabsContent>

      <TabsContent value="apply">
        <div className="max-w-xl">
          <ApplicationForm />
        </div>
      </TabsContent>

      <TabsContent value="rooms">
        <RoomGrid />
      </TabsContent>

      <TabsContent value="criteria">
        <ScoringCriteria />
      </TabsContent>
    </Tabs>
  );
}
