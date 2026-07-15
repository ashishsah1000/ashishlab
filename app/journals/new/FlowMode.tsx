import { useCallback, useState } from "react";
import { ReactFlow, Background, Controls, addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ThoughtNode from "./ThoughtNode";
import { Loader2 } from "lucide-react";

const nodeTypes = {
  thought: ThoughtNode,
};

const defaultInitialNodes: Node[] = [
  {
    id: "1",
    type: "thought",
    position: { x: 250, y: 100 },
    data: { text: "", critique: "", isConclusion: false },
  },
];

export default function FlowMode({ 
  onClose, 
  onGenerateStory, 
  onSaveDraft,
  initialNodes,
  initialEdges
}: { 
  onClose: () => void, 
  onGenerateStory: (story: string) => void, 
  onSaveDraft: (nodes: Node[], edges: Edge[]) => void,
  initialNodes?: Node[],
  initialEdges?: Edge[]
}) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes && initialNodes.length > 0 ? initialNodes : defaultInitialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges || []);
  const [generating, setGenerating] = useState(false);
  const [conclusionId, setConclusionId] = useState<string | null>(null);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const updateNodeData = useCallback((id: string, data: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, ...data } };
        }
        return n;
      })
    );
  }, []);

  const markConclusion = useCallback((id: string) => {
    setConclusionId(id);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isConclusion: n.id === id },
      }))
    );
  }, []);

  const addChildNode = useCallback((parentId: string) => {
    const parentNode = nodes.find((n) => n.id === parentId);
    if (!parentNode) return;

    const newId = Date.now().toString();
    const newNode: Node = {
      id: newId,
      type: "thought",
      position: { 
        x: parentNode.position.x + (Math.random() * 100 - 50), 
        y: parentNode.position.y + 250 
      },
      data: { text: "", critique: "", isConclusion: false },
    };

    const newEdge: Edge = {
      id: `e${parentId}-${newId}`,
      source: parentId,
      target: newId,
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
  }, [nodes]);

  // Inject callbacks into node data
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onUpdate: updateNodeData,
      onMarkConclusion: markConclusion,
      onAddChild: addChildNode,
    }
  }));

  const handleGenerateStory = async () => {
    if (!conclusionId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/create-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, conclusionNodeId: conclusionId }),
      });
      const data = await res.json();
      if (data.story) {
        onGenerateStory(data.story);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate story");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 w-full h-full">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      <div className="absolute top-4 right-4 flex gap-3 z-10">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition"
        >
          Exit Flow
        </button>
        <button 
          onClick={() => {
            onSaveDraft(nodes, edges);
          }}
          className="px-4 py-2 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition"
        >
          Save Draft
        </button>
        {conclusionId && (
          <button 
            onClick={handleGenerateStory}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl shadow-sm hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate Journal
          </button>
        )}
      </div>
    </div>
  );
}
