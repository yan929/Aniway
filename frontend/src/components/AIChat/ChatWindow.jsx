import { useState, useEffect, useRef, Fragment, useContext } from "react";
import { LuSendHorizontal } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { FaRobot, FaUserCircle, FaCheck } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { AppContext } from "../../context/AppContext.jsx";

export default function ChatWindow({ onClose, onApplySuggestion }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      id: "initial-ai",
      sender: "ai",
      text: "Hi, What can I do for you? You can ask me to arrange the whole trip for you.",
      suggestionData: null,
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false); // Track if AI response is currently streaming

  const messagesEndRef = useRef(null);
  const currentStreamIdRef = useRef(null); // Ref to track the ID of the message being streamed into

  const { user } = useContext(AppContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll only when new messages are added, not on initial render
    // Check if chatHistory has more than the initial AI message
    if (chatHistory.length > 1) {
      // Modify the condition here
      scrollToBottom();
    }
  }, [chatHistory]); // <--- Keep chatHistory as dependency

  // --- Function to handle the stream from the backend ---
  const processStream = async (userMessageText) => {
    setIsStreaming(true);
    currentStreamIdRef.current = null; // Reset stream ID for new message

    // Start fetching the stream from the backend using fetch with POST
    try {
      const response = await fetch("/api/ai/augment-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          userMessageText,
          chatHistory: chatHistory,
        }),
      });

      if (!response.ok) {
        console.error("Failed to fetch stream:", response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageContent = "";
      let aiMessageId = null;
      let buffer = ""; // Buffer to handle potential multi-line data chunks
      let expectingSuggestionData = false; // Flag to track suggestion event

      const processBuffer = () => {
        // Process complete data lines (separated by \n\n)
        while (true) {
          const newlineIndex = buffer.indexOf("\n\n");
          if (newlineIndex === -1) break; // No complete data line found

          // Extract the block before \n\n
          const block = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 2); // Remove processed block + \n\n
          // Process the block (could contain event and data lines)
          const lines = block.split("\n");
          lines.forEach((line) => {
            if (line.startsWith("event: suggestion")) {
              expectingSuggestionData = true;
            } else if (line.startsWith("data: ")) {
              const jsonData = line.substring(6);
              if (jsonData === "[DONE]") {
                setIsStreaming(false);
                expectingSuggestionData = false; // Reset flag on DONE
                // No return needed here, let loop finish processing buffer
              } else if (expectingSuggestionData) {
                // This data line contains the suggestions
                try {
                  const suggestions = JSON.parse(jsonData);
                  if (aiMessageId) {
                    // Ensure we have an ID to attach to
                    setChatHistory((prev) => {
                      const msgIndex = prev.findIndex(
                        (m) => m.id === aiMessageId
                      );
                      if (msgIndex !== -1) {
                        const updatedHistory = [...prev];
                        updatedHistory[msgIndex] = {
                          ...updatedHistory[msgIndex],
                          suggestionData: suggestions, // Attach suggestions
                        };
                        return updatedHistory;
                      } else {
                        console.warn(
                          `Could not find message ID ${aiMessageId} to attach suggestions.`
                        );
                        return prev; // Don't modify if ID not found
                      }
                    });
                  } else {
                    console.warn(
                      "Received suggestion data but no AI Message ID was set."
                    );
                  }
                } catch (e) {
                  console.error(
                    "Error parsing suggestion JSON:",
                    e,
                    "Data:",
                    jsonData
                  );
                }
                expectingSuggestionData = false; // Reset flag after processing data
              } else {
                // This data line contains normal message content
                try {
                  const parsedData = JSON.parse(jsonData);
                  const chunkText = parsedData.text || "";
                  const chunkId = parsedData.id || null;

                  // Set the AI message ID from the first chunk that provides it
                  if (chunkId && !aiMessageId) {
                    aiMessageId = chunkId;
                    currentStreamIdRef.current = aiMessageId; // Track the current stream ID
                    // Add the initial AI message placeholder with ID
                    setChatHistory((prev) => [
                      ...prev,
                      {
                        id: aiMessageId,
                        sender: "ai",
                        text: "",
                        suggestionData: null,
                      },
                    ]);
                  }

                  if (chunkText) {
                    aiMessageContent += chunkText;
                    // Update the message text
                    setChatHistory((prev) => {
                      const msgIndex = prev.findIndex(
                        (m) => m.id === aiMessageId
                      );
                      if (msgIndex !== -1) {
                        const updatedHistory = [...prev];
                        updatedHistory[msgIndex] = {
                          ...updatedHistory[msgIndex],
                          text: aiMessageContent,
                        };
                        return updatedHistory;
                      } else {
                        // This might happen if the first chunk didn't establish the message
                        console.warn(
                          "Attempted to update text but message ID not found:",
                          aiMessageId
                        );
                        return prev;
                      }
                    });
                  }
                } catch (e) {
                  console.error(
                    "Error parsing main stream data chunk:",
                    e,
                    "Raw data line:",
                    line
                  );
                }
              }
            } else if (line.trim() !== "") {
              console.warn("Received unexpected line format:", line);
            }
          }); // End forEach line in block
        } // End while loop for buffer processing
      }; // End processBuffer function

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          processBuffer();
          setIsStreaming(false);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }
    } catch (error) {
      console.error("Error during fetch stream processing:", error);
      setIsStreaming(false);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "ai",
          text: `Sorry, I encountered an error: ${error.message}`,
          suggestionData: null,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Handler for sending a message
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isStreaming) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage = {
      id: userMessageId,
      sender: "user",
      text: trimmedMessage,
      suggestionData: null,
    };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setMessage("");

    processStream(trimmedMessage);
  };

  // Handle sending message on Enter key press
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Handler for the "Apply Suggestion" button
  const handleApplyClick = (suggestionData) => {

    // Save the entire suggestion to localStorage
    try {
      localStorage.setItem("tripData", JSON.stringify(suggestionData));

    } catch (e) {
      console.error("Failed to save suggestion data to localStorage:", e);
    }

    // Always call the parent callback with the full data received
    if (onApplySuggestion) {
      // It's now the parent component's responsibility to parse suggestionData
      onApplySuggestion(suggestionData);
    } else {
      console.warn(
        "onApplySuggestion callback not provided to ChatWindow. State update might not occur."
      );
    }

    // Provide feedback in chat
    setChatHistory((prev) => [
      ...prev,
      {
        id: `apply-${Date.now()}`,
        sender: "ai",
        text: "You've applied the suggestion.",
        suggestionData: null,
      },
    ]);

    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-r-lg  w-full h-full flex flex-col">
      <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 rounded-tr-lg shrink-0">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors mr-3 p-1 rounded-full hover:bg-gray-200"
          aria-label="Close chat"
        >
          <IoClose size={24} />
        </button>
        <div className="flex items-center dark:text-white">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Smart Assistant
          </h2>
        </div>
      </div>

      {/* Chat history area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-100 dark:bg-gray-800">
        {chatHistory.map((msg) => {
          return (
            <Fragment key={msg.id}>
              <div
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start max-w-[80%] ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                      msg.sender === "user"
                        ? "bg-blue-500 ml-2"
                        : "bg-orange-500 mr-2"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      user && user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="User"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle size={18} />
                      )
                    ) : (
                      <FaRobot size={18} />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg inline-block text-left text-sm whitespace-pre-wrap prose prose-sm max-w-none ${
                      msg.sender === "user"
                        ? "bg-blue-100 text-gray-800 rounded-br-none dark:bg-blue-800 dark:text-white"
                        : "bg-white text-gray-800 rounded-bl-none dark:bg-gray-800 dark:text-white"
                    }`}
                  >
                    <div className="chat-message-content">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {isStreaming && currentStreamIdRef.current === msg.id && (
                        <span className="inline-block w-2 h-4 bg-gray-700 animate-pulse ml-1"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Suggestion button for AI messages */}
              {msg.sender === "ai" && msg.suggestionData && (
                <div className="flex justify-center mt-2 mb-2">
                  <button
                    onClick={() => handleApplyClick(msg.suggestionData)}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 shadow-sm flex items-center"
                  >
                    <FaCheck size={18} className="mr-2" /> Apply the suggestion
                  </button>
                </div>
              )}
            </Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800 rounded-br-lg shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask for an itinerary or other travel help..."
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-transparent text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isStreaming}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isStreaming}
            className={`bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 shadow-sm flex items-center justify-center shrink-0 ${
              !message.trim() || isStreaming
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            aria-label="Send message"
          >
            <LuSendHorizontal size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI suggestions are a starting point. Always review them and be
          prepared to manually adjust your travel plans.
        </p>
      </div>
    </div>
  );
}
