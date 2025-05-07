import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteDialog({   open,
  onOpenChange, onDelete, selectedRow }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white !p-10 rounded-lg shadow-md max-w-md">
        <DialogHeader>
          <DialogTitle className="text-bg-primary text-lg font-semibold">
            Confirm Deletion
          </DialogTitle>
        </DialogHeader>
        <p className="text-gray-600">
          Are you sure you want to delete the row "{selectedRow?.name}"? This action cannot be undone.
        </p>
        <DialogFooter className="mt-6">
          <Button
           
           onClick={() => onOpenChange(false)}
  
            variant="outline"
            className="border-bg-primary text-bg-primary hover:bg-teal-50 rounded-[10px] !p-3"
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            className="bg-red-600 text-white hover:bg-red-700 rounded-[10px] !p-3"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
