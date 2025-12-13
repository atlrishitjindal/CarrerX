import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, InsightResult, InterviewReport, JobMatchResult, Job, SkillSuggestion, ChatMessage } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. If you are on Vercel, please add 'API_KEY' to your project's Environment Variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

const handleGeminiError = async (error: any): Promise<never> => {
  console.error("Gemini Operation Failed:", error);
  
  let errorMessage = error.message || "Unknown error occurred";

  if (errorMessage.toLowerCase().includes("leaked") || errorMessage.includes("403") || errorMessage.includes("permission_denied")) {
     if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        try {
            await (window as any).aistudio.openSelectKey();
            throw new Error("API Key issue. Opening selection dialog...");
        } catch (e) {
            console.error("Failed to open key selector", e);
        }
     }
     throw new Error("Your API key was rejected (403). Please check your quota or refresh the page.");
  }
  
  if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      throw new Error("The AI model is currently unavailable. Please try again later.");
  }

  throw new Error(errorMessage);
};

const cleanJson = (text: string) => {
  return text.replace(/```json|```/g, '').trim();
};

export const analyzeResume = async (
  data: string,
  mimeType: string
): Promise<ResumeAnalysis> => {
  const ai = getAiClient();
  
  // Normalize MIME type
  let normalizedMimeType = mimeType;
  if (mimeType.includes('pdf')) normalizedMimeType = 'application/pdf';
  else if (mimeType.includes('png')) normalizedMimeType = 'image/png';
  else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) normalizedMimeType = 'image/jpeg';

  const prompt = `Analyze this resume acting as a helpful and encouraging Applicant Tracking System (ATS) consultant. 
  Identify the candidate's target role based on experience.
  
  SCORING RULES:
  - Be fair and constructive. A good, standard resume should score between 70-85.
  - Excellent resumes with quantifiable results should score above 85.
  - Only give low scores (<60) if the resume is very sparse, has major formatting errors, or lacks relevant skills entirely.
  - Look for transferrable skills and potential, not just perfect keyword matching.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: normalizedMimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "summary", "strengths", "weaknesses", "improvements", "skills"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response received from AI model.");
    
    return JSON.parse(cleanJson(text)) as ResumeAnalysis;
  } catch (error: any) {
    return handleGeminiError(error);
  }
};

export const generateImprovementExample = async (improvement: string, resumeSummary: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Context: Resume Summary: "${resumeSummary}". Improvement: "${improvement}".
  Task: Write a specific, concrete example (1-2 sentences) of how to implement this improvement.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "Could not generate example.";
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const generateInterviewReport = async (transcript: string): Promise<InterviewReport> => {
  const ai = getAiClient();
  const prompt = `Analyze this interview transcript.
  Transcript: ${transcript}
  Provide JSON assessment: overallScore (0-100), technicalScore, communicationScore, strengths, improvements.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            technicalScore: { type: Type.NUMBER },
            communicationScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["overallScore", "technicalScore", "communicationScore", "strengths", "improvements"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No report generated");
    return JSON.parse(cleanJson(text)) as InterviewReport;
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const getMarketInsights = async (query: string): Promise<InsightResult> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "No insights found.";
    
    // Access grounding metadata safely
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks || [];
    
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
    
    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values()) as any[];

    return { text, sources: uniqueSources };
  } catch (error) {
    // Fallback if tools fail
    return { text: "I couldn't access live market data at the moment, but here is what I know: " + (error as any).message, sources: [] };
  }
};

