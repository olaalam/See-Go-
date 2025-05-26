// src/components/InvoiceDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Adjust path as needed
import InvoiceCard from "@/Pages/Invoice/Invoice";

const InvoiceDialog = ({ open, onOpenChange, villageId }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] !p-0 border-none shadow-none overflow-hidden">

        <div className="!m-3 !p-3">
          <InvoiceCard villageId={villageId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;