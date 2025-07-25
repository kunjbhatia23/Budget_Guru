// Update file: components/ui/calendar.tsx
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DropdownProps, SelectSingleEventHandler, DayPickerSingleProps } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type CalendarProps = DayPickerSingleProps & {
  selected?: Date;
  onSelect?: SelectSingleEventHandler;

  selectedMonth?: Date;
  onMonthSelect?: (month: Date | undefined) => void;
} & Omit<React.ComponentPropsWithoutRef<typeof DayPicker>, 'mode' | 'selected' | 'onSelect'>;


function CalendarDropdown({ value, onChange, children, className }: DropdownProps) {
  const items = React.Children.toArray(children)
    .map((child) => {
      if (
        React.isValidElement(child) &&
        child.props &&
        child.props.value !== undefined
      ) {
        return (
          <SelectItem
            key={child.props.value}
            value={child.props.value.toString()}
          >
            {child.props.children}
          </SelectItem>
        );
      }
      return null;
    })
    .filter(Boolean);

  const safeValue = typeof value === 'number' ? value.toString() : '';

  return (
    <Select
      value={safeValue}
      onValueChange={(newValueString) => {
        const syntheticEvent = {
          target: { value: newValueString },
          currentTarget: { value: newValueString },
        } as React.ChangeEvent<HTMLSelectElement>;

        if (typeof onChange === 'function') {
          try {
            (onChange as any)(syntheticEvent);
          } catch (error) {
            console.error('Error in onChange callback with synthetic event:', error);
          }
        } else {
          console.warn('CalendarDropdown received invalid onChange function.');
        }
      }}
    >
      <SelectTrigger className={cn('h-8 min-w-[70px] px-2', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{items}</SelectContent>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  mode = "single",
  selected,
  onSelect,
  showOutsideDays = false,
  selectedMonth,
  onMonthSelect,
  ...props
}: CalendarProps) {

  const handleDaySelect: SelectSingleEventHandler = (day, _selectedDays, _activeModifiers, _e) => {
    if (onMonthSelect && day) {
      const firstDayOfMonth = new Date(day.getFullYear(), day.getMonth(), 1);
      onMonthSelect(firstDayOfMonth);
    }
    if (onSelect) {
      onSelect(day, _selectedDays, _activeModifiers, _e);
    }
  };

  return (
    <DayPicker
      className={cn('p-3', className)}
      month={selectedMonth}
      onMonthChange={onMonthSelect}
      mode={mode}
      selected={selectedMonth}
      onSelect={handleDaySelect}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        Dropdown: CalendarDropdown,
        Day: () => null,
      }}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'hidden',
        row: 'hidden',
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };