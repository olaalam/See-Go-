"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function EditDialog({
  open,
  onOpenChange,
  selectedRow,
  children,
  onSave,
}) {
  if (!selectedRow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white !p-6 rounded-lg shadow-lg max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-bg-primary">Edit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter className="!pt-6">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border border-bg-primary cursor-pointer !p-4 text-bg-primary rounded-md"
          >
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-bg-primary  cursor-pointer !p-4 text-white rounded-md">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
