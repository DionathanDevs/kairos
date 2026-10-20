import { DateRangeService } from '../../domain/services/DateRangeService.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';
import type { HabitWithWeekLogsDTO, DayStatusDTO } from '../dtos/HabitDTOs.js';

export class GetHabitsWithWeekUseCase {
  constructor(
    private habitRepo: IHabitRepository,
    private habitLogRepo: IHabitLogRepository
  ) {}

  public execute(referenceDate: Date = new Date()): {
    habits: HabitWithWeekLogsDTO[];
    weekDays: { name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[];
  } {
    const weekDays = DateRangeService.getCurrentWeekDates(referenceDate);
    const habits = this.habitRepo.findAll();

    if (habits.length === 0) {
      return { habits: [], weekDays };
    }

    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;

    // Fetch all logs for the week in a single query when supported
    let logsByHabit: Map<string, Map<string, boolean>> | null = null;
    if (this.habitLogRepo.findAllByDateRange) {
      logsByHabit = new Map<string, Map<string, boolean>>();
      const allWeekLogs = this.habitLogRepo.findAllByDateRange(startDate, endDate);
      for (const l of allWeekLogs) {
        let dateMap = logsByHabit.get(l.habitId);
        if (!dateMap) {
          dateMap = new Map<string, boolean>();
          logsByHabit.set(l.habitId, dateMap);
        }
        dateMap.set(l.date, l.completed);
      }
    }

    const habitDTOs: HabitWithWeekLogsDTO[] = habits.map((habit) => {
      let logMap: Map<string, boolean> | undefined;
      if (logsByHabit) {
        logMap = logsByHabit.get(habit.id);
      } else {
        const logs = this.habitLogRepo.findByHabitAndDateRange(habit.id, startDate, endDate);
        logMap = new Map<string, boolean>();
        for (const l of logs) {
          logMap.set(l.date, l.completed);
        }
      }

      let weekCompletedCount = 0;
      const days: DayStatusDTO[] = weekDays.map((wd) => {
        const completed = logMap?.get(wd.date) === true;
        if (completed) weekCompletedCount++;
        return {
          dayName: wd.name,
          date: wd.date,
          completed,
          isToday: wd.isToday
        };
      });

      return {
        id: habit.id,
        title: habit.title,
        description: habit.description,
        color: habit.color,
        order_index: habit.orderIndex,
        created_at: habit.createdAt,
        days,
        weekCompletedCount
      };
    });

    return { habits: habitDTOs, weekDays };
  }
}
