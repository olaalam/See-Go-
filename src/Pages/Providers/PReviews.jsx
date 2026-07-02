import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import DataTableLayout from "@/components/DataTableLayout";
import { toast } from "react-toastify";
import DeleteDialog from "@/components/DeleteDialog";
import { Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";

export default function PReviews() {
  const dispatch = useDispatch();
  const { id: providerId } = useParams();

  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  const fetchReviews = async (page = 1) => {

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/show_reviews?provider_id=${providerId}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const result = await response.json();

      if (result.reviews) {
        setReviews(result.reviews.data || []);
        setCurrentPage(result.reviews.current_page || page);
        setTotalPages(result.reviews.last_page || 1);
        setTotalCount(result.reviews.total || 0);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Error fetching reviews");
    }
  };

  useEffect(() => {
    if (providerId) {
      fetchReviews(1);
    }
  }, [providerId]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchReviews(newPage);
  };

  const openDeleteDialog = (id) => {
    setSelectedReviewId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/show_reviews/delete_review/${selectedReviewId}`,
        {
          method: "DELETE", // Or POST if required by backend
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        toast.success("Review deleted successfully");
        setIsDeleteOpen(false);
        fetchReviews(currentPage);
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Error deleting review");
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "details", label: "Review Details" },
    { key: "rate", label: "Rate" },
    { key: "actions", label: "Actions" },
  ];

  const processedData = useMemo(() => {
    return reviews.map((review) => ({
      id: review.id || "—",
      details: review.comment || review.review || JSON.stringify(review) || "—",
      rate: review.rate || review.rating || "—",
      actions: (
        <button
          onClick={() => openDeleteDialog(review.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Delete Review"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      ),
    }));
  }, [reviews]);

  return (
    <div className="w-full">
      <DataTableLayout
        data={processedData}
        columns={columns}
        itemsPerPage={10}

        isBackendPagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />

      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
      />
    </div>
  );
}
