import { useMemo, useState } from "react";

type IconProps = {
  className?: string;
};

function LogoMark({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M10 9.5h5.25L12.6 16l2.65 6.5H10L7.5 16 10 9.5Z" fill="#08110D" />
      <path d="M22 9.5h-5.25L19.4 16l-2.65 6.5H22l2.5-6.5L22 9.5Z" fill="#08110D" />
    </svg>
  );
}

function ChevronLeft({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Play({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function CheckCircle({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function Settings({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.82 2.82-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .64 1.7 1.7 0 0 0-.36 1.04V21h-4v-.08a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.82-2.82.06-.06A1.7 1.7 0 0 0 4.18 15a1.7 1.7 0 0 0-.64-1A1.7 1.7 0 0 0 2.5 13.6h-.08v-4h.08a1.7 1.7 0 0 0 1.68-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.6 3.74l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-.64 1.7 1.7 0 0 0 .36-1.04v-.08h4v.08A1.7 1.7 0 0 0 15 4.14a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.82 2.82-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 .64 1 1.7 1.7 0 0 0 1.04.36h.08v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

const starterCode = `function twoSum(nums, target) {
  // Write your solution here
  
  
}`;

const solutionCode = `function twoSum(nums, target) {
  const seen = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  
  return [];
}`;

const testCases = [
  { id: 1, nums: "[2, 7, 11, 15]", target: "9", expected: "[0, 1]" },
  { id: 2, nums: "[3, 2, 4]", target: "6", expected: "[1, 2]" },
  { id: 3, nums: "[3, 3]", target: "6", expected: "[0, 1]" },
];

export default function App() {
  const [code, setCode] = useState(starterCode);
  const [activeProblemTab, setActiveProblemTab] = useState("Description");
  const [activeBottomTab, setActiveBottomTab] = useState("Testcase");
  const [activeCase, setActiveCase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<"passed" | "submitted" | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"problem" | "code">("problem");

  const lineCount = useMemo(() => Math.max(code.split("\n").length, 12), [code]);

  function runCode(submit = false) {
    setIsRunning(true);
    setResult(null);
    window.setTimeout(() => {
      setIsRunning(false);
      setResult(submit ? "submitted" : "passed");
      setActiveBottomTab("Result");
    }, 650);
  }

  return (
    <main className="flex h-screen min-h-[680px] flex-col overflow-hidden bg-[#080b0a] text-[#e8eeeb]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0c100e] px-4 md:px-6">
        <div className="flex items-center gap-7">
          <button className="flex items-center gap-2.5" aria-label="AlgoLab home">
            <LogoMark className="h-8 w-8 text-[#b8f34a]" />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">
              algo<span className="text-[#b8f34a]">lab</span>
            </span>
          </button>
          <div className="hidden h-5 w-px bg-white/10 md:block" />
          <button className="hidden items-center gap-2 text-sm text-[#9ca6a1] transition hover:text-white md:flex">
            <ChevronLeft />
            Problem list
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-[#aab3af] transition hover:bg-white/5 hover:text-white sm:block">
            Discuss
          </button>
          <button className="rounded-lg p-2.5 text-[#8e9994] transition hover:bg-white/5 hover:text-white" aria-label="Settings">
            <Settings className="h-[18px] w-[18px]" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-[#252d29] text-xs font-semibold text-[#cbd5d0] ring-1 ring-white/10">
            JS
          </button>
        </div>
      </header>

      <div className="flex shrink-0 border-b border-white/[0.07] bg-[#0c100e] md:hidden">
        <button
          onClick={() => setMobilePanel("problem")}
          className={`flex-1 py-3 text-sm font-medium ${mobilePanel === "problem" ? "border-b-2 border-[#b8f34a] text-white" : "text-[#77817d]"}`}
        >
          Problem
        </button>
        <button
          onClick={() => setMobilePanel("code")}
          className={`flex-1 py-3 text-sm font-medium ${mobilePanel === "code" ? "border-b-2 border-[#b8f34a] text-white" : "text-[#77817d]"}`}
        >
          Code
        </button>
      </div>

      <section className="flex min-h-0 flex-1 gap-[3px] bg-[#171c19] p-[3px]">
        <section className={`${mobilePanel === "problem" ? "flex" : "hidden"} min-w-0 flex-1 flex-col overflow-hidden bg-[#0d1210] md:flex md:basis-[46%]`}>
          <nav className="flex h-12 shrink-0 items-center gap-1 border-b border-white/[0.06] px-4">
            {["Description", "Solutions", "Submissions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveProblemTab(tab)}
                className={`relative h-full px-3 text-[13px] font-medium transition ${
                  activeProblemTab === tab ? "text-[#ecf2ef]" : "text-[#737e79] hover:text-[#b7c0bc]"
                }`}
              >
                {tab}
                {activeProblemTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[#b8f34a]" />}
              </button>
            ))}
          </nav>

          <div className="scrollbar flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-9">
            {activeProblemTab === "Description" ? (
              <div className="mx-auto max-w-[680px]">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xs font-medium text-[#65706b]">PROBLEM 01</span>
                      <span className="rounded-full bg-[#b8f34a]/10 px-2.5 py-1 text-[11px] font-semibold text-[#b8f34a] ring-1 ring-[#b8f34a]/20">
                        EASY
                      </span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#f4f7f5] sm:text-[28px]">Two Sum</h1>
                  </div>
                  <button className="rounded-lg border border-white/[0.08] p-2 text-[#77817d] transition hover:bg-white/5 hover:text-white" aria-label="Save problem">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 3.5h12a1 1 0 0 1 1 1v16l-7-4-7 4v-16a1 1 0 0 1 1-1Z" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-5 text-[14px] leading-7 text-[#b7c0bc]">
                  <p>
                    Given an array of integers <Code>nums</Code> and an integer <Code>target</Code>, return{" "}
                    <em className="text-[#e3e9e6]">indices of the two numbers</em> such that they add up to{" "}
                    <Code>target</Code>.
                  </p>
                  <p>
                    You may assume that each input would have <strong className="font-medium text-[#e3e9e6]">exactly one solution</strong>,
                    and you may not use the same element twice.
                  </p>
                  <p>You can return the answer in any order.</p>
                </div>

                <div className="mt-8 space-y-5">
                  <Example number={1} nums="[2,7,11,15]" target="9" output="[0,1]" explanation="Because nums[0] + nums[1] == 9, we return [0, 1]." />
                  <Example number={2} nums="[3,2,4]" target="6" output="[1,2]" />
                  <Example number={3} nums="[3,3]" target="6" output="[0,1]" />
                </div>

                <div className="mt-9 border-t border-white/[0.07] pt-7">
                  <h2 className="mb-4 text-sm font-semibold text-[#e7ece9]">Constraints</h2>
                  <ul className="space-y-2.5 text-[13px] text-[#a6b0ab]">
                    <li className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#65706b]" /><Code>2 ≤ nums.length ≤ 10⁴</Code></li>
                    <li className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#65706b]" /><Code>-10⁹ ≤ nums[i] ≤ 10⁹</Code></li>
                    <li className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#65706b]" /><span>Only one valid answer exists.</span></li>
                  </ul>
                </div>
              </div>
            ) : (
              <EmptyTab tab={activeProblemTab} />
            )}
          </div>

          <footer className="flex h-12 shrink-0 items-center justify-between border-t border-white/[0.06] px-5 text-xs text-[#69736e]">
            <span>Acceptance <strong className="ml-1 font-medium text-[#b8c1bd]">54.2%</strong></span>
            <div className="flex gap-4">
              <button className="transition hover:text-white">Hint</button>
              <button className="transition hover:text-white">Feedback</button>
            </div>
          </footer>
        </section>

        <section className={`${mobilePanel === "code" ? "flex" : "hidden"} min-w-0 flex-1 flex-col gap-[3px] md:flex md:basis-[54%]`}>
          <div className="flex min-h-[300px] flex-[1.35] flex-col overflow-hidden bg-[#0d1210]">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#b8f34a]" />
                <select className="cursor-pointer appearance-none bg-transparent pr-5 text-[13px] font-medium text-[#c8d0cc] outline-none">
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>TypeScript</option>
                </select>
                <span className="text-xs text-[#56605b]">Node.js 20</span>
              </div>
              <button
                onClick={() => setCode(starterCode)}
                className="text-xs text-[#77817d] transition hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 bg-[#0a0e0c] font-mono text-[13px] leading-6">
              <div className="scrollbar-hidden select-none overflow-hidden border-r border-white/[0.04] px-3 py-4 text-right text-[#36413c]">
                {Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setResult(null);
                }}
                spellCheck={false}
                aria-label="Code editor"
                className="scrollbar min-h-full flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-[#d4ddd8] caret-[#b8f34a] outline-none selection:bg-[#b8f34a]/20"
              />
            </div>
          </div>

          <div className="flex min-h-[220px] flex-1 flex-col overflow-hidden bg-[#0d1210]">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
              <div className="flex h-full gap-5">
                {["Testcase", "Result"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveBottomTab(tab)}
                    className={`relative text-[13px] font-medium ${activeBottomTab === tab ? "text-[#e7ece9]" : "text-[#6f7974]"}`}
                  >
                    {tab}
                    {tab === "Result" && result && <span className="absolute -right-2 top-3 h-1.5 w-1.5 rounded-full bg-[#b8f34a]" />}
                  </button>
                ))}
              </div>
              <button className="text-[#64706a]" aria-label="Collapse panel">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 15 6-6 6 6" /></svg>
              </button>
            </div>

            <div className="scrollbar min-h-0 flex-1 overflow-auto px-4 py-3.5">
              {activeBottomTab === "Testcase" ? (
                <>
                  <div className="mb-4 flex gap-2">
                    {testCases.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveCase(index)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          activeCase === index ? "bg-[#242c28] text-[#e4eae7]" : "text-[#6f7974] hover:bg-white/5"
                        }`}
                      >
                        Case {item.id}
                      </button>
                    ))}
                    <button className="grid h-7 w-7 place-items-center rounded-md text-lg text-[#66716b] transition hover:bg-white/5 hover:text-white">+</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TestInput label="nums" value={testCases[activeCase].nums} />
                    <TestInput label="target" value={testCases[activeCase].target} />
                  </div>
                </>
              ) : result ? (
                <div className="animate-in">
                  <div className="mb-4 flex items-center gap-2 text-[#b8f34a]">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-semibold">{result === "submitted" ? "Accepted" : "All test cases passed"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Metric label="Runtime" value="52 ms" detail="Beats 89.3%" />
                    <Metric label="Memory" value="42.1 MB" detail="Beats 76.8%" />
                    <Metric label="Tests" value="3 / 3" detail="Passed" />
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#626d67]">Run your code to see the result.</div>
              )}
            </div>

            <div className="flex h-14 shrink-0 items-center justify-between border-t border-white/[0.06] px-4">
              <div className="hidden items-center gap-1.5 text-xs text-[#65706b] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8f34a]" />
                Saved
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => runCode(false)}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-[#171d1a] px-4 py-2 text-xs font-semibold text-[#d1d8d4] transition hover:bg-[#202824] disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  {isRunning ? "Running..." : "Run"}
                </button>
                <button
                  onClick={() => runCode(true)}
                  disabled={isRunning}
                  className="rounded-lg bg-[#b8f34a] px-4 py-2 text-xs font-bold text-[#10150f] transition hover:bg-[#c6fa61] disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>

      <div className="hidden h-10 shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#0c100e] px-5 text-xs text-[#606b65] md:flex">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#b8f34a]" /> Workspace ready</span>
          <span>Daily streak: <strong className="font-medium text-[#aeb7b3]">7 days</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded p-1 hover:bg-white/5"><ChevronLeft /></button>
          <span className="text-[#89938e]">1 / 75</span>
          <button className="rounded p-1 text-[#aeb7b3] hover:bg-white/5"><ChevronRight /></button>
        </div>
      </div>
    </main>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-[#d2dad6]">{children}</code>;
}

function Example({ number, nums, target, output, explanation }: { number: number; nums: string; target: string; output: string; explanation?: string }) {
  return (
    <div>
      <h2 className="mb-2.5 text-sm font-semibold text-[#e7ece9]">Example {number}</h2>
      <div className="rounded-lg border border-white/[0.06] bg-[#090d0b] px-4 py-3 font-mono text-[12px] leading-6">
        <div><span className="text-[#68736d]">Input:</span> <span className="text-[#cbd3cf]">nums = {nums}, target = {target}</span></div>
        <div><span className="text-[#68736d]">Output:</span> <span className="text-[#b8f34a]">{output}</span></div>
        {explanation && <div className="mt-1 font-sans text-[12px] text-[#7f8a84]"><span className="text-[#aeb7b3]">Explanation:</span> {explanation}</div>}
      </div>
    </div>
  );
}

function EmptyTab({ tab }: { tab: string }) {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#171e1a] text-[#8fa078] ring-1 ring-white/[0.06]">
        <CheckCircle className="h-5 w-5" />
      </div>
      <h2 className="mb-1 text-sm font-semibold text-[#dce3df]">{tab}</h2>
      <p className="max-w-xs text-sm leading-6 text-[#66716b]">
        {tab === "Solutions" ? "Unlock community approaches after completing this challenge." : "Your accepted and attempted submissions will appear here."}
      </p>
    </div>
  );
}

function TestInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#68736d]">{label} =</span>
      <input defaultValue={value} className="w-full rounded-md border border-white/[0.07] bg-[#090d0b] px-3 py-2 font-mono text-xs text-[#cbd3cf] outline-none transition focus:border-[#b8f34a]/50" />
    </label>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#090d0b] p-3">
      <span className="block text-[10px] uppercase tracking-wider text-[#5e6963]">{label}</span>
      <strong className="mt-1 block text-sm font-semibold text-[#dce3df]">{value}</strong>
      <span className="mt-0.5 block text-[10px] text-[#7d8a83]">{detail}</span>
    </div>
  );
}
