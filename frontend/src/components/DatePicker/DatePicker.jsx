import React, { useState, useEffect, useRef } from "react";
import { FaCalendarAlt } from "react-icons/fa";

/**
 * DatePicker component - Allows users to select a date range
 * Styled to match the design examples
 * @param {Object} props - Component props
 * @param {Object} props.selectedDates - Currently selected dates { startDate: Date, endDate: Date }
 * @param {Function} props.onDateSelect - Callback when dates are selected
 * @param {string} props.mainDisplayTextColor - Color for the main display text
 */
function DatePicker({
  selectedDates,
  onDateSelect,
  mainDisplayTextColor = "text-gray-700",
}) {
  // Helper function to format date as MM/DD
  const getFormattedDate = (date) => {
    if (!date) return null; // Handle null or undefined dates
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}/${day}`;
  };

  // Set up initial selected dates - use props if provided, otherwise use default
  const [showCalendar, setShowCalendar] = useState(false);
  // Initialize localSelectedDates with Date objects
  const [localSelectedDates, setLocalSelectedDates] = useState(() => {
    if (selectedDates && selectedDates.startDate) {
      return {
        startDate: selectedDates.startDate
          ? new Date(selectedDates.startDate.setHours(0, 0, 0, 0))
          : null,
        endDate: selectedDates.endDate
          ? new Date(selectedDates.endDate.setHours(0, 0, 0, 0))
          : null,
      };
    }
    return { startDate: null, endDate: null }; // Default to null Date objects
  });
  const [hoveredDate, setHoveredDate] = useState(null); // Will store a Date object or null
  const datePickerRef = useRef(null);

  // Current date information
  const currentDate = new Date();
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  // Effect to sync props with local state (using Date objects)
  useEffect(() => {
    setLocalSelectedDates((prevLocalDates) => {
      const newPropStart = selectedDates?.startDate
        ? new Date(new Date(selectedDates.startDate).setHours(0, 0, 0, 0))
        : null;
      const newPropEnd = selectedDates?.endDate
        ? new Date(new Date(selectedDates.endDate).setHours(0, 0, 0, 0))
        : null;

      const prevStartMs = prevLocalDates.startDate?.getTime();
      const prevEndMs = prevLocalDates.endDate?.getTime();
      const newPropStartMs = newPropStart?.getTime();
      const newPropEndMs = newPropEnd?.getTime();

      if (prevStartMs !== newPropStartMs || prevEndMs !== newPropEndMs) {
        return { startDate: newPropStart, endDate: newPropEnd };
      }
      return prevLocalDates; // No change needed
    });
  }, [selectedDates]); // Rerun when selectedDates prop changes

  // Month names array
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Helper functions for calendar generation
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays(displayYear, displayMonth);

  // Navigation functions
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  // Date selection handler
  const handleDateSelect = (day) => {
    const newDate = new Date(displayYear, displayMonth, day);
    newDate.setHours(0, 0, 0, 0);

    // Handle date range selection
    if (
      !localSelectedDates.startDate ||
      (localSelectedDates.startDate && localSelectedDates.endDate)
    ) {
      const updatedDates = { startDate: newDate, endDate: null };
      setLocalSelectedDates(updatedDates);
      if (onDateSelect) onDateSelect(updatedDates);
    } else {
      // Compare dates to ensure end date is after start date
      if (newDate >= localSelectedDates.startDate) {
        const updatedDates = { ...localSelectedDates, endDate: newDate };
        setLocalSelectedDates(updatedDates);
        if (onDateSelect) onDateSelect(updatedDates);
        setShowCalendar(false);
      } else {
        // If selected date is before start date, reset and make it new start date
        const updatedDates = { startDate: newDate, endDate: null };
        setLocalSelectedDates(updatedDates);
        if (onDateSelect) onDateSelect(updatedDates);
      }
    }
  };

  // Format display date
  const formatDisplayDate = () => {
    if (localSelectedDates.startDate && localSelectedDates.endDate) {
      return `${getFormattedDate(
        localSelectedDates.startDate
      )} - ${getFormattedDate(localSelectedDates.endDate)}`;
    } else if (localSelectedDates.startDate) {
      return getFormattedDate(localSelectedDates.startDate);
    }
    return "Select dates";
  };

  // Handle clicks outside of date picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  // Update local state when props change
  useEffect(() => {
    if (selectedDates) {
      setLocalSelectedDates(selectedDates);
    }
  }, [selectedDates]);

  // Check if a date is within the selection range
  const isInRange = (day) => {
    if (!localSelectedDates.startDate || !day) return false;

    const newDate = new Date(displayYear, displayMonth, day);
    newDate.setHours(0, 0, 0, 0);

    if (localSelectedDates.startDate && localSelectedDates.endDate) {
      return isDateBetween(
        newDate,
        localSelectedDates.startDate,
        localSelectedDates.endDate
      );
    } else if (localSelectedDates.startDate && hoveredDate) {
      return isDateBetween(newDate, localSelectedDates.startDate, hoveredDate);
    }
    return false;
  };

  // Helper function to check if a date is between two dates
  const isDateBetween = (date, start, end) => {
    return date >= start && date <= end;
  };

  // Handle mouse enter on a date
  const handleMouseEnter = (day) => {
    if (!localSelectedDates.startDate || localSelectedDates.endDate) return;

    const newDate = new Date(displayYear, displayMonth, day);
    newDate.setHours(0, 0, 0, 0);
    setHoveredDate(newDate);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  return (
    <div className="relative h-full" ref={datePickerRef}>
      <div
        className="flex items-center h-12 px-4 cursor-pointer"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <FaCalendarAlt className={`${mainDisplayTextColor} mr-3 text-lg`} />
        <span className={`${mainDisplayTextColor} text-base`}>
          {formatDisplayDate()}
        </span>
      </div>

      {/* Date Picker Popup - Single Month View */}
      {showCalendar && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 w-64">
          <div className="flex justify-between items-center px-4 py-2 border-b dark:bg-gray-800 dark:border-gray-700">
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-100"
              onClick={goToPreviousMonth}
              type="button"
            >
              &larr;
            </button>
            <div className="text-center">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {monthNames[displayMonth]} {displayYear}
              </span>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-100"
              onClick={goToNextMonth}
              type="button"
            >
              &rarr;
            </button>
          </div>

          <div className="p-2 dark:bg-gray-800">
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1 dark:text-gray-200 dark:hover:text-gray-100">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-gray-500 dark:text-gray-200 dark:hover:text-gray-100"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center dark:text-gray-200 dark:hover:text-gray-100">
              {calendarDays.map((day, index) => {
                const isStartDate =
                  localSelectedDates.startDate &&
                  localSelectedDates.startDate.getTime() ===
                    new Date(displayYear, displayMonth, day).getTime();
                const isEndDate =
                  localSelectedDates.endDate &&
                  localSelectedDates.endDate.getTime() ===
                    new Date(displayYear, displayMonth, day).getTime();
                const isInRangeDay = isInRange(day);

                return (
                  <div
                    key={index}
                    className={`w-8 h-8 flex items-center justify-center text-sm relative dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${
                      day ? "cursor-pointer" : ""
                    } ${
                      isStartDate || isEndDate
                        ? "bg-green-500 text-white dark:bg-green-800 dark:text-white"
                        : isInRangeDay
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                        : day
                        ? "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        : ""
                    }`}
                    onClick={() => day && handleDateSelect(day)}
                    onMouseEnter={() => day && handleMouseEnter(day)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
