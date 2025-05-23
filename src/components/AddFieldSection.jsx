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

  const handleChange = (lang, name, value) => {
    // If a lang is provided, structure the change for multilingual data
    if (lang) {
      onChange(lang, name, value);
    } else {
      // For fields without a lang (e.g., image, status), just pass name and value
      onChange(name, value);
    }
  };

  const mapFields = fields.filter((field) => field.type === "map");
  const otherFields = fields.filter((field) => field.type !== "map");

  return (
    <>
      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
        {otherFields.map((field, index) => {
          if (field.showIf && !field.showIf(values)) return null;

          // Determine the value based on if 'lang' exists for the field
          const value = field.lang
            ? values?.[field.lang]?.[field.name] || ""
            : values?.[field.name] || "";

          return (
            <div
              key={`${field.lang || "no-lang"}-${field.name}-${index}`}
              className="space-y-2 !ms-3"
            >
              <label
                htmlFor={`${field.lang || "no-lang"}-${field.name}`}
                className="block text-sm !p-3 font-medium text-gray-700"
              >
                {field.placeholder}
              </label>
              {(() => {
                switch (field.type) {
                  case "input":
                    return (
                      <Input
                        id={`${field.lang || "no-lang"}-${field.name}`}
                        key={`${field.lang || "no-lang"}-${field.name}-${index}`}
                        type={field.inputType || "text"}
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
                      <div key={`${field.lang || "no-lang"}-${field.name}`} className="mb-4">
                        <input
                          type="time"
                          name={field.name}
                          value={value}
                          onChange={(e) =>
                            handleChange(field.lang, field.name, e.target.value)
                          }
                          className={`!ms-1 !px-10 !py-4 ${commonInputClass}`}
                        />
                      </div>
                    );
                  case "textarea":
                    return (
                      <Textarea
                        id={`${field.lang || "no-lang"}-${field.name}`}
                        key={`${field.lang || "no-lang"}-${field.name}-${index}`}
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
                        id={`${field.lang || "no-lang"}-${field.name}`}
                        key={`${field.lang || "no-lang"}-${field.name}-${index}`}
                        type="file"
                        onChange={(e) =>
                          handleChange(field.lang, field.name, e.target.files?.[0])
                        }
                        className={`h-[54px] !mt-4 flex items-center text-gray-500 ${commonInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200`}
                      />
                    );
                  case "location":
                    return (
                      <div
                        key={`${field.lang || "no-lang"}-${field.name}-${index}`}
                        className="relative"
                      >
                        <Input
                          id={`${field.lang || "no-lang"}-${field.name}`}
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
                      <Select
                        id={`${field.lang || "no-lang"}-${field.name}`}
                        key={`${field.lang || "no-lang"}-${field.name}-${index}`}
                        value={value}
                        onValueChange={(val) =>
                          handleChange(field.lang, field.name, val)
                        }
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
        {mapFields.map((field, index) => {
          if (field.showIf && !field.showIf(values)) return null;
          const value = field.lang
            ? values?.[field.lang]?.[field.name] || ""
            : values?.[field.name] || "";

          return (
            <div
              key={`map-${field.lang || "no-lang"}-${field.name}-${index}`}
              className="w-full space-y-2"
            >
              <label
                htmlFor={`map-${field.lang || "no-lang"}-${field.name}`}
                className="block text-sm !p-3 font-medium text-gray-700"
              >
                {field.placeholder ? field.placeholder : field.name}
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
    </>
  );
}