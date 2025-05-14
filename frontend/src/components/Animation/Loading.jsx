function LoadingImage() {
  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        {" "}
        <div className="flex items-center space-x-2">
          {["L", "o", "a", "d", "i", "n", "g", ".", ".", "."].map(
            (char, index) => (
              <span
                key={index}
                className="inline-block animate-loading-bounce text-4xl font-bold"
                style={{
                  animationDelay: `${index * 0.07}s`,
                }}
              >
                {char}
              </span>
            )
          )}
        </div>
      </div>
    </>
  );
}

export default LoadingImage;
