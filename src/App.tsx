import { useMemo, useState } from "react";

type View = "directory" | "setup" | "hash" | "bst";
type MethodId = "linear" | "chaining" | "quadratic" | "double";
type HashConfig = {
  tableSize: number;
  questionCount: number;
  values: number[];
  includeDeletes: boolean;
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
    accent: "#b8f34a",
    description: "Move forward one bucket at a time until an available slot is found.",
  },
  chaining: {
    title: "Separate chaining",
    short: "Chaining",
    formula: "bucket = key mod m",
    accent: "#70d6ff",
    description: "Store colliding values together in a linked list at the same bucket.",
  },
  quadratic: {
    title: "Quadratic probing",
    short: "Quadratic",
    formula: "h(k, i) = (h(k) + i²) mod m",
    accent: "#c7a6ff",
    description: "Use squared probe offsets to spread clusters across the table.",
  },
  double: {
    title: "Double hashing",
    short: "Double hash",
    formula: "h(k, i) = (h₁(k) + i·h₂(k)) mod m",
    accent: "#ffad7d",
    description: "Use a second hash function to determine the probe step size.",
  },
};

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

  function openMethod(id: MethodId) {
    setMethod(id);
    setSession(null);
    setView("setup");
  }

  function startLab(config: HashConfig) {
    setSession({ config, lesson: generateHashLesson(method, config) });
    setView("hash");
  }

  return (
    <main className="min-h-screen bg-[#090c0b] text-[#e9efec]">
      <Header view={view} onBack={() => setView(view === "hash" ? "setup" : "directory")} />
      <div className="mx-auto flex max-w-[1536px]">
        <Navigation view={view} method={method} setView={setView} openMethod={openMethod} />
        <div className="min-w-0 flex-1">
          {view === "directory" && <HashDirectory openMethod={openMethod} openBst={() => setView("bst")} />}
          {view === "setup" && <QuestionSetup method={method} onStart={startLab} onBack={() => setView("directory")} />}
          {view === "hash" && session && <HashPractice key={`${method}-${session.config.mode}-${session.config.tableSize}`} method={method} lesson={session.lesson} config={session.config} onDirectory={() => setView("directory")} />}
          {view === "bst" && <BstPractice />}
        </div>
      </div>
    </main>
  );
}

