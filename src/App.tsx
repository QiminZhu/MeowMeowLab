import { useMemo, useState } from "react";

type IconProps = { className?: string };
type Operation = {
  action: "INSERT" | "DELETE";
  value: number;
  hash: number;
  slot: number;
  before: string[];
  after: string[];
  note: string;
};

const EMPTY = "";
const DELETED = "DEL";
const initialTable = Array(7).fill(EMPTY);

const operations: Operation[] = [
  {
    action: "INSERT",
    value: 18,
    hash: 4,
    slot: 4,
    before: [...initialTable],
    after: ["", "", "", "", "18", "", ""],
    note: "Bucket 4 is empty, so 18 can be inserted directly.",
  },
  {
    action: "INSERT",
    value: 41,
    hash: 6,
    slot: 6,
    before: ["", "", "", "", "18", "", ""],
    after: ["", "", "", "", "18", "", "41"],
    note: "Bucket 6 is empty, so 41 can be inserted directly.",
  },
  {
    action: "INSERT",
    value: 22,
    hash: 1,
    slot: 1,
    before: ["", "", "", "", "18", "", "41"],
    after: ["", "22", "", "", "18", "", "41"],
    note: "The hash points to bucket 1. No probing is needed.",
  },
  {
    action: "INSERT",
    value: 44,
    hash: 2,
    slot: 2,
    before: ["", "22", "", "", "18", "", "41"],
    after: ["", "22", "44", "", "18", "", "41"],
    note: "Bucket 2 is available, so the value is placed there.",
  },
  {
    action: "INSERT",
    value: 25,
    hash: 4,
    slot: 5,
    before: ["", "22", "44", "", "18", "", "41"],
    after: ["", "22", "44", "", "18", "25", "41"],
    note: "Bucket 4 contains 18. Linear probing moves to bucket 5.",
  },
  {
    action: "DELETE",
    value: 41,
    hash: 6,
    slot: 6,
    before: ["", "22", "44", "", "18", "25", "41"],
    after: ["", "22", "44", "", "18", "25", DELETED],
    note: "Mark bucket 6 as deleted so future probe chains remain intact.",
  },
];

function Logo({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="10" fill="#B8F34A" />
      <path d="M9 11h6l-3 6 3 6H9l-3-6 3-6ZM25 11h-6l3 6-3 6h6l3-6-3-6Z" fill="#0B110E" />
    </svg>
  );
}

function ArrowLeft({ className = "h-4 w-4" }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>;
}

function Check({ className = "h-4 w-4" }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m5 12 4 4L19 6" /></svg>;
}

function Rotate({ className = "h-4 w-4" }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4v6h6M20 20v-6h-6" /><path d="M5.6 15A8 8 0 0 0 19 8.2L20 10M4 14l1-2.2A8 8 0 0 1 18.4 5" /></svg>;
}

