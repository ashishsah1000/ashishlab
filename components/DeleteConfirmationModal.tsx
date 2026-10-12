"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react";

export interface DeleteRecordDetail {
  label: string;
  value: string | number | React.ReactNode;
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemType: string;
  itemName: string;
  description?: string;
  details?: DeleteRecordDetail[];
  warningMessage?: string;
  confirmCheckboxLabel?: string;
  deleteButtonText?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemType,
  itemName,
  description,
  details = [],
  warningMessage,
  confirmCheckboxLabel = "I confirm that I want to delete this record and understand this cannot be undone.",
  deleteButtonText = "Delete Record",
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const [isAccepted, setIsAccepted] = useState(false);

  // Reset checkbox whenever the modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setIsAccepted(false);
    }
  }, [isOpen, itemName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isAccepted || isDeleting) return;
    await onConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-rose-950 via-rose-900 to-gray-900 text-white flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-rose-300 block mb-0.5">
                  Confirm Deletion
                </span>
                <h3 className="text-lg md:text-xl font-bold font-heading">
                  {title || `Delete ${itemType}?`}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Record Information Card */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 tracking-wider">
                  {itemType}
                </span>
                <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Permanent Action
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-gray-900 leading-snug break-words">
                  {itemName}
                </h4>
                {description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {/* Dynamic Metadata Attributes */}
              {details.length > 0 && (
                <div className="pt-2 border-t border-gray-200/80 grid grid-cols-2 gap-2 text-xs">
                  {details.map((d, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">
                        {d.label}
                      </span>
                      <span className="text-gray-800 font-semibold block truncate">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {warningMessage ||
                  `Deleting this ${itemType.toLowerCase()} will permanently remove its associated records from your workspace.`}
              </p>
            </div>

            {/* Confirmation Checkbox Requirement */}
            <div
              onClick={() => !isDeleting && setIsAccepted(!isAccepted)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                isAccepted
                  ? "bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/10"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                id="confirm-delete-checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                disabled={isDeleting}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer"
              />
              <label
                htmlFor="confirm-delete-checkbox"
                className="text-xs font-bold text-gray-800 cursor-pointer leading-relaxed"
              >
                {confirmCheckboxLabel}
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 md:px-6 md:pb-6 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
              {!isAccepted
                ? "Check the box to enable deletion"
                : "Confirmation acknowledged"}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isAccepted || isDeleting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  isAccepted && !isDeleting
                    ? "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95 shadow-rose-600/20"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : deleteButtonText}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
