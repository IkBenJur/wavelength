import promptsData from '../data/prompts.json';

export interface Prompt {
  negative: string;
  positive: string;
}

const prompts = promptsData as Prompt[];

export function getRandomPrompt(usedIndices: Set<number>): { prompt: Prompt; index: number } {
  const available = prompts
    .map((prompt, index) => ({ prompt, index }))
    .filter(({ index }) => !usedIndices.has(index));

  if (available.length === 0) {
    usedIndices.clear();
    const index = Math.floor(Math.random() * prompts.length);
    return { prompt: prompts[index], index };
  }

  return available[Math.floor(Math.random() * available.length)];
}
