import { TextItem } from '../types';

export const TYPING_TEXTS: TextItem[] = [
  // --- ENGLISH ---
  {
    id: 'en_easy_1',
    language: 'en',
    difficulty: 'easy',
    text: 'The quick brown fox jumps over the lazy dog. This classic sentence contains every letter in the English language.',
    category: 'Classic'
  },
  {
    id: 'en_easy_2',
    language: 'en',
    difficulty: 'easy',
    text: 'Practice makes perfect. Typing every day will significantly increase your speed and improve your typing accuracy.',
    category: 'Motivation'
  },
  {
    id: 'en_medium_1',
    language: 'en',
    difficulty: 'medium',
    text: 'Artificial intelligence is transforming the way we write code, design products, and interact with technology. Adapting to these changes is crucial for future developers.',
    category: 'Technology'
  },
  {
    id: 'en_medium_2',
    language: 'en',
    difficulty: 'medium',
    text: 'To be successful in software engineering, one must possess not only technical capability but also strong communication and collaboration skills with team members.',
    category: 'Professional'
  },
  {
    id: 'en_hard_1',
    language: 'en',
    difficulty: 'hard',
    text: 'Quantum computing represents a fundamental shift in computer science, utilizing concepts of superposition and entanglement to solve computational problems that are entirely intractable for classical computers.',
    category: 'Science'
  },

  // --- PROGRAMMING CODE ---
  {
    id: 'code_easy_1',
    language: 'code',
    difficulty: 'easy',
    text: 'const calculateWpm = (chars, timeMs) => Math.round((chars / 5) / (timeMs / 60000));',
    category: 'JavaScript'
  },
  {
    id: 'code_medium_1',
    language: 'code',
    difficulty: 'medium',
    text: 'useEffect(() => {\n  const handleKeyDown = (e) => {\n    if (e.key === "Escape") resetRace();\n  };\n  window.addEventListener("keydown", handleKeyDown);\n  return () => window.removeEventListener("keydown", handleKeyDown);\n}, []);',
    category: 'React Hooks'
  },
  {
    id: 'code_hard_1',
    language: 'code',
    difficulty: 'hard',
    text: 'async function fetchAiText(theme: string): Promise<string> {\n  const response = await fetch(`/api/generate-text?theme=${encodeURIComponent(theme)}`);\n  const data = await response.json();\n  if (!response.ok) throw new Error(data.error);\n  return data.text;\n}',
    category: 'TypeScript'
  }
];

export function getRandomText(language: string, difficulty: string): TextItem {
  const filtered = TYPING_TEXTS.filter(
    t => (language === 'all' || t.language === language) && (difficulty === 'all' || t.difficulty === difficulty)
  );
  if (filtered.length === 0) {
    // Fallback to English easy
    return TYPING_TEXTS[0];
  }
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}
