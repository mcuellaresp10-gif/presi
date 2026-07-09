export function CampusEnvironment({ minimal = false }: { minimal?: boolean }) {
  if (minimal) {
    return (
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.35)" }}
        aria-hidden
      />
    );
  }

  return (
    <>
      {/* Grass patches */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <ellipse cx="20" cy="70" rx="14" ry="8" fill="#3d6b4f" opacity="0.4" />
        <ellipse cx="85" cy="25" rx="12" ry="7" fill="#3d6b4f" opacity="0.35" />
        <ellipse cx="50" cy="85" rx="18" ry="6" fill="#2d5a3d" opacity="0.3" />
        <path
          d="M10 62 Q25 58 40 62 T70 60 T95 62"
          fill="none"
          stroke="#8b7355"
          strokeWidth="2"
          opacity="0.25"
        />
      </svg>

      {/* Trees */}
      {[
        { x: "8%", y: "42%" },
        { x: "92%", y: "48%" },
        { x: "48%", y: "88%" },
        { x: "22%", y: "18%" },
      ].map((tree, i) => (
        <svg
          key={i}
          className="pointer-events-none absolute opacity-70"
          style={{ left: tree.x, top: tree.y, transform: "translate(-50%, -50%)" }}
          width="20"
          height="28"
          viewBox="0 0 20 28"
          aria-hidden
        >
          <rect x="8" y="18" width="4" height="10" fill="#5c4033" />
          <circle cx="10" cy="12" r="9" fill="#2d6a4f" />
          <circle cx="10" cy="10" r="6" fill="#40916c" />
        </svg>
      ))}

      {/* Moving cars on main road */}
      <div
        className="pointer-events-none absolute left-0 right-0 opacity-60"
        style={{ top: "54%" }}
        aria-hidden
      >
        <div className="campus-car campus-car-a absolute h-1 w-3 rounded-sm bg-red-400" />
        <div className="campus-car campus-car-b absolute h-1 w-3 rounded-sm bg-cyan-400" />
        <div className="campus-car campus-car-c absolute h-1 w-2 rounded-sm bg-amber-300" />
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
        }}
        aria-hidden
      />
    </>
  );
}
