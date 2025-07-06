import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface TimePeriod {
  value: string;
  label: string;
  months: number;
}

export const TIME_PERIODS: TimePeriod[] = [
  { value: '1m', label: 'Last Month', months: 1 },
  { value: '3m', label: 'Last 3 Months', months: 3 },
  { value: '6m', label: 'Last 6 Months', months: 6 },
  { value: '1y', label: 'Last Year', months: 12 },
];

interface TimePeriodSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function TimePeriodSelect({ value, onValueChange }: TimePeriodSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select time period" />
      </SelectTrigger>
      <SelectContent>
        {TIME_PERIODS.map((period) => (
          <SelectItem key={period.value} value={period.value}>
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 