export const generateTailoredJobs = async (resumeSummary: string, skills: string[]): Promise<Job[]> => {
  const ai = getAiClient();
  const count = Math.floor(Math.random() * (12 - 5 + 1) + 5);

  const prompt = `Generate ${count} realistic job postings that are highly relevant to this candidate profile.
  Candidate Summary: ${resumeSummary}
  Candidate Skills: ${skills.join(', ')}

  Task:
  1. Infer the candidate's industry and seniority level.
  2. Create ${count} diverse job opportunities.
  3. Ensure the job titles and requirements are realistic.
  4. Include a mix of "Best Match" and "Stretch" roles.
  
  Return valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              salary: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              postedAt: { type: Type.STRING },
            },
            required: ["id", "title", "company", "location", "salary", "type", "description", "requirements", "postedAt"],
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(cleanJson(text)) as Job[];
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const analyzeJobMatch = async (resumeSummary: string, resumeSkills: string[], jobDescription: string): Promise<JobMatchResult> => {
  const ai = getAiClient();
  
  const prompt = `Role: Senior Recruiter & ATS Specialist.
  
  Candidate Profile:
  Summary: ${resumeSummary}
  Skills: ${resumeSkills.join(', ')}
  
  Job Description:
  ${jobDescription}
  
  Evaluate fit. Provide JSON response.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["matchScore", "summary", "missingKeywords", "pros", "cons"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(cleanJson(text)) as JobMatchResult;
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const generateCoverLetter = async (resumeSummary: string, jobDescription: string): Promise<string> => {
  const ai = getAiClient();
  
  const prompt = `Write a professional, persuasive cover letter.
  
  Candidate Summary: ${resumeSummary}
  Job Description: ${jobDescription}
  
  Tone: Professional, confident.
  Return ONLY the cover letter text, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const suggestSkills = async (currentSkills: string[], roleContext: string): Promise<SkillSuggestion[]> => {
  const ai = getAiClient();
  
  const prompt = `Based on the following candidate profile and skills, suggest 6 high-value skills they should learn.
  
  Role/Context: ${roleContext}
  Current Skills: ${currentSkills.join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              reason: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
              category: { type: Type.STRING, enum: ["Technical", "Soft Skill", "Tool"] },
              searchQuery: { type: Type.STRING }
            },
            required: ["skill", "reason", "difficulty", "category", "searchQuery"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(cleanJson(text)) as SkillSuggestion[];
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const sendChatMessage = async (history: ChatMessage[], newMessage: string, currentContext: string): Promise<string> => {
  const ai = getAiClient();
  
  const systemInstruction = `You are CarrerBot, the intelligent assistant for the CarrerX platform. 
  Your goal is to help users navigate the website and explain its features.
  
  WEBSITE KNOWLEDGE BASE (What you know about CarrerX):
  1. **Dashboard**: The central hub showing an overview of resume score, active applications, and recommended actions.
  2. **Resume Analyzer**: Allows users to upload a PDF resume. It uses AI to score it (0-100), identify strengths/weaknesses, and suggest specific improvements.
  3. **Interview Prep (Live Interview)**: A voice-based mock interview simulator.
  4. **Job Matches**: Lists jobs tailored to the user's skills found in their resume.
  5. **Cover Letter Writer**: Generates a tailored cover letter based on the user's resume and a pasted job description.
  6. **Skill Suggestions**: Recommends skills to learn based on the user's profile.
  7. **Market Insights**: A research tool to check salaries, trends, and industry news.
  8. **My Applications**: Tracks the status of jobs the user has applied to.
  
  CURRENT CONTEXT: The user is currently viewing the "${currentContext}" page.

  GUIDELINES:
  - Be helpful, concise, and professional.
  - You are NOT a general LLM; keep the conversation focused on career, jobs, and using this website.
  `;

  try {
    const chat = ai.chats.create({ 
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Chat error", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};

export const generateInterviewResponse = async (audioBase64: string, resumeContext: string, history: {role: string, text: string}[]): Promise<string> => {
  const ai = getAiClient();
  
  try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       config: {
         systemInstruction: `You are an experienced hiring manager conducting a job interview.
         Context from resume: ${resumeContext}
         
         Goal: Assess their fit for a Senior role.
         Keep your responses concise and conversational (spoken word style). Do not be too verbose.
         If the candidate struggles, offer a small hint. Be professional but encouraging.
         `
       },
       contents: {
         parts: [
           { inlineData: { data: audioBase64, mimeType: "audio/webm" } },
           { text: "Please respond to the candidate's answer naturally." }
         ]
       }
     });
     return response.text || "";
  } catch (e) {
     console.error("Interview Error", e);
     throw e;
  }
}