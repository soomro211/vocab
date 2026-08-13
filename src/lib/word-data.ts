import type { Category, Word } from "./types";

/**
 * Pre-made SAT vocabulary list.
 * Curated to cover high-frequency SAT words with clear definitions and
 * contextual example sentences.
 */
const VOCAB_WORDS: Omit<Word, "id" | "category">[] = [
  {
    term: "ephemeral",
    partOfSpeech: "adjective",
    definition: "Lasting for a very short time; transitory.",
    example: "Fame on social media is often ephemeral, fading within weeks.",
  },
  {
    term: "ubiquitous",
    partOfSpeech: "adjective",
    definition: "Present, appearing, or found everywhere at once.",
    example: "Smartphones have become ubiquitous in modern classrooms.",
  },
  {
    term: "mitigate",
    partOfSpeech: "verb",
    definition: "To make less severe, harmful, or painful.",
    example: "Planting trees can mitigate the effects of urban heat.",
  },
  {
    term: "pragmatic",
    partOfSpeech: "adjective",
    definition: "Dealing with things sensibly and realistically.",
    example: "Her pragmatic approach solved the budget crisis quickly.",
  },
  {
    term: "verbose",
    partOfSpeech: "adjective",
    definition: "Using or expressed in more words than are needed.",
    example: "The professor's verbose lectures often lost the audience.",
  },
  {
    term: "ambiguous",
    partOfSpeech: "adjective",
    definition: "Open to more than one interpretation; not clear.",
    example: "His ambiguous answer left everyone guessing his true intent.",
  },
  {
    term: "candid",
    partOfSpeech: "adjective",
    definition: "Truthful and straightforward; frank.",
    example: "She gave a candid assessment of the team's performance.",
  },
  {
    term: "diligent",
    partOfSpeech: "adjective",
    definition: "Showing care and conscientious effort in work.",
    example: "His diligent study habits earned him top marks.",
  },
  {
    term: "eloquent",
    partOfSpeech: "adjective",
    definition: "Fluent and persuasive in speaking or writing.",
    example: "Her eloquent speech moved the entire audience to tears.",
  },
  {
    term: "exonerate",
    partOfSpeech: "verb",
    definition: "To free someone from blame or obligation.",
    example: "DNA evidence exonerated the accused after ten years.",
  },
  {
    term: "fastidious",
    partOfSpeech: "adjective",
    definition: "Very attentive to and concerned about accuracy and detail.",
    example: "The fastidious editor caught every subtle grammatical error.",
  },
  {
    term: "gregarious",
    partOfSpeech: "adjective",
    definition: "Fond of company; sociable.",
    example: "His gregarious nature made him popular at every gathering.",
  },
  {
    term: "impetuous",
    partOfSpeech: "adjective",
    definition: "Acting or done quickly and without thought.",
    example: "Her impetuous decision to quit shocked her colleagues.",
  },
  {
    term: "judicious",
    partOfSpeech: "adjective",
    definition: "Showing, or done with, good judgment or sense.",
    example: "A judicious investor diversifies to manage risk.",
  },
  {
    term: "laconic",
    partOfSpeech: "adjective",
    definition: "Using very few words; concise to the point of seeming rude.",
    example: "His laconic reply of 'fine' ended the conversation.",
  },
  {
    term: "magnanimous",
    partOfSpeech: "adjective",
    definition: "Generous or forgiving, especially toward a rival.",
    example: "She was magnanimous in victory, praising her opponent.",
  },
  {
    term: "nuanced",
    partOfSpeech: "adjective",
    definition: "Characterized by subtle differences in meaning or expression.",
    example: "The film offers a nuanced portrayal of family conflict.",
  },
  {
    term: "obstinate",
    partOfSpeech: "adjective",
    definition: "Stubbornly refusing to change one's opinion or action.",
    example: "His obstinate refusal to compromise doomed the negotiations.",
  },
  {
    term: "prudent",
    partOfSpeech: "adjective",
    definition: "Acting with care and thought for the future.",
    example: "It is prudent to save for unexpected expenses.",
  },
  {
    term: "quintessential",
    partOfSpeech: "adjective",
    definition: "Representing the most perfect or typical example.",
    example: "She is the quintessential professional, calm under pressure.",
  },
  {
    term: "reticent",
    partOfSpeech: "adjective",
    definition: "Not revealing one's thoughts or feelings readily.",
    example: "He remained reticent about his personal life during the interview.",
  },
  {
    term: "sanguine",
    partOfSpeech: "adjective",
    definition: "Optimistic or positive, especially in a difficult situation.",
    example: "Despite the losses, she remained sanguine about the future.",
  },
  {
    term: "tenacious",
    partOfSpeech: "adjective",
    definition: "Holding firmly; persistent in maintaining something.",
    example: "Her tenacious effort finally uncovered the truth.",
  },
  {
    term: "vindicate",
    partOfSpeech: "verb",
    definition: "To clear of blame or suspicion; to justify.",
    example: "Later results vindicated her controversial theory.",
  },
  {
    term: "whimsical",
    partOfSpeech: "adjective",
    definition: "Playfully quaint or fanciful, especially in an appealing way.",
    example: "The garden was filled with whimsical stone figurines.",
  },
  {
    term: "zealous",
    partOfSpeech: "adjective",
    definition: "Having or showing great energy or enthusiasm.",
    example: "He was a zealous supporter of the new environmental policy.",
  },
  {
    term: "aberration",
    partOfSpeech: "noun",
    definition: "A departure from what is normal or expected.",
    example: "The storm was an aberration in an otherwise mild summer.",
  },
  {
    term: "acrimony",
    partOfSpeech: "noun",
    definition: "Bitterness or ill feeling, especially in speech.",
    example: "The debate ended in acrimony between the two candidates.",
  },
  {
    term: "amalgamate",
    partOfSpeech: "verb",
    definition: "To combine or unite to form one organization or structure.",
    example: "The two firms amalgamated to form a stronger company.",
  },
  {
    term: "capricious",
    partOfSpeech: "adjective",
    definition: "Given to sudden and unaccountable changes of mood or behavior.",
    example: "The capricious weather shifted from sun to storm in minutes.",
  },
  {
    term: "dearth",
    partOfSpeech: "noun",
    definition: "A scarcity or lack of something.",
    example: "A dearth of evidence weakened the prosecutor's case.",
  },
  {
    term: "ebullient",
    partOfSpeech: "adjective",
    definition: "Cheerful and full of energy.",
    example: "Her ebullient greeting lifted everyone's spirits.",
  },
  {
    term: "iconoclast",
    partOfSpeech: "noun",
    definition: "A person who attacks cherished beliefs or institutions.",
    example: "The artist was an iconoclast who challenged every convention.",
  },
  {
    term: "loquacious",
    partOfSpeech: "adjective",
    definition: "Tending to talk a great deal; talkative.",
    example: "The loquacious guest dominated the dinner conversation.",
  },
  {
    term: "perfunctory",
    partOfSpeech: "adjective",
    definition: "Carried out with a minimum of effort or reflection.",
    example: "He gave a perfunctory nod and returned to his work.",
  },
];

