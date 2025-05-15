function NaviagteButton({ text, IconBeforeHover, IconAfterHover, onClick }) {
  return (
    <button
      onClick={onClick}
      className="right-6 
          bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl 
          text-white px-5 py-3 rounded-full shadow-xl 
          transition-all duration-300 ease-in-out hover:scale-105 
          focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 
          z-50 group"
    >
      <span className="flex items-center gap-2 justify-center">
        <span className="relative w-5 h-5">
          {IconBeforeHover && (
            <IconBeforeHover className="absolute inset-0 group-hover:opacity-0 transition-opacity duration-200" />
          )}
          {IconAfterHover && (
            <IconAfterHover className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          )}
          
        </span>

        <span className="font-semibold text-base">{text}</span>
      </span>
    </button>
  );
}

export default NaviagteButton;
