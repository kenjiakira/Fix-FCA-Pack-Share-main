'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CommandManagementDialog } from './CommandManagementDialog'
import { Command } from '@/components/types/command'
import { Wrench } from 'lucide-react'

interface QuickCommandManagementButtonProps {
  command: Command
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onCommandUpdated?: () => void
}

export function QuickCommandManagementButton({
  command,
  variant = 'outline',
  size = 'sm',
  className = '',
  onCommandUpdated
}: QuickCommandManagementButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
        title="Quản lý lệnh"
      >
        <Wrench className="h-4 w-4 mr-2" />
        Quản lý
      </Button>

      <CommandManagementDialog
        command={command}
        open={isOpen}
        onOpenChange={setIsOpen}
        onCommandUpdated={onCommandUpdated}
      />
    </>
  )
}

