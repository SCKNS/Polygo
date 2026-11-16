export function WordMark() {
  return (
    <div className="wordmark" aria-label="Polygo">
      <span className="wordmark-text" aria-hidden="true">
        Polygo
      </span>
      <svg
        className="wordmark-doodle"
        viewBox="0 0 38 42"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m19 3 15 9v18l-15 9L4 30V12Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="m19 21 15-9-15-9Z" fill="var(--accent)" />
        <path
          d="m4 12 15 9 15-9M19 3v36M4 30l15-9 15 9"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
    </div>
  );
}
