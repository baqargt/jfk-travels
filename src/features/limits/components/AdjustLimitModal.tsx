import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";

interface AdjustLimitModalProps {
  open: boolean;
  onClose: () => void;
  mode: "cash" | "credit" | "temp";
}

const titles: Record<AdjustLimitModalProps["mode"], { title: string; submit: string }> = {
  cash: { title: "Allocate Cash", submit: "Allocate Funds" },
  credit: { title: "Request Credit Limit Change", submit: "Submit Request" },
  temp: { title: "Extend Temporary Limit", submit: "Approve Extension" },
};

export default function AdjustLimitModal({ open, onClose, mode }: AdjustLimitModalProps) {
  const t = titles[mode];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.title}
      subtitle="Changes are audited and take effect immediately after approval."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>{t.submit}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Amount (USD)" required>
          <Input type="number" min={0} placeholder="0.00" />
        </FormField>
        <FormField label="Effective date">
          <Input type="date" defaultValue="2026-08-23" />
        </FormField>
        <FormField label="Reason" required className="sm:col-span-2">
          <Select defaultValue="">
            <option value="" disabled>
              Select a reason...
            </option>
            {[
              "Operational float top-up",
              "Festive / peak season demand",
              "Group booking handling",
              "Corporate account overflow",
              "Other (specify in remarks)",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea placeholder="Context for the finance approver..." />
        </FormField>
      </div>
    </Modal>
  );
}
