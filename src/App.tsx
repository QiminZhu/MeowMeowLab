import { useEffect, useMemo, useState } from "react";

type View = "directory" | "setup" | "hash" | "bst" | "bstSetup" | "bstPractice";
type MethodId = "linear" | "chaining" | "quadratic" | "double";
type TraversalId = "preorder" | "inorder" | "postorder";
type HashConfig = {
  tableSize: number;
  questionCount: number;
  values: number[];
  includeDeletes: boolean;
  mode: "default" | "custom";
};

type TreeNode = {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
};

type TreeSession = {
  values: number[];
  root: TreeNode | null;
  order: number[];
  mode: "default" | "custom";
};
type HashStep = {
  action: "INSERT" | "DELETE";
  value: number;
  hash: number;
  slot: number;
  before: string[];
  after: string[];
  note: string;
};

const EMPTY = "";
const DEL = "DEL";

const methodInfo: Record<MethodId, { title: string; short: string; formula: string; accent: string; description: string }> = {
  linear: {
    title: "Linear probing",
    short: "Linear",
    formula: "h(k, i) = (h(k) + i) mod m",
    accent: "#14a36f",
    description: "Move forward one bucket at a time until an available slot is found.",
  },
  chaining: {
    title: "Separate chaining",
    short: "Chaining",
    formula: "bucket = key mod m",
    accent: "#1865f2",
    description: "Store colliding values together in a linked list at the same bucket.",
  },
  quadratic: {
    title: "Quadratic probing",
    short: "Quadratic",
    formula: "h(k, i) = (h(k) + i²) mod m",
    accent: "#7b61c9",
    description: "Use squared probe offsets to spread clusters across the table.",
  },
  double: {
    title: "Double hashing",
    short: "Double hash",
    formula: "h(k, i) = (h₁(k) + i·h₂(k)) mod m",
    accent: "#d96b3f",
    description: "Use a second hash function to determine the probe step size.",
  },
};

const traversalInfo: Record<TraversalId, { title: string; short: string; rule: string; accent: string; description: string }> = {
  preorder: {
    title: "Preorder traversal",
    short: "Preorder",
    rule: "ROOT → LEFT → RIGHT",
    accent: "#1865f2",
    description: "Visit each node before traversing its left and right subtrees.",
  },
  inorder: {
    title: "Inorder traversal",
    short: "Inorder",
    rule: "LEFT → ROOT → RIGHT",
    accent: "#14a36f",
    description: "Visit the left subtree, the node, and then the right subtree.",
  },
  postorder: {
    title: "Postorder traversal",
    short: "Postorder",
    rule: "LEFT → RIGHT → ROOT",
    accent: "#7b61c9",
    description: "Visit both subtrees before visiting their parent node.",
  },
};

const defaultTreeValues = [8, 3, 10, 1, 6, 9, 14, 4, 7, 13];

const hashQuestionBank = [
  { id: "direct-placement", title: "Direct placement", difficulty: "Easy", summary: "Start with mostly empty target buckets.", values: [12, 25, 38, 7, 19, 31, 43, 55, 67, 79], includeDeletes: false },
  { id: "first-collision", title: "First collision", difficulty: "Easy", summary: "Resolve a single early collision.", values: [18, 29, 7, 20, 33, 46, 59, 72, 85, 98], includeDeletes: false },
  { id: "short-clusters", title: "Short clusters", difficulty: "Easy", summary: "Practice two-value collision groups.", values: [14, 25, 36, 8, 19, 30, 41, 52, 63, 74], includeDeletes: false },
  { id: "mixed-basics", title: "Mixed basics", difficulty: "Medium", summary: "Combine insertion and deletion.", values: [18, 29, 40, 15, 26, 51, 22, 62, 73, 84], includeDeletes: true },
  { id: "dense-cluster", title: "Dense cluster", difficulty: "Medium", summary: "Work through a growing collision cluster.", values: [7, 18, 29, 40, 51, 62, 73, 84, 95, 106], includeDeletes: false },
  { id: "deleted-slots", title: "Deleted slots", difficulty: "Medium", summary: "Reuse slots while preserving searches.", values: [16, 27, 38, 49, 9, 20, 31, 42, 53, 64], includeDeletes: true },
  { id: "wrap-around", title: "Wrap-around", difficulty: "Medium", summary: "Continue probing past the table boundary.", values: [10, 21, 32, 43, 54, 65, 76, 87, 98, 109], includeDeletes: true },
  { id: "long-probes", title: "Long probe paths", difficulty: "Hard", summary: "Trace several occupied positions.", values: [9, 20, 31, 42, 53, 64, 75, 86, 97, 108], includeDeletes: true },
  { id: "tombstone-chain", title: "Tombstone chain", difficulty: "Hard", summary: "Maintain a probe chain across deletions.", values: [13, 24, 35, 46, 57, 68, 79, 90, 101, 112], includeDeletes: true },
  { id: "full-mixed-trace", title: "Full mixed trace", difficulty: "Hard", summary: "Solve a dense sequence with mixed operations.", values: [17, 28, 39, 50, 61, 72, 83, 94, 105, 116], includeDeletes: true },
] as const;

const treeQuestionBank = [
  { id: "balanced-starter", title: "Balanced starter", difficulty: "Easy", summary: "A balanced tree with distinct branches.", values: [1, 3, 4, 6, 7, 8, 9, 10, 13, 14] },
  { id: "small-steps", title: "Small steps", difficulty: "Easy", summary: "Closely spaced values in a balanced shape.", values: [2, 4, 5, 7, 9, 11, 12, 14, 16, 18] },
  { id: "wide-values", title: "Wide values", difficulty: "Easy", summary: "A clear tree with widely spaced values.", values: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95] },
  { id: "left-focus", title: "Left subtree focus", difficulty: "Medium", summary: "Track several nodes through the left subtree.", values: [3, 8, 12, 17, 21, 34, 48, 55, 63, 79] },
  { id: "right-focus", title: "Right subtree focus", difficulty: "Medium", summary: "Practice transitions into the right subtree.", values: [6, 14, 19, 27, 32, 41, 58, 66, 73, 88] },
  { id: "alternating-range", title: "Alternating range", difficulty: "Medium", summary: "Values span several numerical ranges.", values: [4, 11, 23, 29, 37, 46, 52, 68, 81, 97] },
  { id: "close-comparisons", title: "Close comparisons", difficulty: "Medium", summary: "Neighboring values require careful tracking.", values: [20, 22, 24, 27, 30, 33, 35, 38, 41, 44] },
  { id: "deep reasoning", title: "Deep reasoning", difficulty: "Hard", summary: "A less predictable set of node values.", values: [7, 18, 26, 39, 43, 57, 64, 78, 86, 99] },
  { id: "subtree-switches", title: "Subtree switches", difficulty: "Hard", summary: "Focus on transitions between completed subtrees.", values: [9, 16, 28, 31, 47, 53, 69, 74, 82, 96] },
  { id: "full-traversal", title: "Full traversal challenge", difficulty: "Hard", summary: "Complete an independent ten-node traversal.", values: [13, 21, 34, 42, 56, 67, 71, 85, 92, 108] },
] as const;

