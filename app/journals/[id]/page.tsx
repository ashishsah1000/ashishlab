import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { journals } from "@/db/schema/journals";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import PostActions from "@/components/PostActions";

export default async function JournalViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const noteId = parseInt(resolvedParams.id);
  if (isNaN(noteId)) {
    notFound();
  }

  const notes = await db.select().from(journals).where(eq(journals.id, noteId));
  const note = notes[0];

  if (!note) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isLoggedIn = false;
  
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "default_unsafe_secret"));
      isLoggedIn = true;
    } catch (e) {}
  }

  if (note.visibility === "private" && !isLoggedIn) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <article className="flex-1 max-w-3xl mx-auto w-full px-6 py-32">
        <Link 
          href="/journals" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Journals
        </Link>
        
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              {format(new Date(note.createdAt), "MMMM dd, yyyy")}
            </span>
            {note.tags && (
              <div className="flex gap-2">
                {note.tags.split(",").map(tag => (
                  <span key={tag.trim()} className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black font-heading text-gray-900 tracking-tight mb-6 leading-tight">
            {note.title}
          </h1>
          
          {note.subHeading && (
            <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed">
              {note.subHeading}
            </p>
          )}
        </header>

        {note.imageUrl && (
          <div className="w-full h-auto max-h-[500px] mb-16 rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
            <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg prose-blue max-w-none prose-headings:font-heading prose-headings:font-bold prose-img:rounded-2xl prose-a:text-blue-600 hover:prose-a:text-blue-500">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeRaw]}
          >
            {note.content}
          </ReactMarkdown>
        </div>

        {isLoggedIn && (
          <PostActions id={note.id} type="journals" initialVisibility={note.visibility} initialShareToken={note.shareToken} />
        )}
      </article>
    </main>
  );
}
