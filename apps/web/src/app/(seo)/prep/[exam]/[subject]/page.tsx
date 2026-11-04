import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Zap,
  Flame,
  Brain,
  Layers,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface ExamSubjectData {
  exam: string;
  examTitle: string;
  subject: string;
  subjectTitle: string;
  description: string;
  cardCount: number;
  estMinutesPerDay: number;
  highYieldUnits: Array<{
    title: string;
    description: string;
    sampleCards: Array<{ front: string; back: string }>;
  }>;
}

const PREP_DATABASE: Record<string, Record<string, ExamSubjectData>> = {
  'ap': {
    'biology': {
      exam: 'ap',
      examTitle: 'AP Exam',
      subject: 'biology',
      subjectTitle: 'AP Biology',
      description: 'Master cellular respiration, photosynthesis, Mendelian genetics, and natural selection with scientific FSRS spaced repetition.',
      cardCount: 240,
      estMinutesPerDay: 8,
      highYieldUnits: [
        {
          title: 'Unit 3: Cellular Energetics',
          description: 'ATP synthesis, Krebs cycle, light-dependent reactions, and enzyme kinetics.',
          sampleCards: [
            { front: 'What is the final electron acceptor in the electron transport chain of aerobic cellular respiration?', back: 'Molecular oxygen (O₂), which combines with protons to form water (H₂O).' },
            { front: 'Where do the light-dependent reactions of photosynthesis take place in plant cells?', back: 'The thylakoid membranes of chloroplasts.' },
          ],
        },
        {
          title: 'Unit 5: Heredity & Genetics',
          description: 'Meiosis, independent assortment, chromosomal inheritance, and Chi-square analysis.',
          sampleCards: [
            { front: 'Which phase of meiosis does crossing over occur in?', back: 'Prophase I of meiosis.' },
            { front: 'What is the expected phenotypic ratio in a standard Mendelian dihybrid cross of two heterozygotes (AaBb x AaBb)?', back: '9 : 3 : 3 : 1' },
          ],
        },
      ],
    },
    'chemistry': {
      exam: 'ap',
      examTitle: 'AP Exam',
      subject: 'chemistry',
      subjectTitle: 'AP Chemistry',
      description: 'Intermolecular forces, thermodynamic spontaneity, chemical equilibrium, and Le Chatelier’s principle simplified with active recall.',
      cardCount: 220,
      estMinutesPerDay: 10,
      highYieldUnits: [
        {
          title: 'Unit 7: Equilibrium',
          description: 'Equilibrium constants (Kc, Kp), reaction quotient Q, and Le Chatelier shifts.',
          sampleCards: [
            { front: 'If the reaction quotient Q is greater than the equilibrium constant K (Q > K), in which direction will the reaction shift?', back: 'The reaction shifts left (toward reactants) to reach equilibrium.' },
          ],
        },
      ],
    },
  },
  'sat': {
    'vocabulary': {
      exam: 'sat',
      examTitle: 'Digital SAT',
      subject: 'vocabulary',
      subjectTitle: 'SAT High-Yield Vocabulary',
      description: 'High-frequency Digital SAT words in context with active recall cues and etymological roots.',
      cardCount: 350,
      estMinutesPerDay: 7,
      highYieldUnits: [
        {
          title: 'High-Frequency Tone & Logic Words',
          description: 'Context-dependent words frequently tested in the Reading and Writing module.',
          sampleCards: [
            { front: 'What does "anachronistic" mean in textual context?', back: 'Belonging or appropriate to a period other than that in which it exists; chronologically misplaced.' },
            { front: 'What is the meaning of "laconic"?', back: 'Using very few words; concise or terse to the point of seeming blunt.' },
          ],
        },
      ],
    },
    'math': {
      exam: 'sat',
      examTitle: 'Digital SAT',
      subject: 'math',
      subjectTitle: 'SAT Math Key Formulas & Concepts',
      description: 'Quadratic vertex form, circle equation, trigonometry ratios, and exponential growth models.',
      cardCount: 180,
      estMinutesPerDay: 6,
      highYieldUnits: [
        {
          title: 'Heart of Algebra & Advanced Math',
          description: 'Essential equations and shortcut transformations tested repeatedly on SAT Math.',
          sampleCards: [
            { front: 'What is the vertex form of a quadratic parabola?', back: 'y = a(x - h)² + k, where (h, k) represents the coordinates of the vertex.' },
            { front: 'What is the equation of a circle centered at (h, k) with radius r?', back: '(x - h)² + (y - k)² = r²' },
          ],
        },
      ],
    },
  },
  'gcse': {
    'physics': {
      exam: 'gcse',
      examTitle: 'GCSE Exam',
      subject: 'physics',
      subjectTitle: 'GCSE Physics Revision',
      description: 'Energy stores, electrical circuits, wave behavior, and nuclear radiation for GCSE science.',
      cardCount: 200,
      estMinutesPerDay: 7,
      highYieldUnits: [
        {
          title: 'Topic 1: Energy & Power',
          description: 'Kinetic energy, gravitational potential energy, and conservation of energy.',
          sampleCards: [
            { front: 'What is the formula for kinetic energy (Ek)?', back: 'Ek = 0.5 × m × v² (where m is mass in kg and v is speed in m/s).' },
          ],
        },
      ],
    },
  },
};