/**
 * Pre-made transitions list. These are connective words and phrases essential
 * for SAT Writing and the essay section.
 */
const TRANSITION_WORDS: Omit<Word, "id" | "category">[] = [
  {
    term: "furthermore",
    partOfSpeech: "adverb",
    definition: "In addition; moreover — adds supporting information.",
    example: "The plan is cost-effective; furthermore, it reduces emissions.",
  },
  {
    term: "nevertheless",
    partOfSpeech: "adverb",
    definition: "In spite of that; notwithstanding — signals contrast.",
    example: "The hike was exhausting; nevertheless, they reached the summit.",
  },
  {
    term: "consequently",
    partOfSpeech: "adverb",
    definition: "As a result; therefore — signals cause and effect.",
    example: "Traffic was heavy; consequently, we arrived late.",
  },
  {
    term: "nonetheless",
    partOfSpeech: "adverb",
    definition: "In spite of that; nevertheless — signals contrast.",
    example: "The data is limited; nonetheless, the trend is clear.",
  },
  {
    term: "thereby",
    partOfSpeech: "adverb",
    definition: "By that means; as a result of that.",
    example: "She studied nightly, thereby mastering the material.",
  },
  {
    term: "hence",
    partOfSpeech: "adverb",
    definition: "As a consequence; for this reason.",
    example: "The roads are icy; hence, driving is dangerous tonight.",
  },
  {
    term: "thus",
    partOfSpeech: "adverb",
    definition: "As a result or consequence of this; therefore.",
    example: "He forgot the recipe; thus, the dish was a failure.",
  },
  {
    term: "albeit",
    partOfSpeech: "conjunction",
    definition: "Although; even if — introduces a concession.",
    example: "She accepted the job, albeit reluctantly.",
  },
  {
    term: "whereas",
    partOfSpeech: "conjunction",
    definition: "In contrast or comparison with the fact that.",
    example: "Anna loves the city, whereas her brother prefers the country.",
  },
  {
    term: "accordingly",
    partOfSpeech: "adverb",
    definition: "In accordance with; correspondingly.",
    example: "Demand rose; accordingly, prices increased.",
  },
  {
    term: "conversely",
    partOfSpeech: "adverb",
    definition: "Introducing a statement opposite to the previous one.",
    example: "Hard work yields results; conversely, laziness brings failure.",
  },
  {
    term: "subsequently",
    partOfSpeech: "adverb",
    definition: "After a particular event; afterwards.",
    example: "He graduated and subsequently joined a research lab.",
  },
  {
    term: "notwithstanding",
    partOfSpeech: "preposition",
    definition: "In spite of; despite.",
    example: "Notwithstanding the rain, the match continued.",
  },
  {
    term: "thereof",
    partOfSpeech: "adverb",
    definition: "Of that or of it — refers back to something mentioned.",
    example: "The company and all employees thereof must comply.",
  },
  {
    term: "hereby",
    partOfSpeech: "adverb",
    definition: "By means of this — used in formal declarations.",
    example: "I hereby declare the meeting open.",
  },
  {
    term: "therein",
    partOfSpeech: "adverb",
    definition: "In that place, document, or respect.",
    example: "The contract and the obligations therein remain binding.",
  },
  {
    term: "wherein",
    partOfSpeech: "adverb",
    definition: "In which; in what way.",
    example: "A system wherein every voice is heard.",
  },
  {
    term: "hitherto",
    partOfSpeech: "adverb",
    definition: "Until now or until the point being discussed.",
    example: "A hitherto unknown manuscript was found in the attic.",
  },
  {
    term: "henceforth",
    partOfSpeech: "adverb",
    definition: "From this time on; from now on.",
    example: "He is henceforth responsible for the project.",
  },
  {
    term: "thereafter",
    partOfSpeech: "adverb",
    definition: "After that time or event.",
    example: "They met once and remained friends thereafter.",
  },
  {
    term: "moreover",
    partOfSpeech: "adverb",
    definition: "As a further matter; besides — adds information.",
    example: "The car is fast; moreover, it is remarkably fuel-efficient.",
  },
  {
    term: "incidentally",
    partOfSpeech: "adverb",
    definition: "Used to introduce a side comment related to the topic.",
    example: "Incidentally, the meeting has been moved to Thursday.",
  },
  {
    term: "admittedly",
    partOfSpeech: "adverb",
    definition: "It must be admitted; confessedly — concedes a point.",
    example: "Admittedly, the plan has flaws, but it is still viable.",
  },
  {
    term: "indeed",
    partOfSpeech: "adverb",
    definition: "Used to emphasize a statement or confirmation.",
    example: "The results were, indeed, remarkable.",
  },
  {
    term: "otherwise",
    partOfSpeech: "adverb",
    definition: "In circumstances different from those present; or else.",
    example: "Hurry, otherwise we will miss the train.",
  },
  {
    term: "instead",
    partOfSpeech: "adverb",
    definition: "As an alternative or substitute.",
    example: "She declined coffee and chose tea instead.",
  },
  {
    term: "alternatively",
    partOfSpeech: "adverb",
    definition: "As another option or possibility.",
    example: "We could fly; alternatively, we could take the train.",
  },
  {
    term: "meanwhile",
    partOfSpeech: "adverb",
    definition: "In the intervening period of time.",
    example: "She studied; meanwhile, her brother played video games.",
  },
  {
    term: "finally",
    partOfSpeech: "adverb",
    definition: "After a long time; eventually; lastly.",
    example: "Finally, the team published its long-awaited findings.",
  },
  {
    term: "ultimately",
    partOfSpeech: "adverb",
    definition: "In the end; at the most basic level.",
    example: "Ultimately, the decision rests with the board.",
  },
  {
    term: "initially",
    partOfSpeech: "adverb",
    definition: "At first; at the beginning.",
    example: "Initially, the project seemed straightforward.",
  },
  {
    term: "specifically",
    partOfSpeech: "adverb",
    definition: "In a precise or particular manner; explicitly.",
    example: "She asked specifically for a quiet room.",
  },
  {
    term: "namely",
    partOfSpeech: "adverb",
    definition: "That is to say; to be specific.",
    example: "Two cities, namely Paris and Rome, topped the list.",
  },
  {
    term: "granted",
    partOfSpeech: "adverb",
    definition: "Admittedly; it is true — concedes a point before contrast.",
    example: "Granted, the budget is tight, but we must try.",
  },
  {
    term: "equally",
    partOfSpeech: "adverb",
    definition: "To an equal degree; likewise.",
    example: "The plan is risky; equally, doing nothing is dangerous.",
  },
];

function buildWords(
  list: Omit<Word, "id" | "category">[],
  category: Category
): Word[] {
  return list.map((w, i) => ({
    ...w,
    id: `${category}-${i + 1}`,
    category,
  }));
}

export const DEFAULT_VOCAB_WORDS: Word[] = buildWords(
  VOCAB_WORDS,
  "vocabulary"
);
export const DEFAULT_TRANSITION_WORDS: Word[] = buildWords(
  TRANSITION_WORDS,
  "transitions"
);

export const DEFAULT_WORDS: Word[] = [
  ...DEFAULT_VOCAB_WORDS,
  ...DEFAULT_TRANSITION_WORDS,
];

export const CATEGORY_META: Record<
  Category,
  { label: string; description: string; count: number }
> = {
  vocabulary: {
    label: "Vocabulary",
    description: "High-frequency SAT words with definitions and examples.",
    count: VOCAB_WORDS.length,
  },
  transitions: {
    label: "Transitions",
    description: "Connective words and phrases for fluent writing.",
    count: TRANSITION_WORDS.length,
  },
};
