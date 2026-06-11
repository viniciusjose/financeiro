export function GradientMesh() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[33vh] overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute -left-[8%] top-[-10%] h-[70%] w-[45%] rounded-full bg-canvas-cream opacity-90 blur-[72px]" />
      <div className="absolute left-[18%] top-[-5%] h-[55%] w-[32%] rounded-full bg-lemon/40 opacity-70 blur-[64px]" />
      <div className="absolute left-[42%] top-[0%] h-[60%] w-[28%] rounded-full bg-primary-subdued/60 opacity-80 blur-[72px]" />
      <div className="absolute right-[18%] top-[-8%] h-[65%] w-[30%] rounded-full bg-primary/30 opacity-70 blur-[80px]" />
      <div className="absolute -right-[5%] top-[5%] h-[50%] w-[28%] rounded-full bg-ruby/25 opacity-60 blur-[64px]" />
      <div className="absolute right-[35%] top-[15%] h-[40%] w-[22%] rounded-full bg-magenta/20 opacity-50 blur-[56px]" />
    </div>
  );
}