function playCompletionChime() {
  const AudioContext = window.AudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const master = context.createGain();
  const start = context.currentTime;
  const notes = [
    { frequency: 523.25, delay: 0 },
    { frequency: 659.25, delay: 0.09 },
    { frequency: 783.99, delay: 0.18 },
    { frequency: 1046.5, delay: 0.31 },
  ];

  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.08, start + 0.025);
  master.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);
  master.connect(context.destination);

  notes.forEach(({ frequency, delay }, index) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    const noteStart = start + delay;
    const noteEnd = noteStart + (index === notes.length - 1 ? 0.5 : 0.28);

    oscillator.type = index === notes.length - 1 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    noteGain.gain.setValueAtTime(0.0001, noteStart);
    noteGain.gain.exponentialRampToValueAtTime(index === notes.length - 1 ? 0.7 : 0.45, noteStart + 0.018);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

    oscillator.connect(noteGain);
    noteGain.connect(master);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd);
  });

  window.setTimeout(() => {
    void context.close();
  }, 1100);
}

const recommendedValues = [18, 29, 40, 15, 26, 51, 22, 62, 73, 84, 35, 46];

function probeIndex(method: MethodId, key: number, attempt: number, size: number) {
  const primary = key % size;
  if (method === "linear") return (primary + attempt) % size;
  if (method === "quadratic") return (primary + attempt * attempt) % size;
  if (method === "double") {
    const secondary = 1 + (key % (size - 1));
    return (primary + attempt * secondary) % size;
  }
  return primary;
}

function findSlot(method: MethodId, key: number, current: string[], inserting: boolean) {
  const size = current.length;
  if (method === "chaining") return key % size;

  for (let attempt = 0; attempt < size; attempt += 1) {
    const index = probeIndex(method, key, attempt, size);
    if (inserting && (current[index] === EMPTY || current[index] === DEL)) return index;
    if (!inserting && current[index] === String(key)) return index;
  }

  return current.findIndex((value) => inserting ? value === EMPTY || value === DEL : value === String(key));
}

function generateHashLesson(method: MethodId, config: HashConfig): HashStep[] {
  let current = Array(config.tableSize).fill(EMPTY) as string[];
  const active: number[] = [];
  const steps: HashStep[] = [];
  let valueCursor = 0;

  for (let index = 0; index < config.questionCount; index += 1) {
    const nearlyFull = method !== "chaining" && active.length >= config.tableSize - 1;
    const scheduledDelete = config.includeDeletes && active.length > 1 && (index === 5 || index === 8 || nearlyFull);
    const action: "INSERT" | "DELETE" = scheduledDelete ? "DELETE" : "INSERT";
    const value = action === "DELETE"
      ? active[Math.min(1, active.length - 1)]
      : (config.values[valueCursor] ?? recommendedValues[valueCursor % recommendedValues.length] + Math.floor(valueCursor / recommendedValues.length) * config.tableSize);

    if (action === "INSERT") valueCursor += 1;
    const hash = ((value % config.tableSize) + config.tableSize) % config.tableSize;
    const before = [...current];
    const slot = findSlot(method, value, current, action === "INSERT");
    if (slot < 0) break;

    if (method === "chaining") {
      const chain = current[slot] ? current[slot].split(" → ").map(Number) : [];
      if (action === "INSERT") {
        chain.push(value);
        active.push(value);
      } else {
        const chainIndex = chain.indexOf(value);
        if (chainIndex >= 0) chain.splice(chainIndex, 1);
        active.splice(active.indexOf(value), 1);
      }
      current = current.map((item, itemIndex) => itemIndex === slot ? chain.join(" → ") : item);
    } else {
      current = current.map((item, itemIndex) => itemIndex === slot ? (action === "INSERT" ? String(value) : DEL) : item);
      if (action === "INSERT") active.push(value);
      else active.splice(active.indexOf(value), 1);
    }

    const collision = slot !== hash && action === "INSERT";
    steps.push({
      action,
      value,
      hash,
      slot,
      before,
      after: [...current],
      note: action === "DELETE"
        ? method === "chaining" ? `${value} is unlinked while the rest of bucket ${slot} remains.` : `Bucket ${slot} becomes a tombstone so probing can continue.`
        : method === "chaining" && before[slot] ? `${value} collides at bucket ${hash} and is appended to its chain.`
          : collision ? `${value} starts at ${hash}; the ${methodInfo[method].short.toLowerCase()} rule places it in bucket ${slot}.`
            : `Bucket ${slot} is empty, so ${value} is inserted directly.`,
    });
  }

  return steps;
}

function buildBalancedTree(values: number[]): TreeNode | null {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  function build(start: number, end: number): TreeNode | null {
    if (start > end) return null;
    const middle = Math.floor((start + end) / 2);
    return {
      value: unique[middle],
      left: build(start, middle - 1),
      right: build(middle + 1, end),
    };
  }
  return build(0, unique.length - 1);
}

function traversalOrder(root: TreeNode | null, type: TraversalId) {
  const result: number[] = [];
  function walk(node: TreeNode | null) {
    if (!node) return;
    if (type === "preorder") result.push(node.value);
    walk(node.left);
    if (type === "inorder") result.push(node.value);
    walk(node.right);
    if (type === "postorder") result.push(node.value);
  }
  walk(root);
  return result;
}

const bstSteps = [
  { value: 8, slot: 0, before: ["", "", "", "", "", "", ""], after: ["8", "", "", "", "", "", ""], path: "The tree is empty, so 8 becomes the root." },
  { value: 3, slot: 1, before: ["8", "", "", "", "", "", ""], after: ["8", "3", "", "", "", "", ""], path: "3 < 8, so move left." },
  { value: 10, slot: 2, before: ["8", "3", "", "", "", "", ""], after: ["8", "3", "10", "", "", "", ""], path: "10 > 8, so move right." },
  { value: 1, slot: 3, before: ["8", "3", "10", "", "", "", ""], after: ["8", "3", "10", "1", "", "", ""], path: "1 < 8, then 1 < 3. Move left twice." },
  { value: 6, slot: 4, before: ["8", "3", "10", "1", "", "", ""], after: ["8", "3", "10", "1", "6", "", ""], path: "6 < 8, then 6 > 3. Move left, then right." },
  { value: 14, slot: 6, before: ["8", "3", "10", "1", "6", "", ""], after: ["8", "3", "10", "1", "6", "", "14"], path: "14 > 8, then 14 > 10. Move right twice." },
];

