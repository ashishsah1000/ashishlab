"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Plus, Clock, Target, Gift, Edit3, Trash2, CheckCircle, Calendar, ArrowRight, Sparkles } from "lucide-react";
import AiSuggestionBanner from "@/components/goals/AiSuggestionBanner";
import MilestoneWeeklyChart, { WeekChartItem } from "@/components/goals/MilestoneWeeklyChart";
import AttachRewardModal from "@/components/goals/AttachRewardModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { format } from "date-fns";

interface MilestoneData {
  id: number;
  goalId: number;
  topic: string;
  dailyAllottedMinutes: number;
  targets: string;
  endOutput: string;
  status: "active" | "completed";
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  weeklyMatrix: WeekChartItem[];
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const goalId = resolvedParams.id;

  const [goal, setGoal] = useState<any>(null);
  const [reward, setReward] = useState<any>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [loading, setLoading] = useState(true);

  // Deletion modal states
  const [milestoneToDelete, setMilestoneToDelete] = useState<MilestoneData | null>(null);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  // New milestone modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newMinutes, setNewMinutes] = useState(30);
  const [newTargets, setNewTargets] = useState("");
  const [newEndOutput, setNewEndOutput] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [showAttachRewardModal, setShowAttachRewardModal] = useState(false);

