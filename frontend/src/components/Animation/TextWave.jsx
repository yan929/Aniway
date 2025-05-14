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
          <style jsx>{`
            @keyframes waveOnce {
              0% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-15px);
              }
              100% {
                transform: translateY(0);
              }
            }
          `}</style>
        </span>
      ))}
    </div>
  );
}

export default WaveText;
