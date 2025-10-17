"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CalendarPopoverProps {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

export function CalendarPopover({ selected, onSelect, placeholder }: CalendarPopoverProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {selected ? selected.toLocaleDateString() : placeholder || "Select date"}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          onSelect={(date) => {
            onSelect(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
