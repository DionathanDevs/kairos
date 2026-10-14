import { ValidationError } from '../errors/DomainError.js';

export interface HabitProps {
  id: string;
  title: string;
  description?: string;
  color?: string;
  orderIndex?: number;
  createdAt?: string;
}

export class Habit {
  private _id: string;
  private _title: string;
  private _description: string;
  private _color: string;
  private _orderIndex: number;
  private _createdAt: string;

  constructor(props: HabitProps) {
    this.validateTitle(props.title);
    this._id = props.id;
    this._title = props.title.trim();
    this._description = (props.description || '').trim();
    this._color = props.color || '#10b981';
    this._orderIndex = props.orderIndex ?? 0;
    this._createdAt = props.createdAt || new Date().toISOString();
  }

  public static create(title: string, description: string = '', color: string = '#10b981', orderIndex: number = 0): Habit {
    const id = `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return new Habit({
      id,
      title,
      description,
      color,
      orderIndex,
      createdAt: new Date().toISOString()
    });
  }

  public update(title: string, description: string = '', color?: string): void {
    this.validateTitle(title);
    this._title = title.trim();
    this._description = description.trim();
    if (color) {
      this._color = color;
    }
  }

  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('O título do hábito é obrigatório e não pode ser vazio.');
    }
    if (title.trim().length > 100) {
      throw new ValidationError('O título do hábito não pode ter mais de 100 caracteres.');
    }
  }

  public get id(): string { return this._id; }
  public get title(): string { return this._title; }
  public get description(): string { return this._description; }
  public get color(): string { return this._color; }
  public get orderIndex(): number { return this._orderIndex; }
  public get createdAt(): string { return this._createdAt; }

  public toJSON() {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      color: this._color,
      order_index: this._orderIndex,
      created_at: this._createdAt
    };
  }
}