function Header({ view, onBack }: { view: View; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#0d110f]/95 px-4 backdrop-blur md:px-7">
      <div className="flex items-center gap-6">
        <button onClick={onBack} className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#b8f34a] text-[#0c120e]">
            <span className="font-mono text-sm font-bold">{"{ }"}</span>
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.04em]">algo<span className="text-[#b8f34a]">lab</span></span>
        </button>
        {view !== "directory" && (
          <button onClick={onBack} className="hidden items-center gap-2 border-l border-white/10 pl-6 text-xs text-[#84908a] transition hover:text-white sm:flex">
            <Icon name="back" />
            All lessons
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-[#69746e] sm:block">12 day streak</span>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-[#222a26] text-xs font-semibold ring-1 ring-white/10">JS</button>
      </div>
    </header>
  );
}

function Navigation({ view, method, setView, openMethod }: { view: View; method: MethodId; setView: (view: View) => void; openMethod: (id: MethodId) => void }) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[250px] shrink-0 border-r border-white/[0.07] bg-[#0b0f0d] px-4 py-6 lg:block">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#56615b]">Data structures</p>
      <button
        onClick={() => setView("directory")}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium ${view !== "bst" ? "bg-[#151b18] text-white" : "text-[#7d8882] hover:bg-white/[0.03]"}`}
      >
        <Icon name="grid" className="h-4 w-4 text-[#b8f34a]" /> Hash tables
      </button>
      <div className="my-2 ml-5 border-l border-white/[0.07] pl-4">
        {(Object.keys(methodInfo) as MethodId[]).map((id) => (
          <button
            key={id}
            onClick={() => openMethod(id)}
            className={`block w-full rounded-md px-3 py-2 text-left text-[11px] transition ${
              (view === "hash" || view === "setup") && method === id ? "bg-white/[0.05] text-[#dbe2de]" : "text-[#66716b] hover:text-[#aeb8b3]"
            }`}
          >
            {methodInfo[id].title}
          </button>
        ))}
      </div>
      <button
        onClick={() => setView("bst")}
        className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium ${view === "bst" ? "bg-[#151b18] text-white" : "text-[#7d8882] hover:bg-white/[0.03]"}`}
      >
        <Icon name="tree" className="h-4 w-4 text-[#70d6ff]" /> Binary search tree
      </button>
      <div className="absolute inset-x-4 bottom-6 rounded-xl border border-white/[0.07] bg-[#101512] p-4">
        <div className="mb-2 flex justify-between text-[11px]"><span className="text-[#89948e]">Course progress</span><b className="text-[#b8f34a]">42%</b></div>
        <div className="h-1.5 rounded-full bg-white/[0.06]"><div className="h-full w-[42%] rounded-full bg-[#b8f34a]" /></div>
      </div>
    </aside>
  );
}

function HashDirectory({ openMethod, openBst }: { openMethod: (id: MethodId) => void; openBst: () => void }) {
  return (
    <div>
      <section className="border-b border-white/[0.07] px-5 py-9 sm:px-8 lg:px-10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8f34a]">Learning directory</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f1f5f3] sm:text-4xl">Hash tables</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7d8982]">
          Learn how hash tables resolve collisions. Each lab uses the same values and table size, so you can compare the strategies directly.
        </p>
      </section>
      <section className="px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#dce3df]">Collision resolution methods</h2>
          <span className="text-xs text-[#626d67]">4 interactive labs</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(methodInfo) as MethodId[]).map((id, index) => (
            <MethodCard key={id} id={id} index={index} onClick={() => openMethod(id)} />
          ))}
        </div>
        <div className="mt-10 mb-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#59645e]">Continue learning</span>
        </div>
        <button onClick={openBst} className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0d1210] p-5 text-left transition hover:border-[#70d6ff]/30 hover:bg-[#101613] sm:p-6">
          <div className="flex items-center gap-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#70d6ff]/10 text-[#70d6ff]"><Icon name="tree" className="h-6 w-6" /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#e5ebe8]">Binary search trees</h3>
              <p className="mt-1 text-xs text-[#707b75]">Build a tree by comparing values and filling the correct node slots.</p>
            </div>
          </div>
          <Icon name="arrow" className="h-5 w-5 text-[#58635d] transition group-hover:translate-x-1 group-hover:text-[#70d6ff]" />
        </button>
      </section>
    </div>
  );
}

function MethodCard({ id, index, onClick }: { id: MethodId; index: number; onClick: () => void }) {
  const info = methodInfo[id];
  return (
    <button onClick={onClick} className="group rounded-2xl border border-white/[0.08] bg-[#0d1210] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#101613] sm:p-6">
      <div className="mb-6 flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl font-mono text-xs font-semibold" style={{ color: info.accent, backgroundColor: `${info.accent}12` }}>0{index + 1}</span>
        <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#68736d]">Interactive</span>
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#e7edea]">{info.title}</h3>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#707b75]">{info.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <code className="text-[10px]" style={{ color: info.accent }}>{info.formula}</code>
        <span className="flex items-center gap-1 text-[10px] font-medium text-[#87928c] transition group-hover:text-white">Start lab <Icon name="arrow" className="h-3 w-3" /></span>
      </div>
    </button>
  );
}

