import { useState, useEffect } from "react";
import { useGet } from "@/Hooks/UseGet";
import Add from "@/components/AddFieldSection";
import { useSearchParams } from "react-router-dom";

export const useAppartmentForm = (
  apiUrl,
  isEdit = false,
  initialData = null,
  enabled = false,
) => {
  const [searchParams] = useSearchParams();
  const urlVillageId = searchParams.get("village_id") || "";

  const [formData, setFormData] = useState({
    en: {
      name: "",
      type: "",
      map: "",
      village_id: urlVillageId,
    },
  });

  const shouldFetch = !isEdit || enabled;

  const { loading: loadingTypes, data: typesData } = useGet(
    shouldFetch ? { url: `${apiUrl}/appartment/appartement_list` } : {},
  );

  const { loading: loadingVillages, data: villagesData } = useGet(
    shouldFetch ? { url: `${apiUrl}/appartment/village_list` } : {},
  );

  const [types, setTypes] = useState([]);
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        en: {
          name: initialData.name || "",
          type:
            initialData.appartment_type_id?.toString() ||
            initialData.type?.toString() ||
            "",
          map: initialData.map || "",
          village_id: initialData.village_id?.toString() || "",
        },
      });
    }
  }, [initialData, isEdit]);

  useEffect(() => {
    if (!isEdit && urlVillageId) {
      setFormData((prev) => ({
        en: {
          ...prev.en,
          village_id: urlVillageId,
        },
      }));
    }
  }, [urlVillageId, isEdit]);

  useEffect(() => {
    if (!shouldFetch || !typesData) return;

    const rawList = typesData?.appartment_type || [];

    if (rawList.length > 0) {
      const typeOptions = rawList.map((item) => ({
        label: item.name || item.ar_name || `Type ${item.id}`,
        value: item.id.toString(),
      }));
      setTypes(typeOptions);
    }
  }, [typesData, shouldFetch]);

  useEffect(() => {
    if (!shouldFetch || !villagesData) return;

    const rawVillages =
      villagesData?.villages?.data ||
      villagesData?.villages ||
      villagesData?.data ||
      [];
    const list = Array.isArray(rawVillages) ? rawVillages : [];

    if (list.length > 0) {
      const villageOptions = list.map((item) => ({
        label: item.name || item.title || `Village ${item.id}`,
        value: item.id.toString(),
      }));
      setVillages(villageOptions);
    }
  }, [villagesData, shouldFetch]);

  // 🛠️ تحديث الدالة لتصبح Polymorphic فائقة الأمان
  const handleFieldChange = (langOrEvent, name, value) => {
    setFormData((prev) => {
      let lang = "en";
      let fieldName = name;
      let fieldValue = value;

      // 1. إذا كان المستدعي حدث Event طبيعي (Bubbling)
      if (langOrEvent && langOrEvent.target) {
        fieldName = langOrEvent.target.name;
        fieldValue = langOrEvent.target.value;
        lang = "en";
      }
      // 2. إذا تم تمرير متغيرين فقط (name, value)
      else if (name !== undefined && value === undefined) {
        fieldName = langOrEvent;
        fieldValue = name;
        lang = "en";
      }
      // 3. إذا تم تمرير 3 متغيرات بشكل طبيعي (lang, name, value)
      else {
        lang = langOrEvent || "en";
      }

      if (!fieldName) return prev;

      return {
        ...prev,
        [lang]: {
          ...prev[lang],
          [fieldName]: fieldValue?.toString() || "", // تحويل دائم لنص لمنع مشاكل الـ Select
        },
      };
    });
  };

  const prepareFormData = () => {
    const body = new FormData();
    body.append("unit", formData.en.name);
    body.append("appartment_type_id", formData.en.type);
    body.append("village_id", formData.en.village_id);
    if (formData.en.map) {
      body.append("location", formData.en.map);
    }
    return body;
  };

  const fields = [
    { type: "input", placeholder: "Unit Name", name: "name", required: true },
    {
      type: "select",
      placeholder: "Type",
      name: "type",
      options: types,
      value: formData.en.type,
    },
    {
      type: "select",
      placeholder: "Village",
      name: "village_id",
      options: villages,
      value: formData.en.village_id,
      disabled: !!urlVillageId && !isEdit,
    },
    { type: "map", placeholder: "Enter Location", name: "map" },
  ];

  const totalLoading = loadingTypes || loadingVillages;

  return {
    formData,
    fields,
    handleFieldChange,
    prepareFormData,
    loading: totalLoading,
    loadingAppartment: totalLoading,
  };
};

export const AppartmentFormFields = ({
  fields,
  formData,
  handleFieldChange,
  loading,
}) => {
  if (loading) {
    return <div>Loading form data</div>;
  }

  return (
    <div className="relative z-50">
      <Add
        fields={fields}
        lang="en"
        values={formData.en}
        // ✅ مرري الدالة مباشرة بدون شروط طول الـ args لتأخذ حريتها الكاملة في التعامل مع الـ Select والـ Inputs
        onChange={handleFieldChange}
      />
    </div>
  );
};
