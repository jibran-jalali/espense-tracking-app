import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'

type Calendar5Props = {
  selectedDateRange?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  min?: number
}

export function Calendar5({ selectedDateRange, onSelect, min = 1 }: Calendar5Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
      <DayPicker
        mode="range"
        defaultMonth={selectedDateRange?.from || new Date()}
        selected={selectedDateRange}
        onSelect={onSelect}
        numberOfMonths={1}
        min={min}
        className="!m-0 !border-0 !bg-transparent transition-all !ring-0 !ring-offset-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 [&_*]:!ring-0 [&_*]:!ring-offset-0 [&_*]:focus:!ring-0 [&_*]:focus-visible:!ring-0"
        classNames={{
          month_caption: 'flex h-9 items-center justify-center text-sm font-bold text-black',
          nav: 'absolute left-0 right-0 top-3 flex items-center justify-between px-5',
          button_previous: 'rounded-full p-1.5 text-black hover:bg-black hover:text-white transition-colors',
          button_next: 'rounded-full p-1.5 text-black hover:bg-black hover:text-white transition-colors',
          weekdays: 'grid grid-cols-7 text-xs font-semibold text-black/40',
          weekday: 'py-2 text-center',
          week: 'grid grid-cols-7 gap-1',
          day: 'flex size-9 items-center justify-center rounded-full text-sm text-black',
          day_button: 'size-9 rounded-full text-sm font-medium transition-colors hover:bg-black hover:text-white !ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0',
          today: '!bg-transparent font-bold',
          selected: 'bg-black text-white rounded-full',
          range_start: 'bg-black text-white rounded-full',
          range_end: 'bg-black text-white rounded-full',
          range_middle: 'bg-black/10 text-black rounded-full',
          outside: 'text-black/20',
          disabled: 'text-black/20 line-through',
        }}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground" role="region">
        Select a date range to filter spending
      </p>
    </div>
  )
}

export type { DateRange }
export default Calendar5
