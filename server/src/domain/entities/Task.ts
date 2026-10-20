import { ValidationError } from '../errors/DomainError.js';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'personal' | 'work';

const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
const VALID_CATEGORIES: TaskCategory[] = ['personal', 'work'];

export interface TaskProps {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  completed?: boolean;
  orderIndex?: number;
  createdAt?: string;
}

export class Task {
  private _id: string;
  private _title: string;
  private _description: string;
  private _priority: TaskPriority;
  private _category: TaskCategory;
  private _completed: boolean;
  private _orderIndex: number;
  private _createdAt: string;

  constructor(props: TaskProps) {
    this.validateTitle(props.title);
    const priority = props.priority || 'medium';
    const category = props.category || 'personal';
    this.validatePriority(priority);
    this.validateCategory(category);

    this._id = props.id;
    this._title = props.title.trim();
    this._description = (props.description || '').trim();
    this._priority = priority;
    this._category = category;
    this._completed = Boolean(props.completed);
    this._orderIndex = props.orderIndex ?? 0;
    this._createdAt = props.createdAt || new Date().toISOString();
  }

  public static create(
    title: string,
    description: string = '',
    priority: TaskPriority = 'medium',
    category: TaskCategory = 'personal',
    orderIndex: number = 0
  ): Task {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return new Task({
      id,
      title,
      description,
      priority,
      category,
      completed: false,
      orderIndex,
      createdAt: new Date().toISOString()
    });
  }

  public update(
    title: string,
    description: string = '',
    priority?: TaskPriority,
    category?: TaskCategory
  ): void {
    this.validateTitle(title);
    if (priority !== undefined) {
      this.validatePriority(priority);
      this._priority = priority;
    }
    if (category !== undefined) {
      this.validateCategory(category);
      this._category = category;
    }
    this._title = title.trim();
    this._description = description.trim();
  }

  public toggleCompleted(): boolean {
    this._completed = !this._completed;
    return this._completed;
  }

  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('O título da tarefa é obrigatório e não pode ser vazio.');
    }
    if (title.trim().length > 100) {
      throw new ValidationError('O título da tarefa não pode ter mais de 100 caracteres.');
    }
  }

  private validatePriority(priority: string): void {
    if (!VALID_PRIORITIES.includes(priority as TaskPriority)) {
      throw new ValidationError('A prioridade da tarefa deve ser high, medium ou low.');
    }
  }

  private validateCategory(category: string): void {
    if (!VALID_CATEGORIES.includes(category as TaskCategory)) {
      throw new ValidationError('A categoria da tarefa deve ser personal ou work.');
    }
  }

  public get id(): string { return this._id; }
  public get title(): string { return this._title; }
  public get description(): string { return this._description; }
  public get priority(): TaskPriority { return this._priority; }
  public get category(): TaskCategory { return this._category; }
  public get completed(): boolean { return this._completed; }
  public get orderIndex(): number { return this._orderIndex; }
  public get createdAt(): string { return this._createdAt; }

  public toJSON() {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      priority: this._priority,
      category: this._category,
      completed: this._completed,
      order_index: this._orderIndex,
      created_at: this._createdAt
    };
  }
}
