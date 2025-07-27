'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DayOfMonthPickerProps {
  value: number;
  onChange: (day: number) => void;
  className?: string;
}

export function DayOfMonthPicker({ value, onChange, className }: DayOfMonthPickerProps) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleDayClick = (day: number) => {
    onChange(day);
  };

  return (
    <div className={cn("p-2", className)}>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <Button
            key={day}
            variant={value === day ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-full text-xs"
            onClick={() => handleDayClick(day)}
          >
            {day}
          </Button>
        ))}
      </div>
      <Button
        variant={value === 32 ? 'secondary' : 'ghost'}
        className="w-full mt-2 text-xs h-8"
        onClick={() => handleDayClick(32)}
      >
        Last Day of Month
      </Button>
    </div>
  );
}