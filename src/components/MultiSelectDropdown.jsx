// src/components/MultiSelectDropdown.jsx
import React from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // تأكد إن مسار الكومبوننت ده صح عندك

export default function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder,
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleSelectChange = (itemValue) => {
    let newValues;
    if (selectedValues.includes(itemValue)) {
      // لو القيمة موجودة بالفعل، شيلها
      newValues = selectedValues.filter((val) => val !== itemValue);
    } else {
      // لو القيمة مش موجودة، ضيفها
      newValues = [...selectedValues, itemValue];
    }
    // نادي الـ onChange prop بالمصفوفة الجديدة للقيم المختارة
    onChange(newValues);
  };

  return (
    <Select
      // onValueChange مش بنستخدمها هنا لأننا بنتعامل مع الاختيار يدويًا
      // الكومبوننت ده بيُستخدم بشكل أساسي عشان شكله (Trigger و Content)
      onValueChange={() => {}}
      value={selectedValues.length > 0 ? "selected" : ""} // قيمة وهمية عشان نمنع التحذيرات، القيمة الفعلية بتُدار بواسطة الـ Checkboxes
    >
      <SelectTrigger className="w-full !ms-1 !px-5 !py-6 rounded-[15px] border border-gray-300 focus:border-bg-primary focus:ring-bg-primary">
        <SelectValue placeholder={placeholder}>
          {selectedValues.length > 0
            ? selectedValues.join(", ") 
            : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white border-teal-600 rounded-md shadow-lg !ms-3 !p-3">
        {options.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
            onClick={() => handleSelectChange(option.value)}
          >
            <Checkbox checked={selectedValues.includes(option.value)} />
            <label className="text-sm   !ps-2 !mb-1 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {option.label}
            </label>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}