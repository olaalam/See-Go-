// components/ui/selectPopover.jsx
import { useRef, useState, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"

export default function SelectPopover({ value, options = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
      }}
      modal={true}
    >
      <PopoverTrigger asChild>
        <div className="w-full cursor-pointer border px-4 py-2 rounded-md bg-white shadow-sm text-left text-sm">
          {selectedLabel}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={true}>
          <CommandInput autoFocus ref={inputRef} placeholder={`Search ${placeholder}`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
