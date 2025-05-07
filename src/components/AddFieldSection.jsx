import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Add({ fields, lang, values, onChange }) {
  const commonInputClass =
    "rounded-[15px] border border-gray-300  focus:border-bg-primary focus:ring-bg-primary";

  const handleChange = (name, value) => {
    if (onChange) {
      onChange(lang, name, value);
    }
  };

  return (
    <div className="grid   w-[90%] grid-cols-1 md:grid-cols-3 gap-4">
      {fields.map((field, index) => {
        if (field.showIf && !field.showIf(values)) return null;
        const value = values?.[field.name] || "";

        return (
          <div key={index} className="space-y-2 !ms-3">
            <label
              htmlFor={field.name}
              className="block text-sm !p-3 font-medium text-gray-700"
            >
              {field.placeholder}
            </label>
            {(() => {
              switch (field.type) {
                case "input":
                  return (
                    <Input
                      id={field.name}
                      key={index}
                      type={field.inputType || "text"}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={`!ms-1 !px-5 !py-6 ${commonInputClass}`}
                    />
                  );

                case "textarea":
                  return (
                    <Textarea
                      id={field.name}
                      key={index}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={`min-h-[40px] !px-5 !py-6 ${commonInputClass}`}
                    />
                  );

                case "file":
                  return (
                    <Input
                      id={field.name}
                      key={index}
                      type="file"
                      onChange={(e) => handleChange(field.name, e.target.files?.[0])}
                      className={`h-[54px] flex items-center text-gray-500 ${commonInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200`}
                    />
                  );

                case "select":
                  return (
                    <Select
                      id={field.name}
                      key={index}
                      value={value}
                      onValueChange={(val) => handleChange(field.name, val)}
                    >
                      <SelectTrigger className={`w-full !ms-1 !px-5 !py-6 ${commonInputClass}`}>
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
    </div>
  );
}
