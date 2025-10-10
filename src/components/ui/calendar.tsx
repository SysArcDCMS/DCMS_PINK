"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      formatters={{
        formatWeekdayName: (weekday, options) => {
          // Use simple abbreviation for weekday names - ensure proper alignment
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayIndex = weekday.getDay(); // 0 = Sunday, 1 = Monday, etc.
          return dayNames[dayIndex];
        },
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "space-y-4",
        caption: "relative w-full pt-1 text-center",
        caption_label: "text-sm font-medium",
        nav: "absolute top-1 left-0 right-0",
        nav_button: "h-7 w-7 bg-transparent border-0 p-0 opacity-70 hover:opacity-100 cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
        nav_button_previous: "absolute left-0 top-0",
        nav_button_next: "absolute right-0 top-0",
        table: "w-full border-collapse",
        head_row: "", // let it default to table-row
        head_cell:
          "text-muted-foreground font-normal text-[0.8rem] text-center w-9", // equal width for each day
        row: "", // keep default table-row
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer text-center items-center justify-center",
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:rounded-l-md",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:rounded-r-md",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}

      {...props}
    />
  );
}

export { Calendar };
