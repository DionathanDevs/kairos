import { DomainError } from '../../domain/errors/DomainError.js';
import { TelegramMessageParser } from '../services/TelegramMessageParser.js';
import type { CreateTaskUseCase, GetTasksUseCase, TaskDTO } from './TaskUseCases.js';

export interface TelegramUser {
  id: number | string;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number | string;
  type: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date?: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface HandleTelegramUpdateResult {
  handled: boolean;
  reason?: 'unauthorized' | 'no_message_text' | 'processed' | 'validation_error';
  chatId?: string;
  replyText?: string;
  createdTask?: TaskDTO;
}

export class HandleTelegramUpdateUseCase {
  private parser: TelegramMessageParser;

  constructor(
    private createTaskUseCase: CreateTaskUseCase,
    private getTasksUseCase: GetTasksUseCase,
    private allowedChatIds: ReadonlySet<string>,
    parser?: TelegramMessageParser
  ) {
    this.parser = parser || new TelegramMessageParser();
  }

  public execute(update: TelegramUpdate): HandleTelegramUpdateResult {
    const message = update?.message;
    if (!message || !message.chat || message.chat.id === undefined || message.chat.id === null) {
      return { handled: false, reason: 'no_message_text' };
    }

    const chatId = String(message.chat.id).trim();
    const userId = message.from?.id !== undefined ? String(message.from.id).trim() : '';

    // Zero-Trust authorization check: must have at least one allowed ID configured and match chatId or userId
    if (!this.isAuthorized(chatId, userId)) {
      return {
        handled: false,
        reason: 'unauthorized',
        chatId
      };
    }

    if (typeof message.text !== 'string' || message.text.trim().length === 0) {
      return {
        handled: false,
        reason: 'no_message_text',
        chatId
      };
    }

    const parsed = this.parser.parse(message.text);

    if (parsed.type === 'command_help') {
      return {
        handled: true,
        reason: 'processed',
        chatId,
        replyText: this.buildHelpMessage()
      };
    }

    if (parsed.type === 'command_list') {
      const { tasks } = this.getTasksUseCase.execute(parsed.category);
      const pending = tasks.filter((t) => !t.completed);
      return {
        handled: true,
        reason: 'processed',
        chatId,
        replyText: this.buildTaskListMessage(pending, parsed.category)
      };
    }

    if (parsed.type === 'empty') {
      return {
        handled: true,
        reason: 'validation_error',
        chatId,
        replyText: `⚠️ ${parsed.reason || 'Mensagem inválida.'}`
      };
    }

    try {
      const createdTask = this.createTaskUseCase.execute(parsed.task);
      return {
        handled: true,
        reason: 'processed',
        chatId,
        createdTask,
        replyText: this.buildTaskCreatedMessage(createdTask)
      };
    } catch (err) {
      if (err instanceof DomainError) {
        return {
          handled: true,
          reason: 'validation_error',
          chatId,
          replyText: `⚠️ Não foi possível criar a tarefa: ${err.message}`
        };
      }
      throw err;
    }
  }

  private isAuthorized(chatId: string, userId: string): boolean {
    if (this.allowedChatIds.size === 0) {
      return false;
    }
    return this.allowedChatIds.has(chatId) || (Boolean(userId) && this.allowedChatIds.has(userId));
  }

  private buildTaskCreatedMessage(task: TaskDTO): string {
    const priorityLabels: Record<string, string> = {
      high: '🔴 Alta',
      medium: '🟡 Média',
      low: '🟢 Baixa'
    };
    const categoryLabels: Record<string, string> = {
      work: '💼 Trabalho',
      personal: '🏠 Pessoal'
    };

    const lines = [
      '✅ Tarefa criada com sucesso!',
      `📌 Título: ${task.title}`,
      `⚡ Prioridade: ${priorityLabels[task.priority] || task.priority}`,
      `📂 Categoria: ${categoryLabels[task.category] || task.category}`
    ];

    if (task.description) {
      lines.push(`📝 Descrição: ${task.description}`);
    }

    return lines.join('\n');
  }

  private buildTaskListMessage(tasks: TaskDTO[], category?: string): string {
    if (tasks.length === 0) {
      return '🎉 Nenhuma tarefa pendente no momento!';
    }

    const header = category
      ? `📋 Tarefas pendentes (${category === 'work' ? 'Trabalho' : 'Pessoal'}):`
      : '📋 Tarefas pendentes:';

    const priorityIcon: Record<string, string> = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };

    const items = tasks.slice(0, 15).map((t, idx) => {
      const icon = priorityIcon[t.priority] || '⚪';
      const catTag = t.category === 'work' ? '[Trab]' : '[Pess]';
      return `${idx + 1}. ${icon} ${catTag} ${t.title}`;
    });

    if (tasks.length > 15) {
      items.push(`... e mais ${tasks.length - 15} tarefa(s).`);
    }

    return [header, ...items].join('\n');
  }

  private buildHelpMessage(): string {
    return [
      '🤖 *Kairos Task Bot*',
      '',
      'Envie qualquer mensagem para criar uma tarefa diretamente no app!',
      '',
      '*Exemplos:*',
      '• `Comprar café` (cria tarefa Pessoal / Média)',
      '• `Revisar PR #work !alta | Checar testes`',
      '• `Agendar dentista #pessoal !baixa`',
      '',
      '*Tags suportadas:*',
      '• Categoria: `#work` (`#trabalho`) ou `#personal` (`#pessoal`)',
      '• Prioridade: `!alta` (`!high`), `!media` (`!medium`), `!baixa` (`!low`)',
      '• Descrição: use `|` ou envie na segunda linha',
      '',
      '*Comandos:*',
      '• `/tarefas` — Lista tarefas pendentes',
      '• `/tarefa <texto>` — Cria nova tarefa',
      '• `/ajuda` — Exibe esta mensagem'
    ].join('\n');
  }
}
