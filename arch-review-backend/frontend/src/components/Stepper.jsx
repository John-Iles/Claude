const STAGES = ["Research", "Intake", "Platform", "Ecosystem", "Report"];

export default function Stepper({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STAGES.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                  ${done ? "bg-indigo-600 border-indigo-600 text-white" : ""}
                  ${active ? "bg-white border-indigo-600 text-indigo-600" : ""}
                  ${!done && !active ? "bg-white border-slate-300 text-slate-400" : ""}
                `}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${active ? "text-indigo-600" : done ? "text-slate-600" : "text-slate-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-12 mx-1 mb-4 transition-colors ${done ? "bg-indigo-600" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