function QuestionSetup({ method, onStart, onBack }: { method: MethodId; onStart: (config: HashConfig) => void; onBack: () => void }) {
  const info = methodInfo[method];
  const [choice, setChoice] = useState<"default" | "custom">("default");
  const [tableSize, setTableSize] = useState(11);
  const [questionCount, setQuestionCount] = useState(10);
  const [valueText, setValueText] = useState("18, 29, 40, 15, 26, 51, 22, 62");
  const [includeDeletes, setIncludeDeletes] = useState(true);

  function begin() {
    if (choice === "default") {
      onStart({ tableSize: 11, questionCount: 10, values: recommendedValues, includeDeletes: true, mode: "default" });
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
      <PageTitle eyebrow="Practice setup" title={info.title} description="Choose a ready-made learning path or control the question configuration yourself." action={<button onClick={onBack} className="flex items-center gap-2 text-xs text-[#7b8680] hover:text-white"><Icon name="back" /> Directory</button>} />
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-7">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#e8eeeb]">How would you like to practice?</h2>
          <p className="mt-1.5 text-xs text-[#717c76]">You can change this choice whenever you restart the lab.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setChoice("default")}
            className={`relative rounded-2xl border p-5 text-left transition sm:p-6 ${choice === "default" ? "border-[#b8f34a]/55 bg-[#b8f34a]/[0.055]" : "border-white/[0.08] bg-[#0d1210] hover:border-white/[0.16]"}`}
          >
            <div className="mb-5 flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#b8f34a]/10 text-[#b8f34a]"><Icon name="check" className="h-5 w-5" /></span>
              <span className="rounded-full bg-[#b8f34a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#111610]">Recommended</span>
            </div>
            <h3 className="text-base font-semibold text-[#e9eeec]">Use default questions</h3>
            <p className="mt-2 text-xs leading-5 text-[#748079]">A curated set of 10 questions that gradually introduces collisions, probing, and deletion.</p>
            <div className="mt-5 flex items-center gap-2">
              {["3 Easy", "4 Medium", "3 Hard"].map((label, index) => <span key={label} className={`rounded-md px-2 py-1 text-[9px] font-medium ${index === 0 ? "bg-[#b8f34a]/10 text-[#a9dc50]" : index === 1 ? "bg-[#eac46c]/10 text-[#d6b45f]" : "bg-[#ff8a76]/10 text-[#dd7b6a]"}`}>{label}</span>)}
            </div>
          </button>

          <button
            onClick={() => setChoice("custom")}
            className={`rounded-2xl border p-5 text-left transition sm:p-6 ${choice === "custom" ? "border-[#70d6ff]/50 bg-[#70d6ff]/[0.045]" : "border-white/[0.08] bg-[#0d1210] hover:border-white/[0.16]"}`}
          >
            <div className="mb-5 flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#70d6ff]/10 font-mono text-lg text-[#70d6ff]">≡</span>
              <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#6f7a74]">Flexible</span>
            </div>
            <h3 className="text-base font-semibold text-[#e9eeec]">Customize questions</h3>
            <p className="mt-2 text-xs leading-5 text-[#748079]">Set the table size, number of questions, source values, and whether deletion is included.</p>
            <div className="mt-5 font-mono text-[10px] text-[#6d929f]">YOUR VALUES · YOUR CONFIG</div>
          </button>
        </div>

        {choice === "default" ? (
          <div className="animate-in mt-6 rounded-2xl border border-white/[0.08] bg-[#0d1210] p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-sm font-semibold text-[#dfe6e2]">Recommended question path</h3><p className="mt-1 text-[11px] text-[#68736d]">Table size 11 · Primary hash: key mod 11 · Insert and delete</p></div>
              <span className="text-xs font-semibold text-[#b8f34a]">10 questions</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => {
                const difficulty = index < 3 ? "Easy" : index < 7 ? "Medium" : "Hard";
                const action = index === 5 || index === 8 ? "Delete" : "Insert";
                const values = [18, 29, 40, 15, 26, 29, 51, 22, 18, 62];
                return <div key={index} className="rounded-lg border border-white/[0.06] bg-[#090d0b] p-3"><div className="mb-2 flex justify-between"><span className="font-mono text-[9px] text-[#56615b]">Q{index + 1}</span><span className={`text-[8px] font-semibold uppercase ${difficulty === "Easy" ? "text-[#9ac944]" : difficulty === "Medium" ? "text-[#d1ae58]" : "text-[#d87666]"}`}>{difficulty}</span></div><p className="font-mono text-[11px] text-[#bcc5c0]">{action} {values[index]}</p></div>;
              })}
            </div>
          </div>
        ) : (
          <div className="animate-in mt-6 rounded-2xl border border-white/[0.08] bg-[#0d1210] p-5 sm:p-6">
            <div className="mb-6"><h3 className="text-sm font-semibold text-[#dfe6e2]">Question configuration</h3><p className="mt-1 text-[11px] text-[#68736d]">Prime table sizes are used to keep every probe sequence valid.</p></div>
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
                <label className="flex h-11 items-center justify-between rounded-lg border border-white/[0.09] bg-[#090d0b] px-3 text-xs text-[#aeb7b2]">
                  Include deletion
                  <input
                    type="checkbox"
                    checked={includeDeletes}
                    onChange={(e) => {
                      setIncludeDeletes(e.target.checked);
                      if (!e.target.checked && questionCount > tableSize) setQuestionCount(tableSize);
                    }}
                    className="h-4 w-4 accent-[#b8f34a]"
                  />
                </label>
              </Setting>
              <Setting label="Collision strategy" help="Determined by the selected problem type">
                <div className="flex h-11 items-center rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 text-xs text-[#7c8781]">{info.title}</div>
              </Setting>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-6">
          <p className="hidden text-[11px] text-[#626d67] sm:block">{choice === "default" ? "Best for first-time practice" : "The lab is generated from your settings"}</p>
          <button onClick={begin} className="ml-auto flex items-center gap-2 rounded-lg bg-[#b8f34a] px-5 py-3 text-xs font-bold text-[#111610] transition hover:bg-[#c7fa64]">Generate questions <Icon name="arrow" className="h-3.5 w-3.5" /></button>
        </div>
      </section>
    </div>
  );
}

