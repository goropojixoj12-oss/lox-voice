"use client";

import { createContext, useContext, type ReactNode } from "react";
import { adminEditAgentPath } from "@/lib/admin-edit-agent-paths";
import { ADMIN_DESK_BASE, adminDeskPath } from "@/lib/dashboard-admin-paths";
import { AGENT_DESK_BASE, agentDeskPath } from "@/lib/dashboard-agent-paths";

export type ListPropertyDeskConfig = {
  base: string;
  afterSubmitPath: string;
  /** When an admin creates a listing on behalf of an agent account. */
  actingUserId?: string;
};

const ListPropertyDeskContext = createContext<ListPropertyDeskConfig>({
  base: AGENT_DESK_BASE,
  afterSubmitPath: `${agentDeskPath("listings")}?submitted=pending`,
});

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

export const AGENT_LIST_PROPERTY_DESK: ListPropertyDeskConfig = {
  base: AGENT_DESK_BASE,
  afterSubmitPath: `${agentDeskPath("listings")}?submitted=pending`,
};

export const ADMIN_LIST_PROPERTY_DESK: ListPropertyDeskConfig = {
  base: ADMIN_DESK_BASE,
  afterSubmitPath: `${adminDeskPath("listings")}?submitted=pending`,
};

export function adminEditAgentListPropertyDesk(
  agentSlug: string,
  actingUserId: string,
): ListPropertyDeskConfig {
  const base = adminEditAgentPath(agentSlug);
  return {
    base,
    afterSubmitPath: `${adminEditAgentPath(agentSlug, "listings")}?submitted=pending`,
    actingUserId,
  };
}
