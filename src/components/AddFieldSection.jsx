import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import React, { useState, useEffect, useMemo, memo } from "react";
import { Switch } from "@/components/ui/switch";
import MapModal from "@/components/MapModel";
import MapLocationPicker from "./MapLocationPicker";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { cn } from "@/lib/utils";

export default function Add({ fields, values, onChange }) {
  const [showMap, setShowMap] = useState(false);

  const commonInputClass =
    "rounded-[15px] border border-gray-300 focus:border-bg-primary focus:ring-bg-primary";

  const handleChange = (lang, name, value) => {
    const currentValue = lang ? values?.[lang]?.[name] : values?.[name];
    if (currentValue === value) return; // prevent unnecessary state updates
    if (lang) {
      onChange(lang, name, value);
    } else {
      onChange(name, value);
    }
  };

  const mapFields = useMemo(
    () => fields.filter((field) => field.type === "map"),
    [fields],
  );
  const otherFields = useMemo(
    () => fields.filter((field) => field.type !== "map"),
    [fields],
  );

  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
      {otherFields.map((field, index) => {
        if (field.showIf && !field.showIf(values)) return null;

        const fieldId = `${field.lang || "no-lang"}-${field.name}`;
        const value = field.lang
          ? values?.[field.lang]?.[field.name] || ""
          : values?.[field.name] || "";

        return (
          <div key={`${fieldId}-${index}`} className="space-y-2 !ms-3">
            <label
              htmlFor={fieldId}
              className="block text-sm !p-3 font-medium text-gray-700"
            >
              {field.placeholder}
            </label>

            {(() => {
              switch (field.type) {
                case "input":
                case "number":
                  return (
                    <Input
                      id={fieldId}
                      type={field.inputType || field.type}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) =>
                        handleChange(field.lang, field.name, e.target.value)
                      }
                      className={`!ms-1 !px-5 !py-6 ${commonInputClass}`}
                    />
                  );
                case "time":
                  return (
                    <input
                      id={fieldId}
                      type="time"
                      value={value}
                      onChange={(e) =>
                        handleChange(field.lang, field.name, e.target.value)
                      }
                      className={`!ms-1 !px-10 !py-4 ${commonInputClass}`}
                    />
                  );
                case "textarea":
                  return (
                    <Textarea
                      id={fieldId}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) =>
                        handleChange(field.lang, field.name, e.target.value)
                      }
                      className={`min-h-[40px] !px-5 !py-6 ${commonInputClass}`}
                    />
                  );
                case "file":
                  return (
                    <Input
                      id={fieldId}
                      type="file"
                      accept={field.accept || "image/*"}
                      onChange={(e) =>
                        handleChange(
                          field.lang,
                          field.name,
                          e.target.files?.[0],
                        )
                      }
                      className={`h-[54px] !mt-4 text-gray-500 ${commonInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200`}
                    />
                  );
                case "location":
                  return (
                    <div className="relative">
                      <Input
                        id={fieldId}
                        type="text"
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) =>
                          handleChange(field.lang, field.name, e.target.value)
                        }
                        className={`!ms-1 !px-12 !py-6 ${commonInputClass}`}
                      />
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 cursor-pointer"
                        onClick={() => setShowMap(true)}
                      />
                      {showMap && (
                        <MapModal
                          onClose={() => setShowMap(false)}
                          onSelect={(address) => {
                            handleChange(field.lang, field.name, address);
                            setShowMap(false);
                          }}
                        />
                      )}
                    </div>
                  );
                case "select":
                  return (
                    <ComboboxComponent
                      options={field.options}
                      value={value}
                      onValueChange={(val) =>
                        handleChange(field.lang, field.name, val)
                      }
                      placeholder={field.placeholder}
                      fieldId={fieldId}
                      commonInputClass={commonInputClass}
                    />
                  );
                case "switch":
                  const isChecked =
                    typeof value === "string"
                      ? value === "active" || value === "1"
                      : Boolean(value);
                  return (
                    <div className="flex items-center space-x-4 mt-2">
                      <Switch
                        id={fieldId}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleChange(
                            field.lang,
                            field.name,
                            checked ? "active" : "inactive",
                          )
                        }
                      />
                      <label
                        htmlFor={fieldId}
                        className="text-sm font-medium text-gray-700"
                      >
                        {field.placeholder}
                      </label>
                    </div>
                  );
                case "multi-select":
                  return (
                    <MultiSelectDropdown
                      id={fieldId}
                      options={field.options}
                      value={value}
                      onChange={(val) =>
                        handleChange(field.lang, field.name, val)
                      }
                      placeholder={field.placeholder}
                    />
                  );
                default:
                  console.warn(`Unsupported field type: ${field.type}`);
                  return null;
              }
            })()}
          </div>
        );
      })}

      {mapFields.map((field, index) => {
        if (field.showIf && !field.showIf(values)) return null;

        const fieldId = `map-${field.lang || "no-lang"}-${field.name}`;
        const value = field.lang
          ? values?.[field.lang]?.[field.name] || ""
          : values?.[field.name] || "";

        return (
          <div key={`${fieldId}-${index}`} className="w-full space-y-2">
            <label
              htmlFor={fieldId}
              className="block text-sm !p-3 font-medium text-gray-700"
            >
              {field.placeholder || field.name}
            </label>
            <MapLocationPicker
              value={value}
              onChange={(val) => handleChange(field.lang, field.name, val)}
              placeholder={field.placeholder}
            />
          </div>
        );
      })}
    </div>
  );
}


// ملحوظة: شلنا الـ comparator المخصص بتاع الـ memo لأنه كان بيمنع الريندر
// لما الـ value يفضل زي ما هو، وده كان بيخلي الكومبوننت يحتفظ بنسخة قديمة (Stale)
// من onValueChange/options لو الأب عمل ريندر لأي سبب تاني (زي تغيير سويتش في نفس الصفحة).
const ComboboxComponent = memo(({
  options,
  value,
  onValueChange,
  placeholder,
  fieldId,
  commonInputClass,
}) => {
  const [open, setOpen] = useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const selectedLabel = options.find(
    (option) => String(option.value) === String(value)
  )?.label;

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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            `w-full justify-between !ms-1 !px-5 !py-6 ${commonInputClass}`,
            !value && "text-muted-foreground",
          )}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 z-[9999]"
        side="bottom"
        align="start"
        sideOffset={5}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={true}>
          <CommandInput autoFocus ref={inputRef} placeholder={`Search ${placeholder}...`} />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(option.value) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});