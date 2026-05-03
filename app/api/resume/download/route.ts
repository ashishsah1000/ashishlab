import { getResumeAbout, getResumeExperience, getResumeProjects, getResumeSkills } from '@/app/actions/resume';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ResumePDF } from '@/components/ResumePDF';
import React from 'react';

export async function GET() {
  try {
    const about = await getResumeAbout();
    const experience = await getResumeExperience();
    const projects = await getResumeProjects();
    const skills = await getResumeSkills();

    const stream = await renderToStream(React.createElement(ResumePDF, { about, experience, projects, skills }));
    
    // Read stream to buffer
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Ashish_Sah_Resume.pdf"'
      }
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