function Setting({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-[#cbd3cf]">{label}</span><span className="mb-2 block text-[10px] text-[#626d67]">{help}</span>{children}</label>;
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
    if (step === lesson.length - 1) return setStatus("done");
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
      <PageTitle eyebrow="Hash table lab" title={info.title} description={info.description} action={<button onClick={reset} className="flex items-center gap-2 text-xs text-[#7b8680] hover:text-white"><Icon name="reset" /> Reset</button>} />
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="px-5 py-6 sm:px-8 lg:px-10">
          <StepRail total={lesson.length} current={step} done={status === "done"} labels={lesson.map((item) => `${item.action} ${item.value}`)} color={info.accent} />
          {status === "done" ? (
            <Complete title={`${info.title} complete`} onReset={reset} onBack={onDirectory} />
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d1210]">
              <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
                <div className="flex items-center gap-4">
                  <span className="rounded-md px-2.5 py-1.5 font-mono text-[10px] font-bold" style={{ color: info.accent, backgroundColor: `${info.accent}12` }}>{current.action}</span>
                  <div><span className="text-[10px] text-[#65706a]">CURRENT VALUE</span><p className="font-mono text-xl">{current.value}</p></div>
                </div>
                <code className="rounded-lg border border-white/[0.07] bg-[#090d0b] px-4 py-2.5 text-[10px] text-[#929d97]">{info.formula}</code>
              </div>
              <div className="px-5 py-7 sm:px-7">
                <TaskNumber number="1" title="Calculate the primary hash">
                  <div className="flex items-center gap-3 font-mono text-sm text-[#89948e]">
                    <span>{current.value} mod {config.tableSize} =</span>
                    <input value={hash} onChange={(e) => { setHash(e.target.value.replace(/\D/g, "").slice(0, 1)); setStatus("idle"); }} placeholder="?" className="h-10 w-14 rounded-lg border border-white/[0.1] bg-[#090d0b] text-center text-white outline-none focus:border-[#b8f34a]/50" />
                  </div>
                </TaskNumber>
                <TaskNumber number="2" title={method === "chaining" ? "Update the correct chain" : "Update the correct bucket"}>
                  <p className="mb-4 text-xs text-[#67726c]">{method === "chaining" ? "Use → between values in a chain." : current.action === "DELETE" ? "Use DEL to mark the deleted bucket." : "Resolve any collision using this lab's probe formula."}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
                    {draft.map((value, index) => (
                      <label key={index}>
                        <span className="mb-2 block text-center font-mono text-[10px] text-[#59645e]">[{index}]</span>
                        <div className={`relative flex h-[76px] items-center rounded-xl border bg-[#090d0b] transition ${changed === index ? "border-[#b8f34a]/50" : "border-white/[0.08] focus-within:border-white/30"}`}>
                          <input value={value} onChange={(e) => update(index, e.target.value.toUpperCase())} placeholder="—" className={`w-full bg-transparent px-1 text-center font-mono text-xs outline-none placeholder:text-[#303a35] ${value === DEL ? "text-[#ff9e72]" : "text-[#dfe6e2]"}`} />
                          {changed === index && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#b8f34a]" />}
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
      <PageTitle eyebrow="Tree lab" title="Build a binary search tree" description="Compare each value with the existing nodes, then fill the correct empty slot." action={<button onClick={reset} className="flex items-center gap-2 text-xs text-[#7b8680] hover:text-white"><Icon name="reset" /> Reset</button>} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="px-5 py-6 sm:px-8 lg:px-10">
          <StepRail total={bstSteps.length} current={step} done={status === "done"} labels={bstSteps.map((item) => `INSERT ${item.value}`)} color="#70d6ff" />
          {status === "done" ? (
            <Complete title="Binary search tree complete" onReset={reset} />
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d1210]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-7">
                <div><span className="text-[10px] uppercase tracking-wider text-[#637069]">Value to insert</span><p className="mt-1 font-mono text-2xl text-[#70d6ff]">{current.value}</p></div>
                <div className="rounded-lg bg-[#70d6ff]/[0.07] px-3 py-2 text-[10px] text-[#88b8ca]">LEFT &lt; NODE &lt; RIGHT</div>
              </div>
              <div className="px-4 py-6 sm:px-7">
                <p className="mb-2 text-center text-xs text-[#6d7872]">Select an empty node and enter <span className="font-mono text-[#cdd5d1]">{current.value}</span></p>
                <TreeCanvas nodes={nodes} changedSlot={current.slot} onChange={updateNode} />
                {hint && <Feedback kind="hint">{current.path}</Feedback>}
                {status === "wrong" && <Feedback kind="wrong">That placement breaks the BST ordering rule. Compare from the root again.</Feedback>}
                {status === "correct" && <Feedback kind="correct">{current.path}</Feedback>}
              </div>
              <LabFooter status={status} onHint={() => setHint(true)} onCheck={check} onNext={next} last={step === bstSteps.length - 1} />
            </div>
          )}
        </section>
        <aside className="border-t border-white/[0.07] bg-[#0b0f0d] px-6 py-7 xl:border-l xl:border-t-0">
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
        <g stroke="#29342e" strokeWidth="0.7">
          <line x1="50" y1="15" x2="27" y2="43" /><line x1="50" y1="15" x2="73" y2="43" />
          <line x1="27" y1="47" x2="14" y2="79" /><line x1="27" y1="47" x2="39" y2="79" />
          <line x1="73" y1="47" x2="61" y2="79" /><line x1="73" y1="47" x2="86" y2="79" />
        </g>
      </svg>
      {positions.map(([left, top], index) => {
        const canEdit = !nodes[index] || index === changedSlot;
        return (
          <div key={index} className="absolute -translate-x-1/2" style={{ left, top }}>
            <span className="mb-1.5 block text-center font-mono text-[9px] text-[#4f5b54]">{nodeLabel(index)}</span>
            <input
              value={nodes[index]}
              onChange={(e) => onChange(index, e.target.value)}
              readOnly={!canEdit}
              inputMode="numeric"
              placeholder="+"
              aria-label={`Tree slot ${nodeLabel(index)}`}
              className={`h-14 w-14 rounded-full border-2 bg-[#0a0e0c] text-center font-mono text-base font-semibold outline-none transition sm:h-16 sm:w-16 ${
                nodes[index] ? "border-[#70d6ff]/55 text-[#dff6ff]" : "border-dashed border-white/[0.14] text-[#70d6ff] placeholder:text-[#46544d] hover:border-[#70d6ff]/50 focus:border-[#70d6ff]"
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
    <section className="flex items-end justify-between gap-4 border-b border-white/[0.07] px-5 py-7 sm:px-8 lg:px-10">
      <div><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f7a74]">{eyebrow}</span><h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#f0f4f2]">{title}</h1><p className="mt-2 max-w-xl text-xs leading-5 text-[#758079]">{description}</p></div>
      {action}
    </section>
  );
}

function StepRail({ total, current, done, labels, color }: { total: number; current: number; done: boolean; labels: string[]; color: string }) {
  return (
    <div className="scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: total }, (_, index) => {
        const complete = index < current || done;
        return <div key={index} className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[10px] ${index === current && !done ? "border-white/[0.15] bg-white/[0.04] text-[#dce3df]" : "border-white/[0.05] text-[#56615b]"}`}><span className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold" style={complete ? { backgroundColor: color, color: "#0b100d" } : { backgroundColor: "#171d1a" }}>{complete ? <Icon name="check" className="h-3 w-3" /> : index + 1}</span><span className="font-mono">{labels[index]}</span></div>;
      })}
    </div>
  );
}

function TaskNumber({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <div className="mb-8"><div className="mb-3 flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#202823] text-[10px] font-bold text-[#b8f34a]">{number}</span><h2 className="text-sm font-medium text-[#dce3df]">{title}</h2></div><div className="sm:ml-9">{children}</div></div>;
}

function LabFooter({ status, onHint, onCheck, onNext, last }: { status: string; onHint: () => void; onCheck: () => void; onNext: () => void; last: boolean }) {
  return <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-4 sm:px-7"><button onClick={onHint} className="text-xs text-[#77827c] hover:text-[#e8c978]">Need a hint?</button>{status === "correct" ? <button onClick={onNext} className="rounded-lg bg-[#b8f34a] px-5 py-2.5 text-xs font-bold text-[#111610]">{last ? "Finish lab" : "Next iteration"}</button> : <button onClick={onCheck} className="rounded-lg bg-[#e7ede9] px-5 py-2.5 text-xs font-bold text-[#151a17]">Check answer</button>}</div>;
}

function Feedback({ kind, children }: { kind: "hint" | "wrong" | "correct"; children: React.ReactNode }) {
  const styles = { hint: "border-[#eac46c]/20 bg-[#eac46c]/[0.05] text-[#bcaf8e]", wrong: "border-[#ff735c]/20 bg-[#ff735c]/[0.06] text-[#dc9488]", correct: "border-[#b8f34a]/20 bg-[#b8f34a]/[0.06] text-[#a9c675]" };
  return <div className={`animate-in mt-5 rounded-lg border px-4 py-3 text-xs leading-5 ${styles[kind]}`}>{kind === "correct" && <Icon name="check" className="mr-2 inline h-3.5 w-3.5" />}{children}</div>;
}

function LessonAside({ method, config }: { method: MethodId; config: HashConfig }) {
  return (
    <aside className="border-t border-white/[0.07] bg-[#0b0f0d] px-6 py-7 xl:border-l xl:border-t-0">
      <AsideTitle>Method notes</AsideTitle>
      <AsideItem number="01" title="Primary hash">All values begin at key mod {config.tableSize} in this configuration.</AsideItem>
      <AsideItem number="02" title="Collision rule">{methodInfo[method].description}</AsideItem>
      <AsideItem number="03" title="Deletion">{method === "chaining" ? "Unlink only the matching value from its chain." : "Use a DEL marker so searches can continue probing."}</AsideItem>
      <div className="mt-8 grid grid-cols-2 gap-2"><Stat label="Table size" value={String(config.tableSize)} /><Stat label="Questions" value={String(config.questionCount)} /></div>
    </aside>
  );
}

function AsideTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#5f6a64]">{children}</p>;
}

function AsideItem({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <div className="mb-6 flex gap-3"><span className="font-mono text-[10px] text-[#b8f34a]">{number}</span><div><h3 className="mb-1 text-xs font-semibold text-[#cbd3cf]">{title}</h3><p className="text-[11px] leading-5 text-[#6f7a74]">{children}</p></div></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/[0.06] bg-[#101512] p-3"><span className="block text-[9px] text-[#68736d]">{label}</span><strong className="mt-1 block font-mono text-sm font-medium text-[#dbe2de]">{value}</strong></div>;
}

function Complete({ title, onReset, onBack }: { title: string; onReset: () => void; onBack?: () => void }) {
  return (
    <div className="animate-in flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0d1210] px-6 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#b8f34a] text-[#111610]"><Icon name="check" className="h-7 w-7" /></span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8f34a]">Lab complete</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[#748079]">Every value was placed correctly. You can repeat this lab or continue exploring.</p>
      <div className="mt-7 flex gap-2"><button onClick={onReset} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-[#aeb7b2]">Practice again</button>{onBack && <button onClick={onBack} className="rounded-lg bg-[#b8f34a] px-4 py-2.5 text-xs font-bold text-[#111610]">All methods</button>}</div>
    </div>
  );
}
