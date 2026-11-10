"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EntityInputCombobox } from "@/components/ui/entity-input-combobox";
import { useTeammateOptions } from "@/hooks/use-teammate-options";
import type { TeamRole } from "@/services/team/team-types";
import type { Teammate } from "@/services/user";
import { TeammateOption } from "./teammate-option";
import { RoleSelect } from "./role-select";

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (email: string, role: TeamRole) => Promise<void>;
};

export function AddMemberDialog({
  open,
  onOpenChange,
  onAdd,
}: AddMemberDialogProps) {
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<Teammate | null>(null);
  const [role, setRole] = React.useState<TeamRole>("member");
  const [pending, setPending] = React.useState(false);
  const { items, isLoading } = useTeammateOptions(query);

  const email = picked?.email ?? query.trim();

  const changeOpen = (next: boolean) => {
    if (!next) {
      setQuery("");
      setPicked(null);
      setRole("member");
    }
    onOpenChange(next);
  };

  const submit = async () => {
    setPending(true);
    try {
      await onAdd(email, role);
      changeOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-member-person">Person</Label>
            <EntityInputCombobox
              items={items}
              getKey={(u) => u.email.toLowerCase()}
              getLabel={(u) => u.email || u.name}
              renderItem={(u) => <TeammateOption user={u} />}
              emptyText={isLoading ? "Searching..." : "No teammates found."}
              query={picked ? picked.email : query}
              onQueryChange={(q, reason) => {
                // base-ui clears the input after a pick; keep the pick.
                if (reason === "input-clear") return;
                setPicked(null);
                setQuery(q);
              }}
              onToggle={setPicked}
              id="add-member-person"
              placeholder="Search by name or enter an email"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-member-role">Role</Label>
            <RoleSelect id="add-member-role" value={role} onChange={setRole} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => changeOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!email || pending} onClick={submit}>
            Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
