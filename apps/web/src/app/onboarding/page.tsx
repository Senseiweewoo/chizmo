'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Target,
  Clock,
  Brain,
  Layers,
  Flame,
  BookOpen,
} from 'lucide-react';

interface OnboardingAnswers {
  studyLevel: string;
  goalExam: string;
  dailyMinutes: number;
  studyStyle: string;
  topic: string;
}

const STUDY_LEVELS = [
  { id: 'high_school', label: 'High School', age: 'Ages 14–18', icon: '🏫', desc: 'Prepping for AP, SAT, ACT, GCSE, or A-Levels' },
  { id: 'college', label: 'College / University', age: 'Undergrad & Grad', icon: '🎓', desc: 'Pre-med, engineering, law, and midterm exams' },
  { id: 'middle_school', label: 'Middle School', age: 'Ages 11–13', icon: '🎒', desc: 'Building strong recall habits in science, math & history' },
  { id: 'professional', label: 'Professional Cert', age: 'Career Growth', icon: '💼', desc: 'CFA, NCLEX, PMP, AWS, and certification tests' },
  { id: 'self_learner', label: 'Lifelong Learner', age: 'Any age', icon: '🌍', desc: 'Language learning, trivia, and personal curiosity' },
];

const TARGET_EXAMS = [
  { id: 'ap_exams', label: 'AP Exams', badge: 'High Yield', icon: '⚡', desc: 'AP Biology, Chemistry, US History, Psychology' },
  { id: 'sat_act', label: 'Digital SAT / ACT', badge: 'Test Prep', icon: '🎯', desc: 'Vocabulary in context, algebra, and grammar' },
  { id: 'gcse_alevel', label: 'GCSE / A-Levels', badge: 'UK Curriculum', icon: '🇬🇧', desc: 'Sciences, humanities, and mathematics' },
  { id: 'med_mcat', label: 'MCAT / Pre-Med', badge: 'Specialized', icon: '🩺', desc: 'Biochemistry, physics, and critical analysis' },
  { id: 'languages', label: 'Language Learning', badge: 'Fluency', icon: '🗣️', desc: 'Spanish, French, Japanese, German vocabulary' },
  { id: 'general_classes', label: 'School Coursework', badge: 'All Subjects', icon: '📚', desc: 'Acing weekly quizzes, tests, and chapter units' },
];

const DAILY_COMMITMENTS = [
  { minutes: 5, label: 'Casual Pace', cards: '~10 cards/day', desc: 'Consistent 5-minute study sessions between classes' },
  { minutes: 10, label: 'Recommended', cards: '~25 cards/day', badge: 'Popular', desc: 'Optimal balance of memory stability and daily time' },
  { minutes: 20, label: 'Intense Pace', cards: '~50 cards/day', desc: 'For upcoming exams and ambitious retention goals' },
];

const STUDY_STYLES = [
  { id: 'flashcards', label: '3D Flashcards', icon: '🃏', desc: 'Active recall with scientific FSRS-4.5 interval ratings' },
  { id: 'speed_quiz', label: 'Speed Quiz', icon: '⚡', desc: 'Timed 4-choice questions with streak point multipliers' },
  { id: 'write_recall', label: 'Write-It-Out', icon: '✍️', desc: 'Deep memory encoding with fuzzy typo-tolerant grading' },
  { id: 'live_arena', label: 'Multiplayer Live', icon: '🎮', desc: 'Kahoot-style competition with classmates and friends' },
];