function Lightbulb({ className = "h-4 w-4" }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18h6M10 22h4M8.3 15.5a7 7 0 1 1 7.4 0c-.5.4-.7 1-.7 1.5H9c0-.5-.2-1.1-.7-1.5Z" /></svg>;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<string[]>(operations[0].before);
  const [hashAnswer, setHashAnswer] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct" | "complete">("idle");
  const [showHint, setShowHint] = useState(false);

  const operation = operations[step];
  const completedCount = status === "complete" ? operations.length : step;
  const progress = Math.round((completedCount / operations.length) * 100);

  const changedBucket = useMemo(
    () => draft.findIndex((value, index) => value !== operation.before[index]),
    [draft, operation],
  );

  function editBucket(index: number, value: string) {
    if (status === "correct" || status === "complete") return;
    setSelectedBucket(index);
    setDraft((current) => current.map((item, itemIndex) => itemIndex === index ? value.toUpperCase().slice(0, 3) : item));
    setStatus("idle");
  }

  function selectBucket(index: number) {
    if (status === "correct" || status === "complete") return;
    setSelectedBucket(index);
    setStatus("idle");
  }

  function checkStep() {
    const hashIsCorrect = Number(hashAnswer) === operation.hash && hashAnswer.trim() !== "";
    const tableIsCorrect = draft.every((value, index) => value === operation.after[index]);

    if (hashIsCorrect && tableIsCorrect) {
      setStatus("correct");
      setShowHint(false);
    } else {
      setStatus("wrong");
    }
  }

  function nextStep() {
    if (step === operations.length - 1) {
      setStatus("complete");
      return;
    }

    const next = step + 1;
    setStep(next);
    setDraft(operations[next].before);
    setHashAnswer("");
    setSelectedBucket(null);
    setStatus("idle");
    setShowHint(false);
  }

  function resetLab() {
    setStep(0);
    setDraft(operations[0].before);
    setHashAnswer("");
    setSelectedBucket(null);
    setStatus("idle");
    setShowHint(false);
  }

  function fillHint() {
    setShowHint(true);
    setSelectedBucket(operation.slot);
  }

  return (
    <main className="min-h-screen bg-[#090c0b] text-[#e9efec]">
      <header className="flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#0d110f] px-4 md:px-7">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2.5" aria-label="AlgoLab home">
            <Logo />
            <span className="text-[17px] font-semibold tracking-[-0.04em]">algo<span className="text-[#b8f34a]">lab</span></span>
          </button>
          <div className="hidden h-5 w-px bg-white/10 sm:block" />
          <button className="hidden items-center gap-2 text-sm text-[#8b9690] transition hover:text-white sm:flex">
            <ArrowLeft />
            Learning path
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-[#79847e] md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b8f34a]" />
            Progress saved
          </div>
          <button
            onClick={resetLab}
            className="flex items-center gap-2 rounded-lg border border-white/[0.09] px-3 py-2 text-xs font-medium text-[#aeb8b3] transition hover:bg-white/5 hover:text-white"
          >
            <Rotate />
            <span className="hidden sm:inline">Reset lab</span>
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-[#222a26] text-xs font-semibold text-[#d0d8d4] ring-1 ring-white/10">JS</button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden min-h-[calc(100vh-64px)] w-[260px] shrink-0 border-r border-white/[0.07] bg-[#0b0f0d] px-5 py-7 lg:block">
          <p className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#58635d]">Data structures</p>
          <div className="space-y-1">
            <SideItem label="Arrays & strings" number="01" done />
            <SideItem label="Linked lists" number="02" done />
            <SideItem label="Stacks & queues" number="03" done />
            <SideItem label="Hash tables" number="04" active />
            <SideItem label="Binary trees" number="05" />
            <SideItem label="Graphs" number="06" />
          </div>
          <div className="mt-9 rounded-xl border border-white/[0.07] bg-[#101512] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-[#c3ccc7]">Course progress</span>
              <span className="text-xs font-semibold text-[#b8f34a]">42%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[42%] rounded-full bg-[#b8f34a]" />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#6e7973]">12 of 28 interactive labs completed</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <section className="border-b border-white/[0.07] px-5 py-7 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#76817b]">
                  <span>Hash tables</span>
                  <span className="text-[#3f4944]">/</span>
                  <span>Linear probing</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#f3f6f4] sm:text-[30px]">Trace the hash table</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#84908a]">
                  Complete each operation by calculating its hash and updating the correct bucket.
                </p>
              </div>
              <div className="min-w-[220px]">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-[#89948e]">LAB PROGRESS</span>
                  <span className="text-[#b8f34a]">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-[#b8f34a] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-h-[calc(100vh-210px)] xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 px-5 py-6 sm:px-8 lg:px-10">
              <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
                {operations.map((item, index) => {
                  const isDone = index < step || status === "complete";
                  const isCurrent = index === step && status !== "complete";
                  return (
                    <div
                      key={`${item.action}-${item.value}`}
                      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        isCurrent
                          ? "border-[#b8f34a]/35 bg-[#b8f34a]/[0.07] text-[#e4ebE7]"
                          : isDone
                            ? "border-white/[0.06] bg-[#101512] text-[#77827c]"
                            : "border-white/[0.05] text-[#4e5953]"
                      }`}
                    >
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${
                        isDone ? "bg-[#b8f34a] text-[#111610]" : isCurrent ? "bg-[#b8f34a]/15 text-[#b8f34a]" : "bg-white/[0.04]"
                      }`}>
                        {isDone ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className="font-mono"><b className="font-medium">{item.action}</b> {item.value}</span>
                    </div>
                  );
                })}
              </div>

              {status === "complete" ? (
                <Completion onReset={resetLab} />
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0d1210] shadow-2xl shadow-black/20">
                  <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
                    <div className="flex items-center gap-4">
                      <span className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-wider ${
                        operation.action === "INSERT" ? "bg-[#b8f34a]/10 text-[#b8f34a]" : "bg-[#ff9e72]/10 text-[#ff9e72]"
                      }`}>
                        {operation.action}
                      </span>
                      <div>
                        <span className="text-xs text-[#68736d]">Current value</span>
                        <p className="font-mono text-xl font-medium text-[#edf2ef]">{operation.value}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.07] bg-[#090d0b] px-4 py-2.5 font-mono text-xs text-[#8e9993]">
                      hash(key) = key mod <span className="text-[#d8dfdb]">7</span>
                    </div>
                  </div>

                  <div className="px-5 py-6 sm:px-7 sm:py-8">
                    <div className="mb-8">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#202823] text-[11px] font-semibold text-[#b8f34a]">1</span>
                        <label htmlFor="hash-answer" className="text-sm font-medium text-[#dce3df]">Calculate the starting index</label>
                      </div>
                      <div className="ml-0 flex flex-wrap items-center gap-3 sm:ml-9">
                        <div className="flex items-center gap-2 font-mono text-sm text-[#89948e]">
                          <span>{operation.value}</span>
                          <span>mod</span>
                          <span>7</span>
                          <span>=</span>
                        </div>
                        <input
                          id="hash-answer"
                          value={hashAnswer}
                          onChange={(event) => {
                            setHashAnswer(event.target.value.replace(/\D/g, "").slice(0, 1));
                            setStatus("idle");
                          }}
                          inputMode="numeric"
                          placeholder="?"
                          className={`h-10 w-14 rounded-lg border bg-[#090d0b] text-center font-mono text-sm outline-none transition ${
                            status === "wrong" && Number(hashAnswer) !== operation.hash
                              ? "border-[#ff735c]/60 text-[#ff8a76]"
                              : "border-white/[0.1] text-[#e3e9e6] focus:border-[#b8f34a]/60"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#202823] text-[11px] font-semibold text-[#b8f34a]">2</span>
                        <h2 className="text-sm font-medium text-[#dce3df]">
                          {operation.action === "INSERT" ? `Place ${operation.value} in the table` : `Delete ${operation.value} from the table`}
                        </h2>
                      </div>
                      <p className="mb-5 ml-0 text-xs text-[#69746e] sm:ml-9">
                        Click a bucket and type {operation.action === "INSERT" ? "the value" : <><span className="font-mono text-[#9aa49f]">DEL</span> to leave a tombstone</>}.
                      </p>

                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
                        {draft.map((value, index) => {
                          const isChanged = changedBucket === index;
                          const isSelected = selectedBucket === index;
                          return (
                            <label key={index} className="group block">
                              <span className={`mb-2 block text-center font-mono text-[10px] ${isSelected ? "text-[#b8f34a]" : "text-[#59645e]"}`}>
                                [{index}]
                              </span>
                              <div
                                onClick={() => selectBucket(index)}
                                className={`relative flex aspect-square min-h-[62px] cursor-text items-center justify-center rounded-xl border transition ${
                                  isSelected
                                    ? "border-[#b8f34a]/70 bg-[#b8f34a]/[0.06] shadow-[0_0_0_3px_rgba(184,243,74,0.05)]"
                                    : isChanged
                                      ? "border-[#b8f34a]/25 bg-[#151c17]"
                                      : "border-white/[0.08] bg-[#090d0b] hover:border-white/[0.18]"
                                }`}
                              >
                                <input
                                  value={value}
                                  onFocus={() => selectBucket(index)}
                                  onChange={(event) => editBucket(index, event.target.value)}
                                  aria-label={`Bucket ${index}`}
                                  placeholder="—"
                                  className={`h-full w-full bg-transparent text-center font-mono text-base font-medium outline-none placeholder:text-[#303a35] ${
                                    value === DELETED ? "text-[#ff9e72]" : value ? "text-[#dfe6e2]" : ""
                                  }`}
                                />
                                {isChanged && value && (
                                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#b8f34a]" />
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {showHint && (
                      <div className="animate-in mt-6 flex gap-3 rounded-lg border border-[#eac46c]/15 bg-[#eac46c]/[0.05] px-4 py-3 text-xs leading-5 text-[#b9ad8f]">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#eac46c]" />
                        <span>
                          Start at bucket <strong className="font-mono text-[#e4d5ad]">{operation.hash}</strong>.
                          {operation.slot !== operation.hash
                            ? ` It is occupied, so use linear probing to find the next available bucket.`
                            : operation.action === "DELETE"
                              ? ` Replace the matching value with DEL, not an empty bucket.`
                              : ` This bucket is available for the value.`}
                        </span>
                      </div>
                    )}

                    {status === "wrong" && (
                      <div className="animate-in mt-6 rounded-lg border border-[#ff735c]/20 bg-[#ff735c]/[0.06] px-4 py-3 text-xs text-[#db9589]">
                        Not quite. Check the hash result and make sure only the correct bucket is changed.
                      </div>
                    )}

                    {status === "correct" && (
                      <div className="animate-in mt-6 flex items-start gap-3 rounded-lg border border-[#b8f34a]/20 bg-[#b8f34a]/[0.06] px-4 py-3">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#b8f34a] text-[#111610]"><Check className="h-3 w-3" /></span>
                        <div>
                          <p className="text-xs font-semibold text-[#cbed8d]">Correct iteration</p>
                          <p className="mt-1 text-xs leading-5 text-[#829074]">{operation.note}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-4 sm:px-7">
                    <button
                      onClick={fillHint}
                      className="flex items-center gap-2 text-xs font-medium text-[#7e8983] transition hover:text-[#eac46c]"
                    >
                      <Lightbulb />
                      Need a hint?
                    </button>
                    {status === "correct" ? (
                      <button
                        onClick={nextStep}
                        className="rounded-lg bg-[#b8f34a] px-5 py-2.5 text-xs font-bold text-[#10150f] transition hover:bg-[#c8fa67]"
                      >
                        {step === operations.length - 1 ? "Finish lab" : "Next operation"}
                      </button>
                    ) : (
                      <button
                        onClick={checkStep}
                        className="rounded-lg bg-[#e7ede9] px-5 py-2.5 text-xs font-bold text-[#151a17] transition hover:bg-white"
                      >
                        Check iteration
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <aside className="border-t border-white/[0.07] bg-[#0b0f0d] px-6 py-7 xl:border-l xl:border-t-0">
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#5f6a64]">How it works</p>
              <div className="space-y-6">
                <InfoBlock number="01" title="Calculate the hash">
                  The modulo function maps each key to a starting bucket between 0 and 6.
                </InfoBlock>
                <InfoBlock number="02" title="Resolve collisions">
                  If a bucket is occupied, check the next bucket until an available slot is found.
                </InfoBlock>
                <InfoBlock number="03" title="Preserve probe chains">
                  Deletions use a <Code>DEL</Code> marker so searches do not stop too early.
                </InfoBlock>
              </div>

              <div className="mt-8 border-t border-white/[0.07] pt-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#5f6a64]">Complexity</p>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Average" value="O(1)" />
                  <Stat label="Worst case" value="O(n)" />
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function SideItem({ label, number, active, done }: { label: string; number: string; active?: boolean; done?: boolean }) {
  return (
    <button className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-xs transition ${
      active ? "bg-[#171e1a] text-[#e4ebe7]" : "text-[#707b75] hover:bg-white/[0.03] hover:text-[#b4bdb8]"
    }`}>
      <span className={`grid h-6 w-6 place-items-center rounded-md font-mono text-[9px] ${
        active ? "bg-[#b8f34a] font-bold text-[#10150f]" : done ? "bg-[#b8f34a]/10 text-[#9fcf48]" : "bg-white/[0.04] text-[#58635d]"
      }`}>
        {done ? <Check className="h-3 w-3" /> : number}
      </span>
      {label}
    </button>
  );
}

function InfoBlock({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="font-mono text-[10px] text-[#b8f34a]">{number}</span>
      <div>
        <h3 className="mb-1.5 text-xs font-semibold text-[#cbd3cf]">{title}</h3>
        <p className="text-[11px] leading-5 text-[#6f7a74]">{children}</p>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-[#d2dad6]">{children}</code>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#101512] p-3">
      <span className="block text-[10px] text-[#68736d]">{label}</span>
      <strong className="mt-1 block font-mono text-sm font-medium text-[#dbe2de]">{value}</strong>
    </div>
  );
}

function Completion({ onReset }: { onReset: () => void }) {
  return (
    <div className="animate-in flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0d1210] px-6 text-center">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#b8f34a] text-[#111610] shadow-[0_0_50px_rgba(184,243,74,0.14)]">
        <Check className="h-7 w-7" />
      </div>
      <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8f34a]">Lab complete</span>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#edf2ef]">Hash table mastered</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[#76817b]">
        You completed all six iterations, including collision resolution and deletion with a tombstone.
      </p>
      <div className="mt-7 flex gap-3">
        <button onClick={onReset} className="flex items-center gap-2 rounded-lg border border-white/[0.1] px-4 py-2.5 text-xs font-semibold text-[#abb5b0] transition hover:bg-white/5">
          <Rotate />
          Practice again
        </button>
        <button className="rounded-lg bg-[#b8f34a] px-4 py-2.5 text-xs font-bold text-[#111610] transition hover:bg-[#c8fa67]">Continue course</button>
      </div>
    </div>
  );
}
