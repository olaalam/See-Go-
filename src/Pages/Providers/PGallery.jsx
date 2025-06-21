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
  Switch
} from "@/components/ui/switch";
import { Label } from "@radix-ui/react-dropdown-menu";

const getUserPermissions = () => {
  try {
    const permissions = localStorage.getItem("userPermission");
    const parsed = permissions ? JSON.parse(permissions) : [];
    return parsed.map((perm) => `${perm.module}:${perm.action}`);
  } catch (error) {
    console.error("Error parsing permissions:", error);
    return [];
  }
};

const hasPermission = (permissions, key) => {
  const match = key.match(/^Provider Gallery(.*)$/i);
  if (!match) return false;
  const action = match[1].toLowerCase();
  return permissions.includes(`Provider Gallery:${action}`);
};

function ImageCard({ imageUrl, onDelete }) {
  return (
    <div className="relative rounded-md overflow-hidden shadow-md">
      <img
        src={imageUrl}
        alt="Gallery"
        className="w-full h-auto aspect-square"
      />
      {onDelete && (
        <Button
          onClick={onDelete}
          className="absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center bg-gray-800 text-white hover:bg-bg-primary"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function Gallery({ providerId, token, canDelete }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_gallary/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (Array.isArray(data.provider_gallary)) {
        setImages(data.provider_gallary);
      } else {
        toast.error("Failed to load images.");
      }
    } catch (error) {
      toast.error("Error loading gallery.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_gallary/delete/${imageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Image deleted successfully.");
      } else {
        toast.error("Failed to delete image.");
      }
    } catch (error) {
      toast.error("Error deleting image.");
    }
  };

  useEffect(() => {
    fetchGalleryImages();
  }, [providerId]);

  if (loading) return <Loading />;

  return (
    <div className="grid !p-4 !m-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.length > 0 ? (
        images.map((img) => (
          <ImageCard
            key={img.id}
            imageUrl={img.image_link}
            onDelete={canDelete ? () => handleDelete(img.id) : null}
          />
        ))
      ) : (
        <p className="text-center col-span-full">No images found.</p>
      )}
    </div>
  );
}

function Header({ onUploadSuccess, canAdd }) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("1");
  const [statusActive, setStatusActive] = useState(true);

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image.");
      return;
    }
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("status", statusActive ? "1" : "0");
    formData.append("provider_id", id);

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_gallary/add/${id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
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
      toast.error("Error uploading image.");
    }
  };

  if (!canAdd) return null;

  return (
    <div className="flex justify-end space-x-2 !p-4">
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogTrigger asChild>
          <Button className="bg-bg-primary text-white !px-4 !py-2 rounded-[16px] hover:bg-teal-500">
            Add
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white !p-6 border-none rounded-lg shadow-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">
              Add New Image
            </DialogTitle>
          </DialogHeader>
          <div className="!space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full !mb-3 cursor-pointer text-sm text-gray-500"
            />
            <div className="flex items-center !space-x-2">
              <Switch
                id="status-switch"
                checked={statusActive}
                onCheckedChange={setStatusActive}
                className="data-[state=checked]:bg-bg-primary"
              />
              <Label htmlFor="status-switch" className="text-bg-primary">
                {statusActive ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>
          <DialogFooter className="!pt-6">
            <Button
              onClick={() => setOpenAddDialog(false)}
              variant="outline"
              className="border !px-3 !py-2 border-teal-500 hover:bg-bg-primary hover:text-white text-bg-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImageUpload}
              className="bg-bg-primary border border-teal-500 hover:bg-white hover:text-bg-primary !px-3 !py-2 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VGalleryPage() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [refreshKey, setRefreshKey] = useState(0);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!id) {
    return (
      <p className="text-center text-red-600 font-medium !py-8">
        Provider ID is missing in URL.
      </p>
    );
  }

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Header
        onUploadSuccess={handleUploadSuccess}
        canAdd={hasPermission(permissions, "Provider GalleryAdd")}
      />
      <Gallery
        providerId={id}
        token={token}
        key={refreshKey}
        canDelete={hasPermission(permissions, "Provider GalleryDelete")}
      />
    </div>
  );
}