  // Edit milestone modal state
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchGoalData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`);
      if (res.ok) {
        const data = await res.json();
        setGoal(data.goal);
        setReward(data.reward);
        setMilestones(data.milestones || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalData();
  }, [goalId]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic || !newTargets) return;
    setAddingMilestone(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTopic,
          dailyAllottedMinutes: newMinutes,
          targets: newTargets,
          endOutput: newEndOutput,
        }),
      });
      if (res.ok) {
        setNewTopic("");
        setNewTargets("");
        setNewEndOutput("");
        setShowAddModal(false);
        await fetchGoalData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/milestones/${editingMilestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: editingMilestone.topic,
          dailyAllottedMinutes: editingMilestone.dailyAllottedMinutes,
          targets: editingMilestone.targets,
          endOutput: editingMilestone.endOutput,
          status: editingMilestone.status,
        }),
      });
      if (res.ok) {
        setEditingMilestone(null);
        await fetchGoalData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (m: MilestoneData) => {
    const nextStatus = m.status === "completed" ? "active" : "completed";
    try {
      await fetch(`/api/milestones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchGoalData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setIsDeletingMilestone(true);
    try {
      const res = await fetch(`/api/milestones/${milestoneToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setMilestoneToDelete(null);
        await fetchGoalData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  const handleConfirmDeleteGoal = async () => {
    if (!goal) return;
    setIsDeletingGoal(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteGoalModal(false);
        router.push("/goals");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingGoal(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24 text-center text-sm text-gray-400">
          Loading goal milestones and schedule...
        </div>
      </main>
    );
  }

  if (!goal) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Goal Not Found</h2>
          <Link href="/goals" className="text-blue-600 font-semibold text-sm">Return to Goals</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/goals"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Goals Dashboard
          </Link>

          <Link
            href={`/overview/goals/${goal.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>Overview &amp; Deep Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Global AI Suggestion Banner */}
        <AiSuggestionBanner />

        {/* Goal Hero Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                  {goal.status}
                </span>

                {reward ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/80 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-amber-600" />
                    Target Reward: {reward.title} (₹{reward.valueInr})
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAttachRewardModal(true)}
                    className="px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Attach a completion reward to this goal"
                  >
                    <Plus className="w-3 h-3" />
                    Add Reward
                  </button>
                )}

                <span className="text-xs text-gray-400">
                  Target Deadline: {format(new Date(goal.deadline), "MMMM dd, yyyy")}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-gray-900">
                {goal.title}
              </h1>

              {goal.description && (
                <p className="text-xs md:text-sm text-gray-500 max-w-2xl leading-relaxed">
                  {goal.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Milestone</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteGoalModal(true)}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-colors border border-rose-200"
                title="Delete Goal Blueprint"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Milestones Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-heading text-gray-900">
                Milestones ({milestones.length})
              </h2>
              <p className="text-xs text-gray-400">
                Weekly matrix blocks: Green = ≥80% completed for that week, Red = &lt;80%
              </p>
            </div>

            <Link
              href="/weekly/goals"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5" /> Execute in Weekly Calendar
            </Link>
          </div>

          {milestones.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-3">
              <Target className="w-8 h-8 text-blue-600 mx-auto" />
              <h3 className="font-bold text-sm text-gray-900">No Milestones Attached</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Break this goal into specific topics (e.g. Linear Algebra, Algorithms, HIIT Cardio) to auto-populate daily weekday tasks.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
              >
                Create Milestone
              </button>
            </div>
          ) : (
            milestones.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-6 md:p-7 border border-gray-100 shadow-xs space-y-5 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(m)}
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                          m.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {m.status === "completed" ? "Completed" : "Active"}
                      </button>

                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {m.dailyAllottedMinutes} mins / day (Mon-Fri)
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-heading text-gray-900">{m.topic}</h3>

                    <div className="text-xs space-y-1 text-gray-600">
                      <p>
                        <strong className="text-gray-900">Targets:</strong> {m.targets}
                      </p>
                      {m.endOutput && (
                        <p>
                          <strong className="text-gray-900">End Output:</strong> {m.endOutput}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      onClick={() => setEditingMilestone(m)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      title="Edit Milestone"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMilestoneToDelete(m)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Delete Milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Milestone Tasks: <strong>{m.completedTasks}</strong> / {m.totalTasks} completed
                    </span>
                    <span className="font-bold text-blue-600">{m.completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(m.completionRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Weekly Git-style Matrix for this milestone */}
                <MilestoneWeeklyChart weeks={m.weeklyMatrix} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-gray-100 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Add New Milestone</h3>
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear Algebra, System Design"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Daily Time Allotment (Minutes)</label>
                <select
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins (1 hr)</option>
                  <option value={90}>90 mins</option>
                  <option value={120}>120 mins</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Key Targets &amp; Concepts *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dot product, rotations, inverse, eigenvalues"
                  value={newTargets}
                  onChange={(e) => setNewTargets(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">End Output</label>
                <input
                  type="text"
                  placeholder="e.g. I should be able to do rotations and understand ML transformations"
                  value={newEndOutput}
                  onChange={(e) => setNewEndOutput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMilestone}
                  className="px-5 py-2 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50"
                >
                  {addingMilestone ? "Generating Daily Tasks..." : "Add Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-gray-100 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Edit Milestone</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  value={editingMilestone.topic}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, topic: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Daily Time Allotment (Minutes)</label>
                <input
                  type="number"
                  value={editingMilestone.dailyAllottedMinutes}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, dailyAllottedMinutes: Number(e.target.value) })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Targets *</label>
                <input
                  type="text"
                  required
                  value={editingMilestone.targets}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, targets: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">End Output</label>
                <input
                  type="text"
                  value={editingMilestone.endOutput}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, endOutput: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                <select
                  value={editingMilestone.status}
                  onChange={(e: any) => setEditingMilestone({ ...editingMilestone, status: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Reward Modal */}
      {showAttachRewardModal && goal && (
        <AttachRewardModal
          goalId={goal.id}
          goalTitle={goal.title}
          isOpen={showAttachRewardModal}
          onClose={() => setShowAttachRewardModal(false)}
          onAttached={() => fetchGoalData()}
        />
      )}

      {/* Delete Milestone Confirmation Modal */}
      {milestoneToDelete && (
        <DeleteConfirmationModal
          isOpen={!!milestoneToDelete}
          onClose={() => setMilestoneToDelete(null)}
          onConfirm={handleConfirmDeleteMilestone}
          itemType="Milestone"
          itemName={milestoneToDelete.topic}
          description={milestoneToDelete.targets}
          details={[
            { label: "Daily Time", value: `${milestoneToDelete.dailyAllottedMinutes} mins` },
            {
              label: "Task Progress",
              value: `${milestoneToDelete.completedTasks}/${milestoneToDelete.totalTasks} completed (${milestoneToDelete.completionRate}%)`,
            },
            { label: "Status", value: milestoneToDelete.status.toUpperCase() },
          ]}
          warningMessage="Deleting this milestone will permanently remove all of its scheduled daily tasks from your weekly calendar."
          confirmCheckboxLabel="I confirm that I want to delete this milestone and its scheduled tasks."
          deleteButtonText="Delete Milestone"
          isDeleting={isDeletingMilestone}
        />
      )}

      {/* Delete Goal Confirmation Modal */}
      {showDeleteGoalModal && goal && (
        <DeleteConfirmationModal
          isOpen={showDeleteGoalModal}
          onClose={() => setShowDeleteGoalModal(false)}
          onConfirm={handleConfirmDeleteGoal}
          itemType="Goal Blueprint"
          itemName={goal.title}
          description={goal.description || undefined}
          details={[
            { label: "Target Deadline", value: format(new Date(goal.deadline), "MMM dd, yyyy") },
            { label: "Milestones", value: `${milestones.length} milestones` },
            { label: "Completion Perk", value: reward ? `${reward.title} (₹${reward.valueInr})` : "None" },
          ]}
          warningMessage="Deleting this goal blueprint will permanently delete all associated milestones, scheduled daily tasks, and analytics. Any attached reward will remain safely in your vault."
          confirmCheckboxLabel="I confirm that I want to permanently delete this goal blueprint."
          deleteButtonText="Delete Goal"
          isDeleting={isDeletingGoal}
        />
      )}
    </main>
  );
}
