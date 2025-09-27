import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface WarnUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warnReason: string
  onWarnReasonChange: (reason: string) => void
  onSubmit: () => void
}

export default function WarnUserDialog({
  open,
  onOpenChange,
  warnReason,
  onWarnReasonChange,
  onSubmit
}: WarnUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cảnh báo người dùng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="warn-reason">Lý do cảnh báo</Label>
            <Textarea
              id="warn-reason"
              placeholder="Nhập lý do cảnh báo..."
              value={warnReason}
              onChange={(e) => onWarnReasonChange(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={onSubmit} disabled={!warnReason.trim()}>
              Cảnh báo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
