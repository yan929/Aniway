import React, { useState, useEffect, useRef } from "react";
import { FaCalendarAlt } from "react-icons/fa";

/**
 * DatePicker component - Allows users to select a date range
 * Styled to match the design examples
 * @param {Object} props - Component props
 * @param {Object} props.selectedDates - Currently selected dates { start, end }
 * @param {Function} props.onDateSelect - Callback when dates are selected
 */
function DatePicker({ selectedDates, onDateSelect }) {
  // Helper function to format date as MM/DD
  const getFormattedDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  };

  // Get default date range (today to 3 days later)
  const getDefaultDateRange = () => {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    
    return {
      start: getFormattedDate(today),
      end: getFormattedDate(threeDaysLater)
    };
  };

  // Set up initial selected dates - use props if provided, otherwise use default
  const [showCalendar, setShowCalendar] = useState(false);
  const [localSelectedDates, setLocalSelectedDates] = useState(
    selectedDates || getDefaultDateRange()
  );
  const [hoveredDate, setHoveredDate] = useState(null);
  const datePickerRef = useRef(null);
  
  // Current date information
  const currentDate = new Date();
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  // Month names array
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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

  // Format date as MM/DD
  const formatDate = (date) => {
    if (!date) return '';
    const parts = date.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : date;
  };

  // Date selection handler
  const handleDateSelect = (day) => {
    const month = displayMonth + 1; // JavaScript months are 0-based
    
    // Format with leading zeros
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    
    const newDate = `${formattedMonth}/${formattedDay}`;
    
    // Handle date range selection
    if (!localSelectedDates.start || (localSelectedDates.start && localSelectedDates.end)) {
      const updatedDates = { start: newDate, end: null };
      setLocalSelectedDates(updatedDates);
      if (onDateSelect) onDateSelect(updatedDates);
    } else {
      // Compare dates to ensure end date is after start date
      const startParts = localSelectedDates.start.split('/');
      const newParts = newDate.split('/');
      
      const startMonth = parseInt(startParts[0]);
      const startDay = parseInt(startParts[1]);
      const newMonth = parseInt(newParts[0]);
      const newDay = parseInt(newParts[1]);
      
      if (newMonth > startMonth || (newMonth === startMonth && newDay >= startDay)) {
        const updatedDates = { ...localSelectedDates, end: newDate };
        setLocalSelectedDates(updatedDates);
        if (onDateSelect) onDateSelect(updatedDates);
        setShowCalendar(false);
      } else {
        // If selected date is before start date, reset and make it new start date
        const updatedDates = { start: newDate, end: null };
        setLocalSelectedDates(updatedDates);
        if (onDateSelect) onDateSelect(updatedDates);
      }
    }
  };

  // Format display date
  const formatDisplayDate = () => {
    if (localSelectedDates.start && localSelectedDates.end) {
      return `${formatDate(localSelectedDates.start)} - ${formatDate(localSelectedDates.end)}`;
    } else if (localSelectedDates.start) {
      return formatDate(localSelectedDates.start);
    }
    return "Select dates";
  };

  // Handle clicks outside of date picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
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
    if (!localSelectedDates.start || !day) return false;
    
    const currentMonth = displayMonth + 1;
    const currentDate = `${currentMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    
    if (localSelectedDates.start && localSelectedDates.end) {
      return isDateBetween(currentDate, localSelectedDates.start, localSelectedDates.end);
    } else if (localSelectedDates.start && hoveredDate) {
      return isDateBetween(currentDate, localSelectedDates.start, hoveredDate);
    }
    return false;
  };

  // Helper function to check if a date is between two dates
  const isDateBetween = (date, start, end) => {
    const [dateMonth, dateDay] = date.split('/').map(Number);
    const [startMonth, startDay] = start.split('/').map(Number);
    const [endMonth, endDay] = end.split('/').map(Number);
    
    const dateValue = dateMonth * 100 + dateDay;
    const startValue = startMonth * 100 + startDay;
    let endValue = endMonth * 100 + endDay;
    
    // Ensure start is before end
    if (startValue > endValue) {
      return dateValue <= startValue && dateValue >= endValue;
    }
    return dateValue >= startValue && dateValue <= endValue;
  };

  // Handle mouse enter on a date
  const handleMouseEnter = (day) => {
    if (!localSelectedDates.start || localSelectedDates.end) return;
    
    const month = displayMonth + 1;
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    setHoveredDate(`${formattedMonth}/${formattedDay}`);
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
        <FaCalendarAlt className="text-gray-600 mr-3 text-lg" />
        <span className="text-gray-700 text-base">{formatDisplayDate()}</span>
      </div>
      
      {/* Date Picker Popup - Single Month View */}
      {showCalendar && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 w-64">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={goToPreviousMonth}
              type="button"
            >
              &larr;
            </button>
            <div className="text-center">
              <span className="font-medium">{monthNames[displayMonth]} {displayYear}</span>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={goToNextMonth}
              type="button"
            >
              &rarr;
            </button>
          </div>
          
          <div className="p-2">
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-gray-500">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, index) => {
                const isStartDate = localSelectedDates.start && 
                  localSelectedDates.start === `${(displayMonth + 1).toString().padStart(2, '0')}/${day?.toString().padStart(2, '0')}`;
                const isEndDate = localSelectedDates.end && 
                  localSelectedDates.end === `${(displayMonth + 1).toString().padStart(2, '0')}/${day?.toString().padStart(2, '0')}`;
                const isInRangeDay = isInRange(day);
                
                return (
                  <div 
                    key={index}
                    className={`w-8 h-8 flex items-center justify-center text-sm relative ${
                      day ? "cursor-pointer" : ""
                    } ${
                      isStartDate || isEndDate
                        ? "bg-green-500 text-white"
                        : isInRangeDay
                          ? "bg-green-100 text-green-800"
                          : day 
                            ? "hover:bg-gray-100"
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