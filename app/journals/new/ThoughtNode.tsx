import { Handle, Position } from "@xyflow/react";
import { Info, Plus, Check } from "lucide-react";
import { useState } from "react";

export default function ThoughtNode({ data, id }: any) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState(data.text || "");

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze-thought", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought: text }),
      });
      const json = await res.json();
      if (json.critique) {
        data.onUpdate(id, { text, critique: json.critique });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white border-2 rounded-xl p-4 shadow-sm w-80 transition-all ${data.isConclusion ? "border-green-500 shadow-green-100" : "border-gray-200"}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thought</span>
        {data.critique && (
          <div className="group relative cursor-pointer">
            <Info className="w-4 h-4 text-blue-500" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {data.critique}
            </div>
          </div>
        )}
      </div>

      <textarea
        className="w-full text-sm p-2 border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none mb-3 bg-gray-50"
        rows={4}
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          data.onUpdate(id, { text: e.target.value, critique: data.critique });
        }}
      />

      <div className="flex flex-wrap gap-2 justify-between items-center">
        <button 
          onClick={handleAnalyze} 
          disabled={loading || !text.trim()}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        <button 
          onClick={() => data.onMarkConclusion(id)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${data.isConclusion ? "bg-green-100 text-green-700" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
        >
          <Check className="w-3 h-3" />
          {data.isConclusion ? "Conclusion" : "Mark Conclusion"}
        </button>

        <button 
          onClick={() => data.onAddChild(id)}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ml-auto w-full justify-center mt-2"
        >
          <Plus className="w-3 h-3" /> Branch
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}
