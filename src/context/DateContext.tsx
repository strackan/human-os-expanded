"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface DateContextType {
  overrideDate: Date | null;
  setOverrideDate: (date: Date | null) => void;
  currentDate: Date;
  isDateOverridden: boolean;
  clearOverride: () => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const useDateContext = () => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
};

export const DateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchParams = useSearchParams();
  const [overrideDate, setOverrideDate] = useState<Date | null>(null);

  // Parse date from URL parameter on mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        // Parse date in format YYYYMMDD
        const year = parseInt(dateParam.substring(0, 4));
        const month = parseInt(dateParam.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(dateParam.substring(6, 8));
        
        const parsedDate = new Date(year, month, day);
        
        // Validate the date
        if (!isNaN(parsedDate.getTime())) {
          setOverrideDate(parsedDate);
          console.log('Date override set from URL:', parsedDate.toISOString().split('T')[0]);
        } else {
          console.warn('Invalid date parameter:', dateParam);
        }
      } catch (error) {
        console.warn('Error parsing date parameter:', dateParam, error);
      }
    }
  }, [searchParams]);

  const currentDate = overrideDate || new Date();
  const isDateOverridden = overrideDate !== null;

  const clearOverride = () => {
    setOverrideDate(null);
  };

  const value: DateContextType = {
    overrideDate,
    setOverrideDate,
    currentDate,
    isDateOverridden,
    clearOverride,
  };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
}; 