export async function generateStaticParams() {
  const params: Array<{ exam: string; subject: string }> = [];
  for (const exam of Object.keys(PREP_DATABASE)) {
    for (const subject of Object.keys(PREP_DATABASE[exam])) {
      params.push({ exam, subject });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string; subject: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const exam = resolved?.exam?.toLowerCase();
  const subject = resolved?.subject?.toLowerCase();
  const data = exam && subject ? PREP_DATABASE[exam]?.[subject] : undefined;
  if (!data) {
    return { title: 'Study Deck | Chizmo' };
  }

  return {
    title: `${data.subjectTitle} Study Cards & Exam Prep | Chizmo`,
    description: `Master ${data.subjectTitle} for ${data.examTitle}. Free spaced repetition flashcards with scientific FSRS scheduling and active recall quiz modes.`,
    openGraph: {
      title: `${data.subjectTitle} Prep with Chizmo`,
      description: data.description,
      type: 'website',
    },
  };
}

export default async function ExamSubjectLandingPage({
  params,
}: {
  params: Promise<{ exam: string; subject: string }>;
}) {
  const resolved = await params;
  const exam = resolved?.exam?.toLowerCase();
  const subject = resolved?.subject?.toLowerCase();
  const data = exam && subject ? PREP_DATABASE[exam]?.[subject] : undefined;

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-chizmo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-chizmo-600 transition-colors">Explore</Link>
          <span>/</span>
          <span className="uppercase text-slate-700 dark:text-slate-300 font-bold">{data.exam}</span>
          <span>/</span>
          <span className="text-chizmo-600 dark:text-chizmo-400 font-bold">{data.subjectTitle}</span>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-chizmo-950 via-obsidian-900 to-obsidian-950 text-white p-8 sm:p-12 border border-chizmo-800/60 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-volt-500/10 border border-volt-500/30 text-volt-400 text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-volt-400" />
              {data.examTitle} High-Yield Curriculum
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Master <span className="bg-gradient-to-r from-volt-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">{data.subjectTitle}</span> without cramming.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              {data.description}
            </p>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300 pt-2">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <Layers className="w-4 h-4 text-volt-400" /> {data.cardCount} Verified Flashcards
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <Clock className="w-4 h-4 text-emerald-400" /> ~{data.estMinutesPerDay} Mins / Day
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-purple-400" /> 90%+ Target Retention
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link href={`/create?topic=${encodeURIComponent(data.subjectTitle)}`}>
                <Button variant="volt" size="lg" className="w-full sm:w-auto font-black shadow-lg">
                  Start Studying Now (Free) ⚡
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold border-slate-700 text-slate-200 hover:bg-slate-800">
                  Browse More Decks
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block absolute right-10 bottom-6 pointer-events-none">
            <ChizzyMascot size={170} mood="studying" animated />
          </div>
        </section>

        {/* High-Yield Units & Sample Flashcards */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">High-Yield Study Modules</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Exam-weighted topics structured for rapid active recall.
            </p>
          </div>

          <div className="space-y-6">
            {data.highYieldUnits.map((unit, idx) => (
              <Card key={unit.title} className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-black uppercase text-chizmo-600 dark:text-chizmo-400">Module 0{idx + 1}</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{unit.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{unit.description}</p>
                  </div>
                  <Link href={`/create?topic=${encodeURIComponent(unit.title)}`}>
                    <Button variant="outline" size="sm" className="font-bold text-xs shrink-0">
                      Generate Practice Set <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>

                {/* Sample Cards Showcase */}
                <div className="grid md:grid-cols-2 gap-4">
                  {unit.sampleCards.map((card, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-1 text-chizmo-600 dark:text-chizmo-400">
                          <Brain className="w-3.5 h-3.5" /> Active Recall Prompt
                        </span>
                        <span>Sample Card</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{card.front}</p>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Answer:</span> {card.back}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Chizmo Spaced Repetition Outperforms Passive Reading */}
        <section className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Why FSRS Spaced Repetition Works</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Stop re-reading notes. The scientific way to guarantee long-term exam memory.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-chizmo-100 dark:bg-chizmo-950 text-chizmo-600 dark:text-chizmo-400 flex items-center justify-center font-black">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Active Recall Testing</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Retrieving answers from memory strengthens neural pathways 300% more effectively than passive re-reading or highlighter pens.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-volt-100 dark:bg-volt-950 text-volt-600 dark:text-volt-400 flex items-center justify-center font-black">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">FSRS-4.5 Interval Calculation</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cards are re-tested right before you are about to forget them, maximizing memory stability with the fewest daily reviews.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Exam Date Surge</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Input your exam date and Chizmo calculates the exact daily pace needed to reach 96% retention by test day.
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="text-center py-8 space-y-4">
          <ChizzyMascot size={64} mood="excited" className="mx-auto" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Ready to ace your {data.subjectTitle} exam?</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Zero friction onboarding. Create your deck and start your first 5-minute study session right now.
          </p>
          <Link href={`/create?topic=${encodeURIComponent(data.subjectTitle)}`}>
            <Button variant="volt" size="lg" className="font-black px-8">
              Start Studying Now ⚡
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
