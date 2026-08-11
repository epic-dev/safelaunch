export const LoadingDots = () => (
  <span className="inline-flex items-center">
    Loading
    <span className="inline-flex ml-0.5">
      <span className="animate-[loading-dot_1.2s_infinite]">.</span>
      <span className="animate-[loading-dot_1.2s_infinite] [animation-delay:0.2s]">.</span>
      <span className="animate-[loading-dot_1.2s_infinite] [animation-delay:0.4s]">.</span>
    </span>
  </span>
);