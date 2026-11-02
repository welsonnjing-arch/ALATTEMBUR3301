"use client";

import React from "react";
import { TeamBoardCanvasView } from "./TeamBoardCanvasView";
import { CanvasViewportState, TeamBoardItem } from "@/modules/projects/types";

export interface TeamBoardViewProps {
  initialItems: TeamBoardItem[];
  initialViewport?: CanvasViewportState;
  currentUserRole?: string;
}

export function TeamBoardView(props: TeamBoardViewProps) {
  return <TeamBoardCanvasView {...props} />;
}

export { TeamBoardCanvasView };
