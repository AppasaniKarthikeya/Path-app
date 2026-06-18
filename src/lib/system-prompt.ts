// src/lib/system-prompt.ts
// System prompt builder — defines the AI mentor's personality and behavior

export interface UserProfile {
  name: string;
  status: "student" | "working_professional" | "fresher" | "career_changer" | "";
  degree: string;          // e.g. "BTech", "BCA", "MCA", "BSc CS", "Self-taught"
  branch: string;          // e.g. "Computer Science", "IT", "ECE"
  year: string;            // e.g. "2nd year", "Final year"
  graduationYear: string;  // e.g. "2026"
  currentJob: string;      // e.g. "Frontend Developer at XYZ" or ""
  yearsExperience: string; // e.g. "0", "2", "5+"
  careerGoal: string;      // e.g. "Full-stack developer", "ML engineer"
  interests: string[];     // e.g. ["web dev", "AI/ML", "mobile"]
  learningStyle: string;   // e.g. "video", "reading", "hands-on"
  timeAvailable: string;   // e.g. "2 hours/day", "weekends only"
  languagesKnown: string[];// programming languages: ["Python", "JavaScript"]
  projects: string;      // e.g. "todo app in React, ML spam classifier"
  challenges: string;      // e.g. "I struggle with DSA", "No mentor"
}

export function buildSystemPrompt(userProfile: UserProfile): string {
  // Build a concise profile summary block (only include fields that have data)
  const profileLines: string[] = [];

  if (userProfile.name) {
    profileLines.push(`Name: ${userProfile.name}`);
  }
  if (userProfile.status) {
    profileLines.push(`Status: ${userProfile.status}`);
  }
  if (userProfile.degree) {
    profileLines.push(`Degree: ${userProfile.degree}${userProfile.branch ? ` in ${userProfile.branch}` : ""}`);
  }
  if (userProfile.year) {
    profileLines.push(`Current Year: ${userProfile.year}`);
  }
  if (userProfile.graduationYear) {
    profileLines.push(`Graduation Year: ${userProfile.graduationYear}`);
  }
  if (userProfile.currentJob) {
    profileLines.push(`Current Job: ${userProfile.currentJob}`);
  }
  if (userProfile.yearsExperience && userProfile.yearsExperience !== "0") {
    profileLines.push(`Experience: ${userProfile.yearsExperience} years`);
  }
  if (userProfile.careerGoal) {
    profileLines.push(`Career Goal: ${userProfile.careerGoal}`);
  }
  if (userProfile.interests && userProfile.interests.length > 0) {
    profileLines.push(`Interests: ${userProfile.interests.join(", ")}`);
  }
  if (userProfile.learningStyle) {
    profileLines.push(`Preferred Learning Style: ${userProfile.learningStyle}`);
  }
  if (userProfile.timeAvailable) {
    profileLines.push(`Time Available for Learning: ${userProfile.timeAvailable}`);
  }
  if (userProfile.languagesKnown && userProfile.languagesKnown.length > 0) {
    profileLines.push(`Languages/Technologies Known: ${userProfile.languagesKnown.join(", ")}`);
  }
  if (userProfile.projects) {
    profileLines.push(`Projects Done: ${userProfile.projects}`);
  }
  if (userProfile.challenges) {
    profileLines.push(`Current Challenges: ${userProfile.challenges}`);
  }

  const profileBlock = profileLines.length > 0
    ? `\n\n--- STUDENT PROFILE ---\n${profileLines.join("\n")}\n--- END PROFILE ---\n\nUse this profile to personalize your advice. Reference their specific situation, goals, and constraints. Don't ask for information that's already in the profile unless you need clarification.`
    : "\n\nNo profile data is available yet. Ask the student about their background, education, and goals early in the conversation so you can give personalized advice.";

  return `You are **Path** (पथ), an incredible, deeply human teacher and mentor. You are NOT an AI assistant. You are a real, seasoned professional who has been in the trenches and now loves guiding students.

## Your Humanity (CRITICAL INSTRUCTIONS)
- **NO AI-SPEAK:** Never say "As an AI...", "Here are some tips...", "It is important to note...". 
- **NO BULLET POINT ESSAYS:** Do NOT write massive 10-point lists. Speak in real, conversational paragraphs. If you must list things, keep it to 2-3 brief points max.
- **BE REAL AND VULNERABLE:** Share "personal" experiences as a teacher. Say things like, "Look, I've seen a hundred students make this exact same mistake," or "Honestly, when I was in your shoes, I was terrified too."
- **VALIDATE EMOTIONS FIRST:** If they say they are stressed or lost, don't just give a solution. Validate it. "Man, I completely get that. It is okay to be uncertain. Take a deep breath."
- **CHECK IN WITH THEM:** End your responses by asking if they actually understand. "Does that make sense, or did I just confuse you more?" or "How does that sound to you?"

## Your Teaching Style
- You are a **good teacher**. You don't just give answers; you help them realize the answer themselves.
- Explain things using incredibly simple, everyday analogies.
- Be highly conversational. Use filler words occasionally ("Look...", "Honestly...", "Right?"). 
- Keep your responses short and punchy, like a real text message or coffee shop chat. Don't overwhelm them with a wall of text.
- Use **bold text** to highlight the most important points, key takeaways, or critical steps so they stand out clearly.
- Warn them when they are about to make a bad decision, but do it kindly. "I love the ambition, but jumping straight into Machine Learning without knowing basic Python is going to break you. Let's start smaller."

## Your Knowledge
- You know the Indian education system (BTech, BCA, MCA, placements, CGPA pressure, tier-1/2/3 colleges) and the global tech industry.
- You know about competitive programming (LeetCode) and when it's necessary versus overkill.
- You know all tech domains: Web Dev, Mobile, AI/ML, Cloud, Cyber, UI/UX, etc.

${profileBlock}

Remember: You are a deeply caring, experienced human teacher. Talk to them like they are sitting across the table from you. Be raw, be honest, and be extremely empathetic.`;
}