function Icon({ name, className = "h-4 w-4" }: { name: "check" | "back" | "grid" | "tree" | "reset" | "arrow"; className?: string }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    back: <path d="m15 18-6-6 6-6" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    tree: <><circle cx="12" cy="5" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M12 7.5v3M6 15.5v-2h12v2" /></>,
    reset: <><path d="M4 4v6h6" /><path d="M5.5 15a8 8 0 1 0 .5-7" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function App() {
  const [view, setView] = useState<View>("directory");
  const [method, setMethod] = useState<MethodId>("linear");
  const [session, setSession] = useState<{ config: HashConfig; lesson: HashStep[] } | null>(null);
  const [traversal, setTraversal] = useState<TraversalId>("preorder");
  const [treeSession, setTreeSession] = useState<TreeSession | null>(null);

  function openMethod(id: MethodId) {
    setMethod(id);
    setSession(null);
    setView("setup");
  }

  function startLab(config: HashConfig) {
    setSession({ config, lesson: generateHashLesson(method, config) });
    setView("hash");
  }

  function openTraversal(id: TraversalId) {
    setTraversal(id);
    setTreeSession(null);
    setView("bstSetup");
  }

  function startTreeLab(values: number[], mode: "default" | "custom") {
    const root = buildBalancedTree(values);
    setTreeSession({ values, root, order: traversalOrder(root, traversal), mode });
    setView("bstPractice");
  }

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-[#243746]">
      <Header
        view={view}
        onBack={() => {
          if (view === "hash") setView("setup");
          else if (view === "bstPractice") setView("bstSetup");
          else if (view === "bstSetup") setView("bst");
          else setView("directory");
        }}
      />
      <div className="mx-auto flex max-w-[1536px]">
        <Navigation view={view} method={method} traversal={traversal} setView={setView} openMethod={openMethod} openTraversal={openTraversal} />
        <div className="min-w-0 flex-1">
          {view === "directory" && <HashDirectory openMethod={openMethod} openBst={() => setView("bst")} />}
          {view === "setup" && <QuestionSetup method={method} onStart={startLab} onBack={() => setView("directory")} />}
          {view === "hash" && session && <HashPractice key={`${method}-${session.config.mode}-${session.config.tableSize}`} method={method} lesson={session.lesson} config={session.config} onDirectory={() => setView("directory")} />}
          {view === "bst" && <BstDirectory openTraversal={openTraversal} />}
          {view === "bstSetup" && <TreeQuestionSetup traversal={traversal} onStart={startTreeLab} onBack={() => setView("bst")} />}
          {view === "bstPractice" && treeSession && <TraversalPractice key={`${traversal}-${treeSession.mode}`} traversal={traversal} session={treeSession} onDirectory={() => setView("bst")} />}
        </div>
      </div>
    </main>
  );
}

function Header({ view, onBack }: { view: View; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#d9e1e6] bg-[#ffffff]/95 px-4 backdrop-blur md:px-7">
      <div className="flex items-center gap-6">
        <button onClick={onBack} className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#14a36f] text-[#ffffff]">
            <span className="font-mono text-sm font-bold">{"{ }"}</span>
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.04em]">algo<span className="text-[#14a36f]">lab</span></span>
        </button>
        {view !== "directory" && (
          <button onClick={onBack} className="hidden items-center gap-2 border-l border-[#d9e1e6] pl-6 text-sm text-[#607481] transition hover:text-[#17324d] sm:flex">
            <Icon name="back" />
            All lessons
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-[#6b7d88] sm:block">12 day streak</span>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-[#e6edf2] text-sm font-semibold ring-1 ring-[#d9e1e6]">JS</button>
      </div>
    </header>
  );
}

function Navigation({ view, method, traversal, setView, openMethod, openTraversal }: { view: View; method: MethodId; traversal: TraversalId; setView: (view: View) => void; openMethod: (id: MethodId) => void; openTraversal: (id: TraversalId) => void }) {
  const hashIsActive = !view.startsWith("bst");
  const treeIsActive = view.startsWith("bst");
  const [hashExpanded, setHashExpanded] = useState(hashIsActive);
  const [treeExpanded, setTreeExpanded] = useState(treeIsActive);

  useEffect(() => {
    if (hashIsActive) setHashExpanded(true);
    if (treeIsActive) setTreeExpanded(true);
  }, [hashIsActive, treeIsActive]);

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[280px] shrink-0 border-r border-[#d9e1e6] bg-[#ffffff] px-4 py-6 lg:block">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#71838e]">Data structures</p>
      <div>
        <div className={`flex items-center rounded-lg transition ${hashIsActive ? "bg-[#e9f1fb] text-[#17324d]" : "text-[#607481] hover:bg-[#f1f5f7]"}`}>
          <button onClick={() => { setView("directory"); setHashExpanded(true); }} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm font-medium">
            <Icon name="grid" className="h-4 w-4 text-[#14a36f]" />
            Hash tables
          </button>
          <button
            onClick={() => setHashExpanded((expanded) => !expanded)}
            className="mr-1 grid h-8 w-8 place-items-center rounded-md text-[#6b7d88] transition hover:bg-[#f1f5f7] hover:text-[#17324d]"
            aria-label={`${hashExpanded ? "Collapse" : "Expand"} hash table directory`}
            aria-expanded={hashExpanded}
          >
            <Icon name="arrow" className={`h-3.5 w-3.5 transition-transform ${hashExpanded ? "rotate-90" : ""}`} />
          </button>
        </div>
        {hashExpanded && (
          <div className="animate-in my-2 ml-5 border-l border-[#d9e1e6] pl-4">
            {(Object.keys(methodInfo) as MethodId[]).map((id) => (
              <button
                key={id}
                onClick={() => openMethod(id)}
                className={`block w-full rounded-md px-3 py-2 text-left text-[13px] transition ${
                  (view === "hash" || view === "setup") && method === id ? "bg-[#f1f5f7] text-[#29404f]" : "text-[#6b7d88] hover:text-[#536977]"
                }`}
              >
                {methodInfo[id].title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className={`flex items-center rounded-lg transition ${treeIsActive ? "bg-[#e9f1fb] text-[#17324d]" : "text-[#607481] hover:bg-[#f1f5f7]"}`}>
          <button onClick={() => { setView("bst"); setTreeExpanded(true); }} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm font-medium">
            <Icon name="tree" className="h-4 w-4 text-[#1865f2]" />
            Binary search tree
          </button>
          <button
            onClick={() => setTreeExpanded((expanded) => !expanded)}
            className="mr-1 grid h-8 w-8 place-items-center rounded-md text-[#6b7d88] transition hover:bg-[#f1f5f7] hover:text-[#17324d]"
            aria-label={`${treeExpanded ? "Collapse" : "Expand"} binary search tree directory`}
            aria-expanded={treeExpanded}
          >
            <Icon name="arrow" className={`h-3.5 w-3.5 transition-transform ${treeExpanded ? "rotate-90" : ""}`} />
          </button>
        </div>
        {treeExpanded && (
          <div className="animate-in my-2 ml-5 border-l border-[#d9e1e6] pl-4">
          {(Object.keys(traversalInfo) as TraversalId[]).map((id) => (
            <button
              key={id}
              onClick={() => openTraversal(id)}
              className={`block w-full rounded-md px-3 py-2 text-left text-[13px] transition ${(view === "bstSetup" || view === "bstPractice") && traversal === id ? "bg-[#f1f5f7] text-[#29404f]" : "text-[#6b7d88] hover:text-[#536977]"}`}
            >
              {traversalInfo[id].title}
            </button>
          ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function HashDirectory({ openMethod, openBst }: { openMethod: (id: MethodId) => void; openBst: () => void }) {
  return (
    <div>
      <section className="border-b border-[#d9e1e6] px-6 py-10 sm:px-10 lg:px-12">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14a36f]">Learning directory</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17324d] sm:text-4xl">Hash tables</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607481]">
          Learn how hash tables resolve collisions. Each lab uses the same values and table size, so you can compare the strategies directly.
        </p>
      </section>
      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#29404f]">Collision resolution methods</h2>
          <span className="text-sm text-[#6b7d88]">4 interactive labs</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(methodInfo) as MethodId[]).map((id) => (
            <MethodCard key={id} id={id} onClick={() => openMethod(id)} />
          ))}
        </div>
        <div className="mt-10 mb-5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71838e]">Continue learning</span>
        </div>
        <button onClick={openBst} className="group flex w-full items-center justify-between rounded-2xl border border-[#d9e1e6] bg-[#ffffff] p-5 text-left transition hover:border-[#1865f2]/30 hover:bg-[#f7fafb] sm:p-6">
          <div className="flex items-center gap-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#1865f2]/10 text-[#1865f2]"><Icon name="tree" className="h-6 w-6" /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#243746]">Binary search trees</h3>
              <p className="mt-1 text-sm text-[#647782]">Build a tree by comparing values and filling the correct node slots.</p>
            </div>
          </div>
          <Icon name="arrow" className="h-5 w-5 text-[#71838e] transition group-hover:translate-x-1 group-hover:text-[#1865f2]" />
        </button>
      </section>
    </div>
  );
}

function MethodCard({ id, onClick }: { id: MethodId; onClick: () => void }) {
  const info = methodInfo[id];
  return (
    <button onClick={onClick} className="group rounded-2xl border border-[#d9e1e6] bg-[#ffffff] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#d9e1e6] hover:bg-[#f7fafb] sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1f3342]">{info.title}</h3>
        <span className="rounded-full border border-[#d9e1e6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b7d88]">Interactive</span>
      </div>
      <p className="min-h-10 text-sm leading-5 text-[#607481]">{info.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-[#d9e1e6] pt-4">
        <code className="text-xs" style={{ color: info.accent }}>{info.formula}</code>
        <span className="flex items-center gap-1 text-xs font-medium text-[#607481] transition group-hover:text-[#17324d]">Start lab <Icon name="arrow" className="h-3 w-3" /></span>
      </div>
    </button>
  );
}

function QuestionSetup({ method, onStart, onBack }: { method: MethodId; onStart: (config: HashConfig) => void; onBack: () => void }) {
  const info = methodInfo[method];
  const [choice, setChoice] = useState<"default" | "custom">("default");
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [tableSize, setTableSize] = useState(11);
  const [questionCount, setQuestionCount] = useState(10);
  const [valueText, setValueText] = useState("18, 29, 40, 15, 26, 51, 22, 62");
  const [includeDeletes, setIncludeDeletes] = useState(true);

  function begin() {
    if (choice === "default") {
      const question = hashQuestionBank[selectedQuestion];
      onStart({ tableSize: 11, questionCount: 10, values: [...question.values], includeDeletes: question.includeDeletes, mode: "default" });
      return;
    }
    const parsed = valueText.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value));
    onStart({
      tableSize,
      questionCount,
      values: parsed.length ? parsed : recommendedValues,
      includeDeletes,
      mode: "custom",
    });
  }

  return (
    <div>
      <PageTitle eyebrow="Practice setup" title={info.title} description="Choose a ready-made learning path or control the question configuration yourself." action={<button onClick={onBack} className="flex items-center gap-2 text-sm text-[#607481] hover:text-[#17324d]"><Icon name="back" /> Directory</button>} />
      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="animate-in rounded-2xl border border-[#d9e1e6] bg-[#ffffff] p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-base font-semibold text-[#29404f]">Recommended question bank</h3><p className="mt-1 text-[13px] text-[#6b7d88]">Select one complete question · 10 iterations per question · Table size 11</p></div>
              <span className="text-sm font-semibold text-[#14a36f]">Question {selectedQuestion + 1} selected</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {hashQuestionBank.map((question, index) => {
                const selected = selectedQuestion === index;
                return (
                  <button
                    key={question.id}
                    onClick={() => { setSelectedQuestion(index); setChoice("default"); }}
                    className={`min-h-[150px] rounded-xl border p-4 text-left transition ${
                      selected ? "border-[#1865f2] bg-[#1865f2]/[0.055] shadow-[0_0_0_3px_rgba(24,101,242,0.08)]" : "border-[#d9e1e6] bg-[#f7f9fa] hover:border-[#1865f2]/40 hover:bg-[#ffffff]"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#71838e]">QUESTION {index + 1}</span>
                      {selected && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1865f2] text-[#ffffff]"><Icon name="check" className="h-3 w-3" /></span>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${question.difficulty === "Easy" ? "text-[#16875f]" : question.difficulty === "Medium" ? "text-[#b7791f]" : "text-[#c84b3a]"}`}>{question.difficulty}</span>
                    <h4 className="mt-1.5 text-sm font-bold text-[#1f3342]">{question.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-[#647782]">{question.summary}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-[#f3f6f8] px-4 py-3 text-xs text-[#607481]">
              <span><strong className="text-[#29404f]">Technique:</strong> {info.title}</span>
              <span><strong className="text-[#29404f]">Operations:</strong> {hashQuestionBank[selectedQuestion].includeDeletes ? "Mixed insert and delete" : "Insertion"}</span>
              <span><strong className="text-[#29404f]">Iterations:</strong> 10</span>
            </div>
        </div>

        <button
          onClick={() => setChoice((current) => current === "custom" ? "default" : "custom")}
          className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${choice === "custom" ? "border-[#1865f2]/40 bg-[#1865f2]/[0.04]" : "border-[#d9e1e6] bg-[#ffffff] hover:bg-[#f7f9fa]"}`}
          aria-expanded={choice === "custom"}
        >
          <span>
            <strong className="block text-sm text-[#29404f]">Customize a question</strong>
            <span className="mt-0.5 block text-xs text-[#647782]">Table size, values, operations, and session length</span>
          </span>
          <Icon name="arrow" className={`h-4 w-4 text-[#607481] transition-transform ${choice === "custom" ? "-rotate-90" : "rotate-90"}`} />
        </button>

        {choice === "custom" && (
          <div className="animate-in mt-3 rounded-xl border border-[#d9e1e6] bg-[#ffffff] p-5">
            <div className="mb-6"><h3 className="text-sm font-semibold text-[#29404f]">Question configuration</h3><p className="mt-1 text-[13px] text-[#6b7d88]">Prime table sizes are used to keep every probe sequence valid.</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Setting label="Table size" help="Number of available buckets">
                <select
                  value={tableSize}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setTableSize(size);
                    if (!includeDeletes && questionCount > size) setQuestionCount(size);
                  }}
                  className="setting-input"
                >
                  {[5, 7, 11, 13].map((size) => <option key={size} value={size}>{size} buckets</option>)}
                </select>
              </Setting>
              <Setting label="Number of questions" help="Length of this practice session">
                <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="setting-input">
                  {[5, 8, 10, 12, 15].filter((count) => includeDeletes || count <= tableSize).map((count) => <option key={count} value={count}>{count} questions</option>)}
                </select>
              </Setting>
              <div className="sm:col-span-2">
                <Setting label="Insertion values" help="Comma-separated integers; extra values are generated if needed">
                  <input value={valueText} onChange={(e) => setValueText(e.target.value)} className="setting-input font-mono" />
                </Setting>
              </div>
              <Setting label="Operations" help="Choose which operations can appear">
                <label className="flex h-11 items-center justify-between rounded-lg border border-[#d9e1e6] bg-[#f7f9fa] px-3 text-sm text-[#536977]">
                  Include deletion
                  <input
                    type="checkbox"
                    checked={includeDeletes}
                    onChange={(e) => {
                      setIncludeDeletes(e.target.checked);
                      if (!e.target.checked && questionCount > tableSize) setQuestionCount(tableSize);
                    }}
                    className="h-4 w-4 accent-[#14a36f]"
                  />
                </label>
              </Setting>
              <Setting label="Collision strategy" help="Determined by the selected problem type">
                <div className="flex h-11 items-center rounded-lg border border-[#d9e1e6] bg-[#f1f5f7] px-3 text-sm text-[#607481]">{info.title}</div>
              </Setting>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-[#d9e1e6] pt-6">
          <p className="hidden text-[13px] text-[#6b7d88] sm:block">{choice === "default" ? "Best for first-time practice" : "The lab is generated from your settings"}</p>
          <button onClick={begin} className="ml-auto flex items-center gap-2 rounded-lg bg-[#14a36f] px-5 py-3 text-sm font-bold text-[#ffffff] transition hover:bg-[#11875d]">Generate questions <Icon name="arrow" className="h-3.5 w-3.5" /></button>
        </div>
      </section>
    </div>
  );
}

function Setting({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-[#405767]">{label}</span><span className="mb-2 block text-xs text-[#6b7d88]">{help}</span>{children}</label>;
}

function HashPractice({ method, lesson, config, onDirectory }: { method: MethodId; lesson: HashStep[]; config: HashConfig; onDirectory: () => void }) {
  const info = methodInfo[method];
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(lesson[0].before);
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState<"idle" | "wrong" | "correct" | "done">("idle");
  const [hint, setHint] = useState(false);
  const current = lesson[step];
  const changed = useMemo(() => draft.findIndex((value, index) => value !== current.before[index]), [draft, current]);

  function update(index: number, value: string) {
    setDraft((items) => items.map((item, i) => i === index ? value : item));
    setStatus("idle");
  }

  function check() {
    const valid = hash.trim() !== "" && Number(hash) === current.hash && draft.every((value, index) => value === current.after[index]);
    setStatus(valid ? "correct" : "wrong");
  }

  function next() {
    if (step === lesson.length - 1) {
      playCompletionChime();
      setStatus("done");
      return;
    }
    const nextIndex = step + 1;
    setStep(nextIndex);
    setDraft(lesson[nextIndex].before);
    setHash("");
    setHint(false);
    setStatus("idle");
  }

  function reset() {
    setStep(0); setDraft(lesson[0].before); setHash(""); setHint(false); setStatus("idle");
  }

  return (
    <div>
      <PageTitle eyebrow="Hash table lab" title={info.title} description={info.description} action={<button onClick={reset} className="flex items-center gap-2 text-sm text-[#607481] hover:text-[#17324d]"><Icon name="reset" /> Reset</button>} />
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="px-6 py-8 sm:px-10 lg:px-12">
          <StepRail total={lesson.length} current={step} done={status === "done"} labels={lesson.map((item) => `${item.action} ${item.value}`)} color={info.accent} />
          {status === "done" ? (
            <Complete title={`${info.title} complete`} onReset={reset} onBack={onDirectory} />
          ) : (
            <div className="rounded-2xl border border-[#d9e1e6] bg-[#ffffff]">
              <div className="flex flex-col justify-between gap-4 border-b border-[#d9e1e6] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
                <div className="flex items-center gap-4">
                  <span className="rounded-md px-2.5 py-1.5 font-mono text-xs font-bold" style={{ color: info.accent, backgroundColor: `${info.accent}12` }}>{current.action}</span>
                  <div><span className="text-xs text-[#6b7d88]">CURRENT VALUE</span><p className="font-mono text-xl">{current.value}</p></div>
                </div>
                <code className="rounded-lg border border-[#d9e1e6] bg-[#f7f9fa] px-4 py-2.5 text-xs text-[#5f7280]">{info.formula}</code>
              </div>
              <div className="px-5 py-7 sm:px-7">
                <TaskNumber number="1" title="Calculate the primary hash">
                  <div className="flex items-center gap-3 font-mono text-sm text-[#607481]">
                    <span>{current.value} mod {config.tableSize} =</span>
                    <input value={hash} onChange={(e) => { setHash(e.target.value.replace(/\D/g, "").slice(0, 1)); setStatus("idle"); }} placeholder="?" className="h-10 w-14 rounded-lg border border-[#d9e1e6] bg-[#f7f9fa] text-center text-[#17324d] outline-none focus:border-[#14a36f]/50" />
                  </div>
                </TaskNumber>
                <TaskNumber number="2" title={method === "chaining" ? "Update the correct chain" : "Update the correct bucket"}>
                  <p className="mb-4 text-sm text-[#6b7d88]">{method === "chaining" ? "Use → between values in a chain." : current.action === "DELETE" ? "Use DEL to mark the deleted bucket." : "Resolve any collision using this lab's probe formula."}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
                    {draft.map((value, index) => (
                      <label key={index}>
                        <span className="mb-2 block text-center font-mono text-xs text-[#71838e]">[{index}]</span>
                        <div className={`relative flex h-[76px] items-center rounded-xl border bg-[#f7f9fa] transition ${changed === index ? "border-[#14a36f]/50" : "border-[#d9e1e6] focus-within:border-[#d9e1e6]"}`}>
                          <input value={value} onChange={(e) => update(index, e.target.value.toUpperCase())} placeholder="—" className={`w-full bg-transparent px-1 text-center font-mono text-sm outline-none placeholder:text-[#a5b0b7] ${value === DEL ? "text-[#d96b3f]" : "text-[#29404f]"}`} />
                          {changed === index && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#14a36f]" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </TaskNumber>
                {hint && <Feedback kind="hint">Start at bucket {current.hash}. {current.slot !== current.hash ? `The target bucket after probing is ${current.slot}.` : "Update this bucket according to the operation."}</Feedback>}
                {status === "wrong" && <Feedback kind="wrong">Check the hash and table. Only the bucket affected by this iteration should change.</Feedback>}
                {status === "correct" && <Feedback kind="correct">{current.note}</Feedback>}
              </div>
              <LabFooter status={status} onHint={() => setHint(true)} onCheck={check} onNext={next} last={step === lesson.length - 1} />
            </div>
          )}
        </section>
        <LessonAside method={method} config={config} />
      </div>
    </div>
  );
}

function BstDirectory({ openTraversal }: { openTraversal: (id: TraversalId) => void }) {
  return (
    <div>
      <section className="border-b border-[#d9e1e6] px-6 py-10 sm:px-10 lg:px-12">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1865f2]">Learning directory</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17324d] sm:text-4xl">Binary search trees</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607481]">
          Practice the three fundamental depth-first traversal orders with visual trees and step-by-step answer slots.
        </p>
      </section>
      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#29404f]">Traversal problem types</h2>
          <span className="text-sm text-[#6b7d88]">3 interactive labs</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {(Object.keys(traversalInfo) as TraversalId[]).map((id) => {
            const info = traversalInfo[id];
            return (
              <button
                id={`traversal-${id}`}
                key={id}
                onClick={() => openTraversal(id)}
                className="group rounded-2xl border border-[#d9e1e6] bg-[#ffffff] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#d9e1e6] hover:bg-[#f7fafb] sm:p-6"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1f3342]">{info.title}</h3>
                  <Icon name="tree" className="h-5 w-5 text-[#82919a] transition group-hover:text-[#607481]" />
                </div>
                <p className="min-h-[60px] text-sm leading-5 text-[#607481]">{info.description}</p>
                <div className="mt-5 border-t border-[#d9e1e6] pt-4">
                  <code className="text-xs font-semibold tracking-wider" style={{ color: info.accent }}>{info.rule}</code>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-8 rounded-xl border border-[#1865f2]/15 bg-[#1865f2]/[0.035] px-5 py-4 text-sm leading-5 text-[#7f9ba5]">
          All three labs use the same visual format, making it easy to compare how changing the visit rule changes the final sequence.
        </div>
      </section>
    </div>
  );
}

function TreeQuestionSetup({ traversal, onStart, onBack }: { traversal: TraversalId; onStart: (values: number[], mode: "default" | "custom") => void; onBack: () => void }) {
  const info = traversalInfo[traversal];
  const [choice, setChoice] = useState<"default" | "custom">("default");
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [nodeCount, setNodeCount] = useState(10);
  const [valueText, setValueText] = useState(defaultTreeValues.join(", "));

  function begin() {
    if (choice === "default") return onStart([...treeQuestionBank[selectedQuestion].values], "default");
    const parsed = [...new Set(valueText.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value >= 0))];
    const values = [...parsed];
    let candidate = 2;
    while (values.length < nodeCount) {
      if (!values.includes(candidate)) values.push(candidate);
      candidate += 3;
    }
    onStart(values.slice(0, nodeCount), "custom");
  }

  return (
    <div>
      <PageTitle eyebrow="Traversal setup" title={info.title} description="Choose the recommended 10-node exercise or generate a tree from your own values." action={<button onClick={onBack} className="flex items-center gap-2 text-sm text-[#607481] hover:text-[#17324d]"><Icon name="back" /> BST directory</button>} />
      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="animate-in rounded-2xl border border-[#d9e1e6] bg-[#ffffff] p-6 sm:p-8">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><h3 className="text-base font-semibold text-[#29404f]">Recommended question bank</h3><p className="mt-1 text-[13px] text-[#6b7d88]">Select one complete tree · 10 traversal iterations per question</p></div>
              <code className="rounded-lg bg-[#f7f9fa] px-3 py-2 text-xs" style={{ color: info.accent }}>{info.rule}</code>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {treeQuestionBank.map((question, index) => {
                const selected = selectedQuestion === index;
                return (
                  <button
                    key={question.id}
                    onClick={() => { setSelectedQuestion(index); setChoice("default"); }}
                    className={`min-h-[150px] rounded-xl border p-4 text-left transition ${
                      selected ? "border-[#1865f2] bg-[#1865f2]/[0.055] shadow-[0_0_0_3px_rgba(24,101,242,0.08)]" : "border-[#d9e1e6] bg-[#f7f9fa] hover:border-[#1865f2]/40 hover:bg-[#ffffff]"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#71838e]">QUESTION {index + 1}</span>
                      {selected && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1865f2] text-[#ffffff]"><Icon name="check" className="h-3 w-3" /></span>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${question.difficulty === "Easy" ? "text-[#16875f]" : question.difficulty === "Medium" ? "text-[#b7791f]" : "text-[#c84b3a]"}`}>{question.difficulty}</span>
                    <h4 className="mt-1.5 text-sm font-bold text-[#1f3342]">{question.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-[#647782]">{question.summary}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-[#f3f6f8] px-4 py-3 text-xs text-[#607481]">
              <span><strong className="text-[#29404f]">Traversal:</strong> {info.title}</span>
              <span><strong className="text-[#29404f]">Nodes:</strong> 10</span>
              <span><strong className="text-[#29404f]">Iterations:</strong> 10</span>
            </div>
        </div>

        <button
          onClick={() => setChoice((current) => current === "custom" ? "default" : "custom")}
          className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${choice === "custom" ? "border-[#1865f2]/40 bg-[#1865f2]/[0.04]" : "border-[#d9e1e6] bg-[#ffffff] hover:bg-[#f7f9fa]"}`}
          aria-expanded={choice === "custom"}
        >
          <span>
            <strong className="block text-sm text-[#29404f]">Customize a question</strong>
            <span className="mt-0.5 block text-xs text-[#647782]">Node values, tree size, and traversal configuration</span>
          </span>
          <Icon name="arrow" className={`h-4 w-4 text-[#607481] transition-transform ${choice === "custom" ? "-rotate-90" : "rotate-90"}`} />
        </button>

        {choice === "custom" && (
          <div className="animate-in mt-3 rounded-xl border border-[#d9e1e6] bg-[#ffffff] p-5">
            <h3 className="mb-6 text-sm font-semibold text-[#29404f]">Tree configuration</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Setting label="Number of nodes" help="One traversal question is generated per node">
                <select value={nodeCount} onChange={(e) => setNodeCount(Number(e.target.value))} className="setting-input">{[5, 7, 10, 12].map((count) => <option key={count}>{count}</option>)}</select>
              </Setting>
              <Setting label="Traversal rule" help="Determined by the selected problem type">
                <div className="flex h-11 items-center rounded-lg border border-[#d9e1e6] bg-[#f1f5f7] px-3 font-mono text-xs" style={{ color: info.accent }}>{info.rule}</div>
              </Setting>
              <div className="sm:col-span-2"><Setting label="Node values" help="Comma-separated unique positive integers; missing values are generated automatically"><input value={valueText} onChange={(e) => setValueText(e.target.value)} className="setting-input font-mono" /></Setting></div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-[#d9e1e6] pt-6">
          <button onClick={begin} className="flex items-center gap-2 rounded-lg bg-[#14a36f] px-5 py-3 text-sm font-bold text-[#ffffff]">Generate questions <Icon name="arrow" className="h-3.5 w-3.5" /></button>
        </div>
      </section>
    </div>
  );
}

function TraversalPractice({ traversal, session, onDirectory }: { traversal: TraversalId; session: TreeSession; onDirectory: () => void }) {
  const info = traversalInfo[traversal];
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(session.order.length).fill(""));
  const [status, setStatus] = useState<"idle" | "wrong" | "correct" | "done">("idle");
  const [hint, setHint] = useState(false);

  function check() {
    setStatus(Number(answers[question]) === session.order[question] ? "correct" : "wrong");
  }
  function next() {
    if (question === session.order.length - 1) {
      playCompletionChime();
      setStatus("done");
      return;
    }
    setQuestion((value) => value + 1); setStatus("idle"); setHint(false);
  }
  function reset() {
    setQuestion(0); setAnswers(Array(session.order.length).fill("")); setStatus("idle"); setHint(false);
  }

  const visitedCount = question + (status === "correct" || status === "done" ? 1 : 0);
  return (
    <div>
      <PageTitle eyebrow="BST traversal lab" title={info.title} description={`Follow ${info.rule.toLowerCase()} and enter each node in visit order.`} action={<button onClick={reset} className="flex items-center gap-2 text-sm text-[#607481] hover:text-[#17324d]"><Icon name="reset" /> Reset</button>} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="px-6 py-8 sm:px-10 lg:px-12">
          <StepRail total={session.order.length} current={question} done={status === "done"} labels={session.order.map((_, index) => `NODE ${index + 1}`)} color={info.accent} />
          {status === "done" ? <Complete title={`${info.title} complete`} onReset={reset} onBack={onDirectory} /> : (
            <div className="rounded-2xl border border-[#d9e1e6] bg-[#ffffff]">
              <div className="flex items-center justify-between border-b border-[#d9e1e6] px-5 py-4 sm:px-7">
                <div><span className="text-xs uppercase tracking-wider text-[#6b7d88]">Question {question + 1} of {session.order.length}</span><p className="mt-1 text-sm font-medium">Which node is visited next?</p></div>
                <code className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: info.accent, backgroundColor: `${info.accent}10` }}>{info.rule}</code>
              </div>
              <div className="px-4 py-6 sm:px-7">
                <TraversalTree root={session.root} visited={new Set(session.order.slice(0, visitedCount))} accent={info.accent} />
                <div className="mt-2">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#71838e]">Traversal answer</p>
                  <div className="scrollbar flex justify-center gap-2 overflow-x-auto pb-2">
                    {answers.map((answer, index) => (
                      <div key={index} className="shrink-0">
                        <span className="mb-1 block text-center font-mono text-[10px] text-[#82919a]">{index + 1}</span>
                        <input
                          value={answer}
                          readOnly={index !== question}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 3);
                            setAnswers((items) => items.map((item, i) => i === index ? value : item));
                            setStatus("idle");
                          }}
                          inputMode="numeric"
                          autoFocus={index === question}
                          placeholder={index === question ? "?" : "—"}
                          className={`h-10 w-11 rounded-lg border text-center font-mono text-sm outline-none ${index < question || (index === question && status === "correct") ? "border-[#14a36f]/30 bg-[#14a36f]/[0.06] text-[#147d5a]" : index === question ? "border-[#d9e1e6] bg-[#f7f9fa] text-[#17324d] focus:border-[#1865f2]" : "border-[#d9e1e6] bg-[#f7f9fa] text-[#82919a]"}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {hint && <Feedback kind="hint">{traversalHint(traversal, question, session.order)}</Feedback>}
                {status === "wrong" && <Feedback kind="wrong">That node is not next in the {info.short.toLowerCase()} sequence. Follow the rule from the current subtree.</Feedback>}
                {status === "correct" && <Feedback kind="correct">Correct. Node {session.order[question]} is position {question + 1} in the traversal.</Feedback>}
              </div>
              <LabFooter status={status} onHint={() => setHint(true)} onCheck={check} onNext={next} last={question === session.order.length - 1} />
            </div>
          )}
        </section>
        <aside className="border-t border-[#d9e1e6] bg-[#ffffff] px-6 py-7 xl:border-l xl:border-t-0">
          <AsideTitle>{info.short} rule</AsideTitle>
          {info.rule.split(" → ").map((part, index) => <AsideItem key={part} number={`0${index + 1}`} title={`Visit ${part.toLowerCase()}`}>{traversalExplanation(traversal, part)}</AsideItem>)}
          <div className="mt-8 grid grid-cols-2 gap-2"><Stat label="Nodes" value={String(session.order.length)} /><Stat label="Questions" value={String(session.order.length)} /></div>
        </aside>
      </div>
    </div>
  );
}

function TraversalTree({ root, visited, accent }: { root: TreeNode | null; visited: Set<number>; accent: string }) {
  const nodes: Array<{ value: number; x: number; y: number; parentX?: number; parentY?: number }> = [];
  function collect(node: TreeNode | null, depth: number, min: number, max: number, parent?: { x: number; y: number }) {
    if (!node) return;
    const x = (min + max) / 2;
    const y = 12 + depth * 25;
    nodes.push({ value: node.value, x, y, parentX: parent?.x, parentY: parent?.y });
    collect(node.left, depth + 1, min, x, { x, y });
    collect(node.right, depth + 1, x, max, { x, y });
  }
  collect(root, 0, 3, 97);
  return (
    <div className="relative mx-auto h-[330px] max-w-[680px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.filter((node) => node.parentX !== undefined).map((node) => <line key={node.value} x1={node.parentX} y1={(node.parentY ?? 0) + 4} x2={node.x} y2={node.y - 4} stroke="#cbd6dc" strokeWidth="0.7" />)}
      </svg>
      {nodes.map((node) => {
        const active = visited.has(node.value);
        return <div key={node.value} className="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-sm font-semibold transition-all duration-300 sm:h-14 sm:w-14" style={{ left: `${node.x}%`, top: `${node.y}%`, borderColor: active ? accent : "rgba(255,255,255,.13)", backgroundColor: active ? `${accent}16` : "#f7f9fa", color: active ? accent : "#536977", boxShadow: active ? `0 0 24px ${accent}12` : "none" }}>{node.value}</div>;
      })}
    </div>
  );
}

function traversalHint(type: TraversalId, question: number, order: number[]) {
  if (question === 0) return type === "preorder" ? "Preorder starts at the root." : type === "inorder" ? "Inorder starts at the leftmost node." : "Postorder starts with the deepest available leaf in the left subtree.";
  return `The previous node was ${order[question - 1]}. Continue using the ${traversalInfo[type].rule.toLowerCase()} rule.`;
}

function traversalExplanation(type: TraversalId, part: string) {
  if (part === "ROOT") return type === "preorder" ? "Record the current node before exploring children." : "Record the current node after the required subtree visits.";
  if (part === "LEFT") return "Recursively apply the same traversal rule to the left subtree.";
  return "Recursively apply the same traversal rule to the right subtree.";
}

function BstPractice() {
  const [step, setStep] = useState(0);
  const [nodes, setNodes] = useState(bstSteps[0].before);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct" | "done">("idle");
  const [hint, setHint] = useState(false);
  const current = bstSteps[step];

  function updateNode(index: number, value: string) {
    setNodes((items) => items.map((item, i) => i === index ? value.replace(/\D/g, "").slice(0, 2) : item));
    setStatus("idle");
  }
  function check() {
    setStatus(nodes.every((value, index) => value === current.after[index]) ? "correct" : "wrong");
  }
  function next() {
    if (step === bstSteps.length - 1) return setStatus("done");
    const nextIndex = step + 1;
    setStep(nextIndex); setNodes(bstSteps[nextIndex].before); setStatus("idle"); setHint(false);
  }
  function reset() {
    setStep(0); setNodes(bstSteps[0].before); setStatus("idle"); setHint(false);
  }

  return (
    <div>
      <PageTitle eyebrow="Tree lab" title="Build a binary search tree" description="Compare each value with the existing nodes, then fill the correct empty slot." action={<button onClick={reset} className="flex items-center gap-2 text-sm text-[#607481] hover:text-[#17324d]"><Icon name="reset" /> Reset</button>} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="px-6 py-8 sm:px-10 lg:px-12">
          <StepRail total={bstSteps.length} current={step} done={status === "done"} labels={bstSteps.map((item) => `INSERT ${item.value}`)} color="#1865f2" />
          {status === "done" ? (
            <Complete title="Binary search tree complete" onReset={reset} />
          ) : (
            <div className="rounded-2xl border border-[#d9e1e6] bg-[#ffffff]">
              <div className="flex items-center justify-between border-b border-[#d9e1e6] px-5 py-5 sm:px-7">
                <div><span className="text-xs uppercase tracking-wider text-[#6b7d88]">Value to insert</span><p className="mt-1 font-mono text-2xl text-[#1865f2]">{current.value}</p></div>
                <div className="rounded-lg bg-[#1865f2]/[0.07] px-3 py-2 text-xs text-[#88b8ca]">LEFT &lt; NODE &lt; RIGHT</div>
              </div>
              <div className="px-4 py-6 sm:px-7">
                <p className="mb-2 text-center text-sm text-[#6b7d88]">Select an empty node and enter <span className="font-mono text-[#29404f]">{current.value}</span></p>
                <TreeCanvas nodes={nodes} changedSlot={current.slot} onChange={updateNode} />
                {hint && <Feedback kind="hint">{current.path}</Feedback>}
                {status === "wrong" && <Feedback kind="wrong">That placement breaks the BST ordering rule. Compare from the root again.</Feedback>}
                {status === "correct" && <Feedback kind="correct">{current.path}</Feedback>}
              </div>
              <LabFooter status={status} onHint={() => setHint(true)} onCheck={check} onNext={next} last={step === bstSteps.length - 1} />
            </div>
          )}
        </section>
        <aside className="border-t border-[#d9e1e6] bg-[#ffffff] px-6 py-7 xl:border-l xl:border-t-0">
          <AsideTitle>BST rules</AsideTitle>
          <AsideItem number="01" title="Start at the root">Every insertion begins by comparing with the root node.</AsideItem>
          <AsideItem number="02" title="Smaller moves left">If the value is smaller than a node, follow its left branch.</AsideItem>
          <AsideItem number="03" title="Larger moves right">If the value is larger, follow the right branch until a slot is empty.</AsideItem>
          <div className="mt-8 grid grid-cols-2 gap-2"><Stat label="Search avg." value="O(log n)" /><Stat label="Worst case" value="O(n)" /></div>
        </aside>
      </div>
    </div>
  );
}

function TreeCanvas({ nodes, changedSlot, onChange }: { nodes: string[]; changedSlot: number; onChange: (index: number, value: string) => void }) {
  const positions = [
    ["50%", "5%"], ["27%", "37%"], ["73%", "37%"], ["14%", "73%"], ["39%", "73%"], ["61%", "73%"], ["86%", "73%"],
  ];
  return (
    <div className="relative mx-auto h-[360px] max-w-[680px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="#cbd6dc" strokeWidth="0.7">
          <line x1="50" y1="15" x2="27" y2="43" /><line x1="50" y1="15" x2="73" y2="43" />
          <line x1="27" y1="47" x2="14" y2="79" /><line x1="27" y1="47" x2="39" y2="79" />
          <line x1="73" y1="47" x2="61" y2="79" /><line x1="73" y1="47" x2="86" y2="79" />
        </g>
      </svg>
      {positions.map(([left, top], index) => {
        const canEdit = !nodes[index] || index === changedSlot;
        return (
          <div key={index} className="absolute -translate-x-1/2" style={{ left, top }}>
            <span className="mb-1.5 block text-center font-mono text-[11px] text-[#82919a]">{nodeLabel(index)}</span>
            <input
              value={nodes[index]}
              onChange={(e) => onChange(index, e.target.value)}
              readOnly={!canEdit}
              inputMode="numeric"
              placeholder="+"
              aria-label={`Tree slot ${nodeLabel(index)}`}
              className={`h-14 w-14 rounded-full border-2 bg-[#ffffff] text-center font-mono text-base font-semibold outline-none transition sm:h-16 sm:w-16 ${
                nodes[index] ? "border-[#1865f2]/55 text-[#1865f2]" : "border-dashed border-[#d9e1e6] text-[#1865f2] placeholder:text-[#a5b0b7] hover:border-[#1865f2]/50 focus:border-[#1865f2]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

function nodeLabel(index: number) {
  return ["ROOT", "L", "R", "L·L", "L·R", "R·L", "R·R"][index];
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <section className="flex items-end justify-between gap-4 border-b border-[#d9e1e6] px-6 py-8 sm:px-10 lg:px-12">
      <div><span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7d88]">{eyebrow}</span><h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#17324d]">{title}</h1><p className="mt-2 max-w-xl text-sm leading-5 text-[#647782]">{description}</p></div>
      {action}
    </section>
  );
}

function StepRail({ total, current, done, labels, color }: { total: number; current: number; done: boolean; labels: string[]; color: string }) {
  return (
    <div className="scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: total }, (_, index) => {
        const complete = index < current || done;
        return <div key={index} className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs ${index === current && !done ? "border-[#d9e1e6] bg-[#f1f5f7] text-[#29404f]" : "border-[#d9e1e6] text-[#71838e]"}`}><span className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold" style={complete ? { backgroundColor: color, color: "#ffffff" } : { backgroundColor: "#edf2f5" }}>{complete ? <Icon name="check" className="h-3 w-3" /> : index + 1}</span><span className="font-mono">{labels[index]}</span></div>;
      })}
    </div>
  );
}

function TaskNumber({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <div className="mb-8"><div className="mb-3 flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e9eef2] text-xs font-bold text-[#14a36f]">{number}</span><h2 className="text-sm font-medium text-[#29404f]">{title}</h2></div><div className="sm:ml-9">{children}</div></div>;
}

function LabFooter({ status, onHint, onCheck, onNext, last }: { status: string; onHint: () => void; onCheck: () => void; onNext: () => void; last: boolean }) {
  return <div className="flex items-center justify-between border-t border-[#d9e1e6] px-5 py-4 sm:px-7"><button onClick={onHint} className="text-sm text-[#647782] hover:text-[#9b6b16]">Need a hint?</button>{status === "correct" ? <button onClick={onNext} className="rounded-lg bg-[#14a36f] px-5 py-2.5 text-sm font-bold text-[#ffffff]">{last ? "Finish lab" : "Next iteration"}</button> : <button onClick={onCheck} className="rounded-lg bg-[#1865f2] px-5 py-2.5 text-sm font-bold text-[#ffffff]">Check answer</button>}</div>;
}

function Feedback({ kind, children }: { kind: "hint" | "wrong" | "correct"; children: React.ReactNode }) {
  const styles = { hint: "border-[#b7791f]/20 bg-[#b7791f]/[0.05] text-[#8a641f]", wrong: "border-[#c83e31]/20 bg-[#c83e31]/[0.06] text-[#a94437]", correct: "border-[#14a36f]/20 bg-[#14a36f]/[0.06] text-[#287c5e]" };
  return <div className={`animate-in mt-5 rounded-lg border px-4 py-3 text-sm leading-5 ${styles[kind]}`}>{kind === "correct" && <Icon name="check" className="mr-2 inline h-3.5 w-3.5" />}{children}</div>;
}

function LessonAside({ method, config }: { method: MethodId; config: HashConfig }) {
  return (
    <aside className="border-t border-[#d9e1e6] bg-[#ffffff] px-6 py-7 xl:border-l xl:border-t-0">
      <AsideTitle>Method notes</AsideTitle>
      <AsideItem number="01" title="Primary hash">All values begin at key mod {config.tableSize} in this configuration.</AsideItem>
      <AsideItem number="02" title="Collision rule">{methodInfo[method].description}</AsideItem>
      <AsideItem number="03" title="Deletion">{method === "chaining" ? "Unlink only the matching value from its chain." : "Use a DEL marker so searches can continue probing."}</AsideItem>
      <div className="mt-8 grid grid-cols-2 gap-2"><Stat label="Table size" value={String(config.tableSize)} /><Stat label="Questions" value={String(config.questionCount)} /></div>
    </aside>
  );
}

function AsideTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#71838e]">{children}</p>;
}

function AsideItem({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <div className="mb-6 flex gap-3"><span className="font-mono text-xs text-[#14a36f]">{number}</span><div><h3 className="mb-1 text-sm font-semibold text-[#405767]">{title}</h3><p className="text-[13px] leading-5 text-[#6b7d88]">{children}</p></div></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#d9e1e6] bg-[#f3f6f8] p-3"><span className="block text-[11px] text-[#6b7d88]">{label}</span><strong className="mt-1 block font-mono text-sm font-medium text-[#29404f]">{value}</strong></div>;
}

function Complete({ title, onReset, onBack }: { title: string; onReset: () => void; onBack?: () => void }) {
  return (
    <div className="animate-in flex min-h-[580px] flex-col items-center justify-center rounded-2xl border border-[#d9e1e6] bg-[#ffffff] px-6 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#14a36f] text-[#ffffff]"><Icon name="check" className="h-7 w-7" /></span>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14a36f]">Lab complete</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[#647782]">Every value was placed correctly. You can repeat this lab or continue exploring.</p>
      <div className="mt-7 flex gap-2"><button onClick={onReset} className="rounded-lg border border-[#d9e1e6] px-4 py-2.5 text-sm text-[#536977]">Practice again</button>{onBack && <button onClick={onBack} className="rounded-lg bg-[#14a36f] px-4 py-2.5 text-sm font-bold text-[#ffffff]">All methods</button>}</div>
    </div>
  );
}
