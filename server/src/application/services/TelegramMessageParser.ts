import type { TaskCategory, TaskPriority } from '../../domain/entities/Task.js';

export interface ParsedTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
}

export type ParsedTelegramMessage =
  | { type: 'command_help' }
  | { type: 'command_list'; category?: TaskCategory }
  | { type: 'create_task'; task: ParsedTaskInput }
  | { type: 'empty'; reason?: string };

const MAX_TITLE_LENGTH = 100;

export class TelegramMessageParser {
  public parse(rawText: string | undefined | null): ParsedTelegramMessage {
    if (!rawText || typeof rawText !== 'string') {
      return { type: 'empty', reason: 'Mensagem vazia.' };
    }

    const trimmed = rawText.trim();
    if (!trimmed) {
      return { type: 'empty', reason: 'Mensagem vazia.' };
    }

    // Check help/start commands
    if (/^\/(start|help|ajuda)(?:@\w+)?$/i.test(trimmed)) {
      return { type: 'command_help' };
    }

    // Check list commands
    const listMatch = trimmed.match(/^\/(list|tarefas|tasks)(?:@\w+)?(?:\s+(.*))?$/i);
    if (listMatch) {
      const arg = (listMatch[2] || '').trim().toLowerCase();
      let category: TaskCategory | undefined;
      if (arg && /^(#?work|#?trabalho|#?trab)$/i.test(arg)) {
        category = 'work';
      } else if (arg && /^(#?personal|#?pessoal)$/i.test(arg)) {
        category = 'personal';
      }
      return { type: 'command_list', category };
    }

    // Strip optional task creation command prefix (/add, /tarefa, /task, /nova)
    let content = trimmed;
    const addCommandMatch = trimmed.match(/^\/(add|tarefa|task|nova)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
    if (addCommandMatch) {
      content = (addCommandMatch[2] || '').trim();
      if (!content) {
        return {
          type: 'empty',
          reason: 'Informe o título da tarefa após o comando. Exemplo: /tarefa Comprar café !alta #pessoal'
        };
      }
    } else if (trimmed.startsWith('/')) {
      // Unknown slash command
      return {
        type: 'empty',
        reason: 'Comando não reconhecido. Envie o texto da tarefa diretamente ou use /ajuda.'
      };
    }

    return this.parseTaskContent(content);
  }

  private parseTaskContent(content: string): ParsedTelegramMessage {
    let priority: TaskPriority = 'medium';
    let category: TaskCategory = 'personal';

    // Split lines: first line contains title (and optional '| description'), remaining lines are description
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { type: 'empty', reason: 'O título da tarefa não pode ser vazio.' };
    }

    const firstLine = lines[0];
    const extraLines = lines.slice(1).join('\n');

    // Check if first line has pipe separator `|`
    const pipeIndex = firstLine.indexOf('|');
    let rawTitleSegment = pipeIndex !== -1 ? firstLine.slice(0, pipeIndex) : firstLine;
    let pipeDescription = pipeIndex !== -1 ? firstLine.slice(pipeIndex + 1).trim() : '';

    // Extract tags from rawTitleSegment (and also check pipeDescription if tags were placed at the end)
    const extractTags = (text: string): string => {
      return text
        .replace(/(?:^|\s)(#work|#trabalho|#trab)\b/gi, () => {
          category = 'work';
          return ' ';
        })
        .replace(/(?:^|\s)(#personal|#pessoal|#casa)\b/gi, () => {
          category = 'personal';
          return ' ';
        })
        .replace(/(?:^|\s)(!high|!alta|!urgente|#high|#alta|#urgente|!!)(?=\s|$)/gi, () => {
          priority = 'high';
          return ' ';
        })
        .replace(/(?:^|\s)(!low|!baixa|#low|#baixa)(?=\s|$)/gi, () => {
          priority = 'low';
          return ' ';
        })
        .replace(/(?:^|\s)(!medium|!media|!média|#medium|#media|#média)(?=\s|$)/gi, () => {
          priority = 'medium';
          return ' ';
        });
    };

    rawTitleSegment = extractTags(rawTitleSegment);
    if (pipeDescription) {
      pipeDescription = extractTags(pipeDescription);
    }

    let cleanTitle = rawTitleSegment.replace(/\s+/g, ' ').trim();
    const descriptionParts = [pipeDescription.replace(/\s+/g, ' ').trim(), extraLines].filter(Boolean);
    let cleanDescription = descriptionParts.join('\n').trim();

    if (!cleanTitle) {
      return {
        type: 'empty',
        reason: 'O título da tarefa é obrigatório. Envie o nome da tarefa junto com as tags.'
      };
    }

    // Handle titles longer than 100 characters gracefully by moving full text to description
    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      const overflowContext = cleanTitle;
      cleanTitle = `${cleanTitle.slice(0, MAX_TITLE_LENGTH - 3).trim()}...`;
      cleanDescription = cleanDescription
        ? `${overflowContext}\n${cleanDescription}`
        : overflowContext;
    }

    return {
      type: 'create_task',
      task: {
        title: cleanTitle,
        description: cleanDescription,
        priority,
        category
      }
    };
  }
}