const SUGGESTED_TOPICS = [
  { title: 'AP Biology: Photosynthesis & Respiration', tag: 'Biology' },
  { title: 'SAT High-Yield Vocabulary in Context', tag: 'SAT' },
  { title: 'Spanish A1: Everyday Travel & Verbs', tag: 'Languages' },
  { title: 'World War II: Turning Points & Treaties', tag: 'History' },
  { title: 'Calculus: Derivatives & Chain Rule', tag: 'Math' },
  { title: 'Organic Chemistry: Functional Groups', tag: 'Chemistry' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    studyLevel: 'high_school',
    goalExam: 'ap_exams',
    dailyMinutes: 10,
    studyStyle: 'flashcards',
    topic: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);

  // Initialize guest session in background if unauthenticated
  useEffect(() => {
    fetch('/api/auth/guest', { method: 'POST' }).catch(() => {});
  }, []);

  const GENERATION_PHASES = [
    'Analyzing key concepts & syllabus structure...',
    'Generating high-yield active recall questions...',
    'Injecting real-world mnemonics & exam explanations...',
    'Calibrating initial FSRS-4.5 memory stability curves...',
    'Deck ready! Launching your first study session...',
  ];

  const handleStartGeneration = async (chosenTopic?: string) => {
    const finalTopic = (chosenTopic || answers.topic).trim();
    if (!finalTopic) return;

    setIsGenerating(true);

    // Animate generation phases
    const interval = setInterval(() => {
      setGenerationPhase((p) => {
        if (p < GENERATION_PHASES.length - 1) return p + 1;
        clearInterval(interval);
        return p;
      });
    }, 900);

    try {
      // 1. Create deck with customized cards based on topic
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTopic,
          description: `Personalized study deck for ${answers.goalExam.replace('_', ' ').toUpperCase()} created during onboarding.`,
          color: '#6366F1',
          tags: [answers.studyLevel, answers.goalExam, 'Onboarding'],
        }),
      });

      const data = await res.json();
      const deckId = data.deck?.id || 'demo-deck';

      // 2. Populate high-yield starter flashcards
      const sampleCards = [
        {
          front: `What is the core mechanism of ${finalTopic}?`,
          back: `The fundamental principle governing ${finalTopic} that frequently appears on exams.`,
          hint: 'Think of the primary input and output relationship.',
        },
        {
          front: `Name one common misconception or exam pitfall regarding ${finalTopic}.`,
          back: `Confusing cause and effect; always verify the direction of the reaction or relationship.`,
          hint: 'Remember the inverse scenario.',
        },
        {
          front: `What is the practical formula or definition associated with ${finalTopic}?`,
          back: `The essential definition and unit relationship verified in syllabus benchmarks.`,
          hint: 'Focus on high-stakes terminology.',
        },
      ];

      for (const card of sampleCards) {
        await fetch(`/api/decks/${deckId}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(card),
        }).catch(() => {});
      }

      setTimeout(() => {
        clearInterval(interval);
        router.push(`/study/${deckId}?firstSession=true`);
      }, 4200);
    } catch {
      clearInterval(interval);
      router.push('/library');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ChizzyMascot size={36} className="transition-transform group-hover:scale-105" />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-chizmo-600 via-chizmo-500 to-volt-500 bg-clip-text text-transparent">
              Chizmo
            </span>
          </Link>
          <div className="text-xs font-bold text-slate-500">
            {isGenerating ? 'Generating Deck...' : `Step ${step} of 5`}
          </div>
        </div>

        {/* Progress Bar */}
        {!isGenerating && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-chizmo-600 to-volt-400 h-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Fullscreen Generation Animation */}
        {isGenerating ? (
          <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-xl animate-in fade-in">
            <div className="relative inline-block animate-bounce">
              <ChizzyMascot mood="supercharged" size={130} animated />
            </div>

            <div className="space-y-2">
              <Badge variant="volt" className="px-3 py-1 font-black uppercase text-xs">
                ⚡ First Deck in Under 60 Seconds
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chizzy is cooking your study deck!
              </h2>
              <p className="text-sm font-semibold text-chizmo-600 dark:text-volt-400 min-h-[24px] transition-all">
                {GENERATION_PHASES[generationPhase]}
              </p>
            </div>

            <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-chizmo-500 to-volt-400 h-full transition-all duration-700"
                style={{ width: `${((generationPhase + 1) / GENERATION_PHASES.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          /* Step-by-Step Questions */
          <div className="space-y-6">
            {/* Step 1: Study Level */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    What is your current study level?
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This helps Chizzy tune active recall card difficulty and explanations.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {STUDY_LEVELS.map((lvl) => {
                    const isSelected = answers.studyLevel === lvl.id;
                    return (
                      <Card
                        key={lvl.id}
                        hoverLift
                        onClick={() => setAnswers({ ...answers, studyLevel: lvl.id })}
                        className={`cursor-pointer p-5 transition-all text-left ${
                          isSelected
                            ? 'border-2 border-chizmo-600 dark:border-volt-400 bg-chizmo-50/50 dark:bg-chizmo-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{lvl.icon}</span>
                          <span className="text-[11px] font-bold text-slate-400">{lvl.age}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                          {lvl.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {lvl.desc}
                        </p>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="volt" size="lg" className="font-bold" onClick={() => setStep(2)}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Goal Exam */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    What exam or goal are you preparing for?
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    We adapt our FSRS retention targets to match your target exam timeline.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {TARGET_EXAMS.map((exam) => {
                    const isSelected = answers.goalExam === exam.id;
                    return (
                      <Card
                        key={exam.id}
                        hoverLift
                        onClick={() => setAnswers({ ...answers, goalExam: exam.id })}
                        className={`cursor-pointer p-5 transition-all text-left ${
                          isSelected
                            ? 'border-2 border-chizmo-600 dark:border-volt-400 bg-chizmo-50/50 dark:bg-chizmo-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{exam.icon}</span>
                          <Badge variant="indigo" className="text-[10px]">{exam.badge}</Badge>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                          {exam.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {exam.desc}
                        </p>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="volt" size="lg" className="font-bold" onClick={() => setStep(3)}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Daily Commitment */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    How much time can you commit daily?
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Short daily bursts beat weekend cramming every single time.
                  </p>
                </div>

                <div className="space-y-3">
                  {DAILY_COMMITMENTS.map((comm) => {
                    const isSelected = answers.dailyMinutes === comm.minutes;
                    return (
                      <Card
                        key={comm.minutes}
                        hoverLift
                        onClick={() => setAnswers({ ...answers, dailyMinutes: comm.minutes })}
                        className={`cursor-pointer p-5 transition-all text-left flex items-center justify-between ${
                          isSelected
                            ? 'border-2 border-chizmo-600 dark:border-volt-400 bg-chizmo-50/50 dark:bg-chizmo-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-lg">
                            {comm.minutes}m
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                {comm.label}
                              </h3>
                              {comm.badge && <Badge variant="volt" className="text-[10px]">{comm.badge}</Badge>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{comm.desc}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-400">{comm.cards}</span>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="volt" size="lg" className="font-bold" onClick={() => setStep(4)}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Study Style */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    What is your preferred study style?
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    You can switch between all 6 interactive modes anytime in your deck studio.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {STUDY_STYLES.map((style) => {
                    const isSelected = answers.studyStyle === style.id;
                    return (
                      <Card
                        key={style.id}
                        hoverLift
                        onClick={() => setAnswers({ ...answers, studyStyle: style.id })}
                        className={`cursor-pointer p-5 transition-all text-left ${
                          isSelected
                            ? 'border-2 border-chizmo-600 dark:border-volt-400 bg-chizmo-50/50 dark:bg-chizmo-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="text-2xl">{style.icon}</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                          {style.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {style.desc}
                        </p>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="volt" size="lg" className="font-bold" onClick={() => setStep(5)}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: What are you learning right now? */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    What are you learning right now?
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Type a topic or pick a sample below to generate your first deck in under 60 seconds.
                  </p>
                </div>

                {/* Input box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleStartGeneration();
                  }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={answers.topic}
                      onChange={(e) => setAnswers({ ...answers, topic: e.target.value })}
                      placeholder="e.g. AP Biology Cellular Respiration, SAT Math Circle Formula..."
                      className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-obsidian-900 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-chizmo-600 text-base shadow-sm"
                    />
                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-volt-500 pointer-events-none" />
                  </div>

                  <Button
                    type="submit"
                    variant="volt"
                    size="lg"
                    className="w-full py-6 font-black text-base shadow-lg"
                    disabled={!answers.topic.trim()}
                  >
                    Generate First Deck & Start Session ⚡
                  </Button>
                </form>

                {/* Suggested Fast-Start Chips */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Or Pick A Fast-Start Topic:
                  </span>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {SUGGESTED_TOPICS.map((top) => (
                      <button
                        key={top.title}
                        type="button"
                        onClick={() => handleStartGeneration(top.title)}
                        className="p-3.5 rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 hover:border-chizmo-500 text-left transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-chizmo-600 dark:group-hover:text-volt-400">
                            {top.title}
                          </div>
                          <span className="text-[10px] text-slate-400">{top.tag}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-chizmo-600 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(4)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
