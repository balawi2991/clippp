import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StyleTab } from "./StyleTab";
import { CaptionsTab } from "./CaptionsTab";
import { Card } from "@/components/ui/card";

export const ControlPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("style");

  return (
    <Card className="h-full flex flex-col bg-card/95 backdrop-blur">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="style" className="text-sm font-medium">
            Style
          </TabsTrigger>
          <TabsTrigger value="captions" className="text-sm font-medium">
            Captions
          </TabsTrigger>
          <TabsTrigger value="media" disabled className="text-sm font-medium opacity-50">
            Video & Media
          </TabsTrigger>
          <TabsTrigger value="music" disabled className="text-sm font-medium opacity-50">
            Music
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-6">
          <TabsContent value="style" className="mt-0">
            <StyleTab />
          </TabsContent>

          <TabsContent value="captions" className="mt-0">
            <CaptionsTab />
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              Source will be connected later.
            </div>
          </TabsContent>

          <TabsContent value="music" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              Music features coming soon.
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};
