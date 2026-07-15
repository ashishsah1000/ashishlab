import Link from "next/link";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import { db } from "@/db";
import { labnotes } from "@/db/schema/labnotes";
import { desc, ilike, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export default async function LabNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isLoggedIn = false;
  
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "default_unsafe_secret"));
      isLoggedIn = true;
    } catch (e) {
      // Invalid token
    }
  }
  
  let notes = [];
  const baseCondition = isLoggedIn 
    ? undefined
    : eq(labnotes.visibility, "public");

  if (query) {
    const searchCondition = or(
      ilike(labnotes.title, `%${query}%`),
      ilike(labnotes.content, `%${query}%`),
      ilike(labnotes.tags, `%${query}%`)
    );
    
    const condition = baseCondition ? and(baseCondition, searchCondition) : searchCondition;
    notes = await db.select().from(labnotes).where(condition).orderBy(desc(labnotes.createdAt));
  } else {
    if (baseCondition) {
      notes = await db.select().from(labnotes).where(baseCondition).orderBy(desc(labnotes.createdAt));
    } else {
      notes = await db.select().from(labnotes).orderBy(desc(labnotes.createdAt));
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-heading text-gray-900 tracking-tight mb-2">
              Lab <span className="text-blue-600">Notes.</span>
            </h1>
            <p className="text-xl text-gray-600">Thoughts, research, and documentation.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <form className="relative flex-1 md:w-64" action="/labnotes" method="GET">
              <input 
                type="text" 
                name="q"
                defaultValue={query}
                placeholder="Search notes..." 
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            {isLoggedIn && (
              <Link 
                href="/labnotes/new" 
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition shadow-sm whitespace-nowrap"
              >
                New Note
              </Link>
            )}
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-lg">No notes found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {notes.map((note) => (
              <Link href={`/labnotes/${note.id}`} key={note.id} className="group">
                <article className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                  {note.imageUrl && (
                    <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gray-100">
                      <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      {format(new Date(note.createdAt), "MMM dd, yyyy")}
                    </span>
                    {note.tags && (
                      <span className="text-sm text-gray-500 truncate">
                        {note.tags.split(",").join(" • ")}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 font-heading group-hover:text-blue-600 transition-colors">
                    {note.title}
                  </h2>
                  {note.subHeading && (
                    <p className="text-gray-600 mb-6 flex-1 line-clamp-2">
                      {note.subHeading}
                    </p>
                  )}
                  <div className="mt-auto flex items-center text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                    Read Note <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
