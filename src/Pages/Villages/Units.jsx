import Appartments from "@/Pages/Appartment/Appartments";
import { useParams } from "react-router-dom";

export default function VUnit() {
  const { id } = useParams();
  return <Appartments villageId={id} />;
}