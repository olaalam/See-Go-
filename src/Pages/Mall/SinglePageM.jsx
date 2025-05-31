import { useEffect, useState } from "react";
import SinglePageCompo from "@/components/SinglePageCompo";
import { useParams, Outlet } from "react-router-dom";
import Loading from "@/components/Loading";

export default function SinglePageM() {
  const { id } = useParams();
  const [mallData, setmallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [adminColumns] = useState([
    { label: "mall Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Role", key: "role" },
  ]);

  useEffect(() => {
    async function fetchmall() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token");

        const res = await fetch(
          `https://bcknd.sea-go.org/admin/mall/item/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();

        const transformedData = {
          name: json.mall.name,
          image: json.mall.image_link || "",
          //location: json.mall.location,
          description: json.mall.description,
          open_from: json.mall.open_from,
          open_to: json.mall.open_to,
          zone: json.mall.zone?.name || "—",
        };

        setStatus(json.mall.status === 1 ? "Active" : "Inactive");
        setmallData(transformedData);
      } catch (err) {
        console.error("Error fetching mall data:", err.message);
        setError("Failed to load mall data.");
      } finally {
        setLoading(false);
      }
    }

    fetchmall();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <p className="text-center text-red-500 mt-4">{error}</p>;

  if (!mallData)
    return (
      <p className="text-center text-red-500 mt-4">No mall data found.</p>
    );

  return (
    <>
      <SinglePageCompo
        data={mallData}
        status={status}
        adminColumns={adminColumns}
      />
      <Outlet />
    </>
  );
}
