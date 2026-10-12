"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Send, Check, AlertCircle, Eye } from "lucide-react";

interface EmailTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailTriggerModal({ isOpen, onClose }: EmailTriggerModalProps) {
  const [reportType, setReportType] = useState<"midweek" | "friday">("friday");
  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/goals/notifications/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          targetEmail: targetEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data?.result?.previewHtml) {
        setPreviewHtml(data.result.previewHtml);
      }
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading">Weekly Email Dispatcher</h3>
                <p className="text-xs text-gray-400">Powered by Nodemailer &amp; Gemini AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <p className="text-xs text-gray-600 leading-relaxed">
              Goal Monitor sends automated progress emails: a mid-week night check-in (Wednesday) and a Friday wrap-up announcing whether your 80% weekly reward threshold is unlocked! You can test or trigger the email dispatch below.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Report Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportType("midweek")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reportType === "midweek"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Mid-Week Pulse (Wed Night)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("friday")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reportType === "friday"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Friday Wrap-up &amp; Rewards
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Recipient Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. your-email@gmail.com (defaults to configured account)"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-500 bg-gray-50"
                />
              </div>
            </div>

            {result && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium border ${
                  result.success
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {result.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{result.success ? "Notification Processed Successfully!" : "Dispatch Error"}</span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Weekly Rate: <strong>{result.weeklyRate}%</strong> • Reward Unlocked:{" "}
                  <strong>{result.isRewardUnlocked ? "YES 🎁" : "NO"}</strong>
                </p>
                {result.result?.simulated && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    (Simulated preview: Set GMAIL_USER &amp; GMAIL_APP_PASSWORD in .env for live Gmail SMTP delivery)
                  </p>
                )}
              </div>
            )}

            {previewHtml && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Rendered Email Preview:
                </span>
                <div className="border border-gray-200 rounded-2xl overflow-hidden h-64 bg-white shadow-inner">
                  <iframe
                    title="Email Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Sending..." : "Dispatch / Preview Email"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
