'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

// Profile data interface - matches the one in system-prompt.ts
export interface UserProfile {
  name: string;
  status: 'student' | 'working_professional' | 'fresher' | 'career_changer' | '';
  degree: string;
  branch: string;
  year: string;
  graduationYear: string;
  currentJob: string;
  yearsExperience: string;
  careerGoal: string;
  interests: string[];
  learningStyle: string;
  timeAvailable: string;
  languagesKnown: string[];
  projects: string;
  challenges: string;
}

const INTEREST_OPTIONS = [
  'Web Development',
  'Mobile App Development',
  'AI / Machine Learning',
  'Data Science',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
  'Game Development',
  'Blockchain',
  'IoT (Internet of Things)',
  'UI/UX Design',
  'System Programming',
  'Database Management',
  'Competitive Programming',
  'Open Source',
];

const LANGUAGE_OPTIONS = [
  'None (Complete Beginner)',
  'C',
  'C++',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'HTML/CSS',
  'SQL',
  'PHP',
  'Swift',
  'Kotlin',
  'R',
  'MATLAB',
];

const DEGREE_OPTIONS = [
  'BTech / BE',
  'BSc (Computer Science)',
  'BCA',
  'MTech / ME',
  'MSc (Computer Science)',
  'MCA',
  'Diploma',
  'PhD',
  'Self-taught (No degree)',
  'Other',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduated'];

const LEARNING_STYLE_OPTIONS = [
  'Video tutorials (YouTube, Udemy, etc.)',
  'Reading documentation & articles',
  'Building projects (learn by doing)',
  'Structured online courses',
  'Books',
  'Peer learning / Study groups',
];

function ProfileForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    status: '',
    degree: '',
    branch: '',
    year: '',
    graduationYear: '',
    currentJob: '',
    yearsExperience: '',
    careerGoal: '',
    interests: [],
    learningStyle: '',
    timeAvailable: '',
    languagesKnown: [],
    projects: '',
    challenges: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      const existingProfile = localStorage.getItem(`path_profile_${user.uid}`);
      if (existingProfile) {
        if (isEditMode) {
          // Fill existing data if editing
          setProfile({ ...JSON.parse(existingProfile), name: user.displayName || '' });
        } else {
          // If not editing, go to chat
          router.push('/chat');
        }
      } else {
        // Fallback to Google name if no profile
        setProfile((prev) => ({ ...prev, name: user.displayName || '' }));
      }
    }
  }, [user, loading, router, isEditMode]);

  const updateProfile = (field: keyof UserProfile, value: string | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'interests' | 'languagesKnown', value: string) => {
    setProfile((prev) => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...current, value] };
    });
  };

  const saveProfile = () => {
    if (user) {
      localStorage.setItem(`path_profile_${user.uid}`, JSON.stringify(profile));
      router.push('/chat');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profile.name.trim() !== '' && profile.status !== '';
      case 2:
        if (profile.status === 'student') {
          return profile.degree !== '' && profile.year !== '';
        }
        if (profile.status === 'working_professional' || profile.status === 'career_changer') {
          return profile.currentJob.trim() !== '';
        }
        return true;
      case 3:
        return profile.interests.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (loading || !user) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoSmall}>
            <span style={styles.logoSmallText}>पथ</span>
          </div>
          <h1 style={styles.title}>Let&apos;s get to know you</h1>
          <p style={styles.subtitle}>
            This helps Path give you personalized career guidance
          </p>
        </div>

        {/* Progress Bar (Only show during initial setup) */}
        {!isEditMode && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(step / totalSteps) * 100}%`,
                }}
              />
            </div>
            <span style={styles.progressText}>
              Step {step} of {totalSteps}
            </span>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {(step === 1 || isEditMode) && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Basic Information</h2>

            <div style={styles.field}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                placeholder="Enter your full name"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>I am a...</label>
              <div style={styles.optionGrid}>
                {[
                  { value: 'student', label: '🎓 Student', desc: 'Currently pursuing a degree' },
                  { value: 'fresher', label: '🆕 Fresher', desc: 'Recently graduated, looking for work' },
                  { value: 'working_professional', label: '💼 Working Professional', desc: 'Currently employed' },
                  { value: 'career_changer', label: '🔄 Career Changer', desc: 'Want to switch career' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateProfile('status', opt.value)}
                    style={{
                      ...styles.optionCard,
                      ...(profile.status === opt.value ? styles.optionCardSelected : {}),
                    }}
                  >
                    <span style={styles.optionLabel}>{opt.label}</span>
                    <span style={styles.optionDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Education / Work Details */}
        {(step === 2 || isEditMode) && profile.status !== '' && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>
              {profile.status === 'student'
                ? 'Education Details'
                : profile.status === 'fresher'
                ? 'Education Background'
                : 'Work Details'}
            </h2>

            {(profile.status === 'student' || profile.status === 'fresher') && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Degree / Program</label>
                  <select
                    value={profile.degree}
                    onChange={(e) => updateProfile('degree', e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select your degree...</option>
                    {DEGREE_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Branch / Specialization</label>
                  <input
                    type="text"
                    value={profile.branch}
                    onChange={(e) => updateProfile('branch', e.target.value)}
                    placeholder="e.g., Computer Science, IT, ECE"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldRow}>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Current Year</label>
                    <select
                      value={profile.year}
                      onChange={(e) => updateProfile('year', e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select...</option>
                      {YEAR_OPTIONS.map((y) => (
                         <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Graduation Year</label>
                    <input
                      type="text"
                      value={profile.graduationYear}
                      onChange={(e) => updateProfile('graduationYear', e.target.value)}
                      placeholder="e.g., 2027"
                      style={styles.input}
                    />
                  </div>
                </div>
              </>
            )}

            {(profile.status === 'working_professional' || profile.status === 'career_changer') && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Current Job Title</label>
                  <input
                    type="text"
                    value={profile.currentJob}
                    onChange={(e) => updateProfile('currentJob', e.target.value)}
                    placeholder="e.g., Junior Developer, QA Engineer"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Years of Experience</label>
                  <select
                    value={profile.yearsExperience}
                    onChange={(e) => updateProfile('yearsExperience', e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select...</option>
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-2">1-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Highest Education</label>
                  <select
                    value={profile.degree}
                    onChange={(e) => updateProfile('degree', e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select your degree...</option>
                    {DEGREE_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Goals & Interests */}
        {(step === 3 || isEditMode) && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Your Goals & Interests</h2>

            <div style={styles.field}>
              <label style={styles.label}>Career Goal</label>
              <input
                type="text"
                value={profile.careerGoal}
                onChange={(e) => updateProfile('careerGoal', e.target.value)}
                placeholder="e.g., Become a full-stack developer, Get into AI/ML, Not sure yet"
                style={styles.input}
              />
              <span style={styles.hint}>It&apos;s okay to say &quot;Not sure yet&quot; — that&apos;s why Path is here!</span>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>What areas interest you? (Select all that apply)</label>
              <div style={styles.chipGrid}>
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleArrayField('interests', interest)}
                    style={{
                      ...styles.chip,
                      ...(profile.interests.includes(interest) ? styles.chipSelected : {}),
                    }}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Skills & Learning */}
        {(step === 4 || isEditMode) && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Your Skills & Preferences</h2>

            <div style={styles.field}>
              <label style={styles.label}>Programming Languages Known (Select all)</label>
              <div style={styles.chipGrid}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleArrayField('languagesKnown', lang)}
                    style={{
                      ...styles.chip,
                      ...(profile.languagesKnown.includes(lang) ? styles.chipSelected : {}),
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>How do you prefer to learn?</label>
              <select
                value={profile.learningStyle}
                onChange={(e) => updateProfile('learningStyle', e.target.value)}
                style={styles.select}
              >
                <option value="">Select...</option>
                {LEARNING_STYLE_OPTIONS.map((ls) => (
                  <option key={ls} value={ls}>{ls}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Time available for learning per day</label>
              <select
                value={profile.timeAvailable}
                onChange={(e) => updateProfile('timeAvailable', e.target.value)}
                style={styles.select}
              >
                <option value="">Select...</option>
                <option value="less-1hr">Less than 1 hour</option>
                <option value="1-2hrs">1-2 hours</option>
                <option value="2-4hrs">2-4 hours</option>
                <option value="4-6hrs">4-6 hours</option>
                <option value="6+hrs">6+ hours</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Any projects or experience? (Optional)</label>
              <textarea
                value={profile.projects}
                onChange={(e) => updateProfile('projects', e.target.value)}
                placeholder="e.g., Built a to-do app, college mini project, contributed to open source..."
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Main challenges or fears about your career?</label>
              <textarea
                value={profile.challenges}
                onChange={(e) => updateProfile('challenges', e.target.value)}
                placeholder="e.g., Don't know where to start, scared of interviews, imposter syndrome..."
                style={styles.textarea}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.navButtons}>
          {!isEditMode && step > 1 && (
            <button onClick={() => setStep(step - 1)} style={styles.backButton}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!isEditMode && step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              style={{
                ...styles.nextButton,
                ...(!canProceed() ? styles.buttonDisabled : {}),
              }}
            >
              Next →
            </button>
          ) : (
            <button onClick={saveProfile} style={styles.startButton}>
              {isEditMode ? 'Save Profile 💾' : 'Start My Journey 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<div style={{ color: '#888', padding: 20 }}>Loading...</div>}>
      <ProfileForm />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: '32px 36px',
    maxWidth: 560,
    width: '100%',
    border: '1px solid #222',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  logoSmall: {
    width: 48,
    height: 48,
    backgroundColor: '#000',
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #333',
    marginBottom: 12,
  },
  logoSmallText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    margin: 0,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  stepContent: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#eee',
    margin: '0 0 20px 0',
  },
  field: {
    marginBottom: 18,
  },
  fieldRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#bbb',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  optionCard: {
    padding: '14px 12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    transition: 'all 0.2s ease',
  },
  optionCardSelected: {
    backgroundColor: '#1a2e1a',
    borderColor: '#4ade80',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
  },
  optionDesc: {
    fontSize: 11,
    color: '#888',
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    padding: '8px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 20,
    color: '#ccc',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  chipSelected: {
    backgroundColor: '#1a2e1a',
    borderColor: '#4ade80',
    color: '#4ade80',
  },
  navButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px solid #222',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#aaa',
    fontSize: 14,
    cursor: 'pointer',
  },
  nextButton: {
    padding: '10px 24px',
    backgroundColor: '#4ade80',
    border: 'none',
    borderRadius: 8,
    color: '#000',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  startButton: {
    padding: '12px 28px',
    backgroundColor: '#4ade80',
    border: 'none',
    borderRadius: 8,
    color: '#000',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
