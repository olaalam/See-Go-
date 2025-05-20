// Add.jsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useState } from "react";
import MapModal from "@/components/MapModel";
import MapLocationPicker from "./MapLocationPicker";

export default function Add({ fields, values, onChange }) {
  const [showMap, setShowMap] = useState(false);

  const commonInputClass =
    "rounded-[15px] border border-gray-300 focus:border-bg-primary focus:ring-bg-primary";

  // Modified handleChange to include 'lang'
  const handleChange = (lang, name, value) => {
    if (onChange) {
      onChange(lang, name, value); // Pass lang to the parent's onChange
    }
  };

  // Separate map fields from other fields
  const mapFields = fields.filter(field => field.type === "map");
  const otherFields = fields.filter(field => field.type !== "map");

  return (
    <>
      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
        {otherFields.map((field, index) => {
          if (field.showIf && !field.showIf(values)) return null;

          // Access value using lang and name
          const value = values?.[field.lang]?.[field.name] || "";

          return (
            <div key={`${field.lang}-${field.name}-${index}`} className="space-y-2 !ms-3">
              <label
                htmlFor={`${field.lang}-${field.name}`} // Use a unique ID
                className="block text-sm !p-3 font-medium text-gray-700"
              >
                {field.placeholder}
              </label>
              {(() => {
                switch (field.type) {
                  case "input":
                    return (
                      <Input
                        id={`${field.lang}-${field.name}`}
                        key={`${field.lang}-${field.name}-${index}`}
                        type={field.inputType || "text"}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => handleChange(field.lang, field.name, e.target.value)} // Pass lang
                        className={`!ms-1 !px-5 !py-6 ${commonInputClass}`}
                      />
                    );
                  case "time":
                    // Note: Your time input uses values[field.name] directly, which is incorrect
                    // It should be values[field.lang][field.name]
                    return (
                      <div key={`${field.lang}-${field.name}`} className="mb-4">
                        <input
                          type="time"
                          name={field.name}
                          value={values?.[field.lang]?.[field.name] || ""} // Corrected value access
                          onChange={(e) => handleChange(field.lang, field.name, e.target.value)} // Pass lang
                          className={`!ms-1 !px-10 !py-4 ${commonInputClass}`}
                        />
                      </div>
                    );
                  case "textarea":
                    return (
                      <Textarea
                        id={`${field.lang}-${field.name}`}
                        key={`${field.lang}-${field.name}-${index}`}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => handleChange(field.lang, field.name, e.target.value)} // Pass lang
                        className={`min-h-[40px] !px-5 !py-6 ${commonInputClass}`}
                      />
                    );
                  case "file":
                    return (
                      <Input
                        id={`${field.lang}-${field.name}`}
                        key={`${field.lang}-${field.name}-${index}`}
                        type="file"
                        onChange={(e) =>
                          handleChange(field.lang, field.name, e.target.files?.[0]) // Pass lang
                        }
                        className={`h-[54px] !mt-4 flex items-center text-gray-500 ${commonInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200`}
                      />
                    );
                  case "location": // This will now work correctly for direct location input if you decide to use it
                    return (
                      <div key={`${field.lang}-${field.name}-${index}`} className="relative">
                        <Input
                          id={`${field.lang}-${field.name}`}
                          type="text"
                          placeholder={field.placeholder}
                          value={value}
                          onChange={(e) =>
                            handleChange(field.lang, field.name, e.target.value) // Pass lang
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
                              handleChange(field.lang, field.name, address); // Pass lang
                              setShowMap(false);
                            }}
                          />
                        )}
                      </div>
                    );
                  case "select":
                    return (
                      <Select
                        id={`${field.lang}-${field.name}`}
                        key={`${field.lang}-${field.name}-${index}`}
                        value={value}
                        onValueChange={(val) => handleChange(field.lang, field.name, val)} // Pass lang
                      >
                        <SelectTrigger
                          className={`w-full !ms-1 !px-5 !py-6 ${commonInputClass}`}
                        >
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-teal-600 rounded-md shadow-lg !p-3">
                          {field.options?.map((option, i) => (
                            <SelectItem key={i} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  default:
                    return null;
                }
              })()}
            </div>
          );
        })}
        {/* Render map fields first, outside the grid */}
        {mapFields.map((field, index) => {
          if (field.showIf && !field.showIf(values)) return null;
          // Access value using lang and name for map field
          const value = values?.[field.lang]?.[field.name] || "";

          return (
            <div key={`map-${field.lang}-${field.name}-${index}`} className="w-full space-y-2">
              <label
                htmlFor={`map-${field.lang}-${field.name}`}
                className="block text-sm !p-3 font-medium text-gray-700"
              >
                {field.placeholder ? field.placeholder : field.name}
              </label>
              <MapLocationPicker
                value={value} // Now passing string or undefined
                onChange={(val) => handleChange(field.lang, field.name, val)} // Pass lang
                placeholder={field.placeholder}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}