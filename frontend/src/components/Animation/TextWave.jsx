function WaveText({ text, className = "" }) {
  return (
    <div className={className}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block"
          style={{
            animation: "waveOnce 1s ease-in-out forwards",
            animationDelay: `${index * 0.1}s`,
            animationIterationCount: "1", // 只執行一次
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

export default WaveText;
