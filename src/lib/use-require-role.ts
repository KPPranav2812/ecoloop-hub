import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useStore, currentUser } from "@/lib/store";
import type { Role } from "@/lib/types";

export function useRequireRole(role: Role) {
  const me = useStore((s) => currentUser(s));
  const router = useRouter();
  useEffect(() => {
    if (!me) router.navigate({ to: "/" });
    else if (me.role !== role) {
      const map: Record<Role, string> = {
        admin: "/admin",
        contributor: "/contributor",
        agent: "/agent",
        compost: "/compost",
        farmer: "/farmer",
      };
      router.navigate({ to: map[me.role] });
    }
  }, [me, role, router]);
  return me;
}
