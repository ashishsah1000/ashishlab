"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Eye } from "lucide-react";

export default function PostActions({ 
  id, 
  type, 
  initialVisibility,
  initialShareToken
}: { 
  id: number; 
  type: "journals" | "labnotes"; 
  initialVisibility: string;
  initialShareToken: string | null;
}) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initialVisibility);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/${type}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/${type}`);
        router.refresh();
      } else {
        alert("Failed to delete post");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVisibilityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVisibility = e.target.value;
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (res.ok) {
        const data = await res.json();
        setVisibility(newVisibility);
        setShareToken(data.shareToken || null);
        router.refresh();
      } else {
        alert("Failed to update visibility");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col gap-4 bg-gray-50/50 p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label htmlFor="visibility" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={handleVisibilityChange}
              disabled={isUpdating}
              className="w-full sm:w-48 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
            >
              <option value="public">Public</option>
              <option value="link_only">Link Only</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? "Deleting..." : "Delete Post"}
        </button>
      </div>

      {visibility === "link_only" && shareToken && (
        <div className="w-full pt-4 border-t border-gray-200/60">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Share URL
          </label>
          <div className="flex items-center gap-2">
            <input 
              readOnly 
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/${type}/share/${shareToken}`}
              className="flex-1 w-full bg-white border border-gray-200 text-gray-600 text-sm rounded-xl px-4 py-3 shadow-sm font-mono truncate focus:outline-none"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${typeof window !== "undefined" ? window.location.origin : ""}/${type}/share/${shareToken}`);
                alert("Copied!");
              }}
              className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl text-sm shadow-sm hover:bg-gray-800 transition whitespace-nowrap"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
