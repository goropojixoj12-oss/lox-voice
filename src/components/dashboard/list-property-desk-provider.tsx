"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  AGENT_LIST_PROPERTY_DESK,
  type ListPropertyDeskConfig,
} from "@/lib/list-property-desk";

const ListPropertyDeskContext = createContext<ListPropertyDeskConfig>(AGENT_LIST_PROPERTY_DESK);

export function ListPropertyDeskProvider({
  desk,
  children,
}: {
  desk: ListPropertyDeskConfig;
  children: ReactNode;
}) {
  return (
    <ListPropertyDeskContext.Provider value={desk}>{children}</ListPropertyDeskContext.Provider>
  );
}

export function useListPropertyDesk(): ListPropertyDeskConfig {
  return useContext(ListPropertyDeskContext);
}
