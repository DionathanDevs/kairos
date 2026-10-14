export interface HabitLogProps {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export class HabitLog {
  private _id: string;
  private _habitId: string;
  private _date: string;
  private _completed: boolean;

  constructor(props: HabitLogProps) {
    this._id = props.id;
    this._habitId = props.habitId;
    this._date = props.date;
    this._completed = Boolean(props.completed);
  }

  public static create(habitId: string, date: string, completed: boolean = false): HabitLog {
    return new HabitLog({
      id: `${habitId}_${date}`,
      habitId,
      date,
      completed
    });
  }

  public toggle(): boolean {
    this._completed = !this._completed;
    return this._completed;
  }

  public setCompleted(completed: boolean): void {
    this._completed = completed;
  }

  public get id(): string { return this._id; }
  public get habitId(): string { return this._habitId; }
  public get date(): string { return this._date; }
  public get completed(): boolean { return this._completed; }

  public toJSON() {
    return {
      id: this._id,
      habit_id: this._habitId,
      date: this._date,
      completed: this._completed ? 1 : 0
    };
  }
}
