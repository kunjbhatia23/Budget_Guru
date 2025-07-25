'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthYearPickerProps {
  date: Date;
  onChange: (newDate: Date) => void;
}

export function MonthYearPicker({ date, onChange }: MonthYearPickerProps) {
  const [year, setYear] = React.useState(date.getFullYear());
  const [isYearPicker, setIsYearPicker] = React.useState(false);

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(year, monthIndex, 1);
    onChange(newDate);
  };

  const handleYearChange = (yearValue: number) => {
    setYear(yearValue);
    setIsYearPicker(false);
  };

  const renderYearPicker = () => (
    <div className="grid grid-cols-3 gap-2 p-2">
      {Array.from({ length: 12 }, (_, i) => year - 6 + i).map((y) => (
        <Button
          key={y}
          variant="ghost"
          className={cn(
            'text-center w-full',
            y === date.getFullYear() && 'bg-primary text-primary-foreground'
          )}
          onClick={() => handleYearChange(y)}
        >
          {y}
        </Button>
      ))}
    </div>
  );

  const renderMonthPicker = () => (
    <div className="grid grid-cols-3 gap-2 p-2">
      {months.map((month, index) => (
        <Button
          key={month}
          variant="ghost"
          className={cn(
            'text-center w-full',
            index === date.getMonth() && year === date.getFullYear() && 'bg-primary text-primary-foreground'
          )}
          onClick={() => handleMonthClick(index)}
        >
          {month.substring(0, 3)}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-2 border-b">
        <Button variant="ghost" size="icon" onClick={() => setYear(year - (isYearPicker ? 12 : 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" onClick={() => setIsYearPicker(!isYearPicker)}>
          {isYearPicker ? `Select Year` : year}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setYear(year + (isYearPicker ? 12 : 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      {isYearPicker ? renderYearPicker() : renderMonthPicker()}
    </div>
  );
}