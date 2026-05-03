"use client";

import { useEffect, useState } from "react";
import { getResumeAbout, seedResumeData, updateResumeAbout } from "@/app/actions/resume";
import Navbar from "@/components/Navbar";

export default function EditResumePage() {
  const [about, setAbout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      await seedResumeData(); // Seed if empty
      const data = await getResumeAbout();
      setAbout(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveAbout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      title: formData.get("title"),
      bio: formData.get("bio"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      location: formData.get("location"),
      github: formData.get("github"),
      linkedin: formData.get("linkedin"),
    };
    try {
      await updateResumeAbout(data, formData.get("password") as string);
      alert("Saved Successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save");
    }
  };

  if (loading) return <div className="p-24 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-32">
        <h1 className="text-4xl font-black font-heading mb-8">Edit Resume Data</h1>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6">About Section</h2>
          <form onSubmit={handleSaveAbout} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input name="name" defaultValue={about?.name} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input name="title" defaultValue={about?.title} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input name="email" defaultValue={about?.email} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input name="phone" defaultValue={about?.phone} className="w-full border rounded-lg p-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Bio</label>
              <textarea name="bio" defaultValue={about?.bio} rows={6} className="w-full border rounded-lg p-2" />
            </div>
            <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-64">
                <label className="block text-sm font-semibold mb-1">Admin Password <span className="text-red-500">*</span></label>
                <input type="password" name="password" required placeholder="Enter password" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-red-500" />
              </div>
              <button type="submit" className="w-full md:w-auto mt-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition">Save About</button>
            </div>
          </form>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 mb-4">Note: A full CRUD interface for Experience, Projects, and Skills can be added here.</p>
          <a href="/api/resume/download" className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl font-bold">
            Test Download Generated PDF
          </a>
        </div>
      </div>
    </main>
  );
}
