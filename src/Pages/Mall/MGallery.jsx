import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/components/Loading";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ✅ مكون ImageCard
function ImageCard({ imageUrl, onDelete }) {
  return (
    <div className="relative rounded-md overflow-hidden shadow-md">
      <img
        src={imageUrl}
        alt="Gallery"
        className="w-full h-auto aspect-square object-cover"
      />
      <Button
        onClick={onDelete}
        className="absolute cursor-pointer top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center bg-gray-800 text-white hover:bg-bg-primary"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ✅ مكون Gallery
function Gallery({ mallId, token }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/update_profile_image/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (Array.isArray(data.mall_gallary)) {
        setImages(data.mall_gallary);
      } else {
        console.error("Unexpected API response:", data);
        toast.error("Failed to load images.");
      }
    } catch (error) {
      console.error("Failed to fetch gallery images:", error);
      toast.error("Error loading gallery.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/update_profile_image/delete/${imageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== imageId)
        );
        toast.success("Image deleted successfully.");
      } else {
        toast.error("Failed to delete image.");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Error deleting image.");
    }
  };

  useEffect(() => {
    fetchGalleryImages();
  }, [mallId]);

  if (loading) return <Loading />;

  return (
    <div className="grid !p-4 !m-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {images.length > 0 ? (
        images.map((img) => (
          <ImageCard
            key={img.id}
            imageUrl={img.image_link}
            onDelete={() => handleDelete(img.id)}
          />
        ))
      ) : (
        <p className="text-center col-span-full">No images found.</p>
      )}
    </div>
  );
}

// ✅ مكون Header
function Header({ onUploadSuccess }) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("1");

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("status", status);
    formData.append("mall_id", id);

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/update_profile_image/add/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setOpenAddDialog(false);
        setImageFile(null);
        setStatus("1");
        onUploadSuccess();
        toast.success("Image uploaded successfully.");
      } else {
        toast.error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image.");
    }
  };

  return (
    <div className="flex justify-end space-x-2 p-4">
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogTrigger asChild>
          <Button className="bg-bg-primary text-white cursor-pointer !px-4 !py-2 rounded-[16px] hover:bg-teal-500 transition-all ">
            Add{" "}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white !p-6 border-none rounded-lg shadow-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">
              Add New Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full !mb-3 cursor-pointer text-sm text-gray-500 file:!mr-4 file:!py-2 file:!px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bg-primary file:text-white hover:file:bg-teal-600"
            />
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger
                id="status"
                className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[8px]"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                <SelectItem value="1" className="text-bg-primary">
                  Active
                </SelectItem>
                <SelectItem value="0" className="text-bg-primary">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-6">
            <Button
              onClick={() => setOpenAddDialog(false)}
              variant="outline"
              className="border !px-3 !py-2 cursor-pointer border-teal-500 hover:bg-bg-primary hover:text-white transition-all text-bg-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImageUpload}
              className="bg-bg-primary border border-teal-500 hover:bg-white  hover:text-bg-primary transition-all  !px-3 !py-2 cursor-pointer text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ✅ الصفحة الرئيسية
export default function VGalleryPage() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!id) {
    return (
      <p className="text-center text-red-600 font-medium py-8">
       mall ID is missing in URL.
      </p>
    );
  }

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Header onUploadSuccess={handleUploadSuccess} />
      <Gallery mallId={id} token={token} key={refreshKey} />
    </div>
  );
}
