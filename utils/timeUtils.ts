
export const MALAYSIAN_TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * Returns a new Date object representing the current time in Malaysia.
 * Note: This creates a Date object whose UTC time is shifted to match Malaysian local time.
 * Use with caution for calculations, primarily useful for getting year/month/day/hour in MYT.
 */
export const getNowMalaysian = (): Date => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: MALAYSIAN_TIMEZONE }));
};

/**
 * Formats a date or timestamp string to Malaysian time (HH:MM AM/PM)
 */
export const formatTimeMYT = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MALAYSIAN_TIMEZONE,
    hour12: true
  });
};

/**
 * Formats a date or timestamp string to Malaysian date (Weekday, Month Day, Year)
 */
export const formatDateMYT = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: MALAYSIAN_TIMEZONE
  });
};

/**
 * Formats a date to a simple date string (MM/DD/YYYY) in Malaysian time
 */
export const formatShortDateMYT = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: MALAYSIAN_TIMEZONE
  });
};

/**
 * Returns true if the two dates fall on the same day in Malaysian time
 */
export const isSameDayMYT = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const options = { timeZone: MALAYSIAN_TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric' } as const;
  return d1.toLocaleDateString('en-US', options) === d2.toLocaleDateString('en-US', options);
};

/**
 * Gets a relative date label (Today, Yesterday, or Date) in Malaysian time
 */
export const getRelativeDateLabelMYT = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Calculate yesterday in MYT
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDayMYT(date, now)) {
    return "Today";
  } else if (isSameDayMYT(date, yesterday)) {
    return "Yesterday";
  } else {
    return formatDateMYT(date);
  }
};
