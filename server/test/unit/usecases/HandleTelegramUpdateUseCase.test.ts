import { jest } from '@jest/globals';
import { HandleTelegramUpdateUseCase } from '../../../src/application/usecases/HandleTelegramUpdateUseCase.js';
import { CreateTaskUseCase, GetTasksUseCase } from '../../../src/application/usecases/TaskUseCases.js';
import type { ITaskRepository } from '../../../src/domain/repositories/ITaskRepository.js';
import type { Task } from '../../../src/domain/entities/Task.js';
import {
  loadTelegramBotConfig,
  sanitizeSensitiveText
} from '../../../src/infrastructure/telegram/TelegramBotConfig.js';
import { TelegramApiClient } from '../../../src/infrastructure/telegram/TelegramApiClient.js';
import { TelegramPollingService } from '../../../src/infrastructure/telegram/TelegramPollingService.js';

describe('HandleTelegramUpdateUseCase & Telegram Infrastructure', () => {
  let savedTasks: Task[];
  let mockTaskRepo: ITaskRepository;
  let createTaskUseCase: CreateTaskUseCase;
  let getTasksUseCase: GetTasksUseCase;

  beforeEach(() => {
    savedTasks = [];
    mockTaskRepo = {
      findAll: jest.fn(() => savedTasks),
      findById: jest.fn((id: string) => savedTasks.find((t) => t.id === id) || null),
      save: jest.fn((task: Task) => {
        savedTasks.push(task);
      }),
      delete: jest.fn(() => true),
      getNextOrderIndex: jest.fn(() => savedTasks.length + 1),
      markAllCompleted: jest.fn(() => 0),
      clearCompleted: jest.fn(() => 0)
    };
    createTaskUseCase = new CreateTaskUseCase(mockTaskRepo);
    getTasksUseCase = new GetTasksUseCase(mockTaskRepo);
  });

  it('should block unauthorized chat_id and never create tasks (Zero-Trust)', () => {
    const useCase = new HandleTelegramUpdateUseCase(
      createTaskUseCase,
      getTasksUseCase,
      new Set(['111222333'])
    );

    const result = useCase.execute({
      update_id: 1,
      message: {
        message_id: 10,
        chat: { id: 999999999, type: 'private' },
        text: 'Tarefa invasora'
      }
    });

    expect(result.handled).toBe(false);
    expect(result.reason).toBe('unauthorized');
    expect(savedTasks).toHaveLength(0);
  });

  it('should block all messages when allowedChatIds is empty', () => {
    const useCase = new HandleTelegramUpdateUseCase(
      createTaskUseCase,
      getTasksUseCase,
      new Set()
    );

    const result = useCase.execute({
      update_id: 1,
      message: {
        message_id: 10,
        chat: { id: 111222333, type: 'private' },
        text: 'Criar tarefa'
      }
    });

    expect(result.handled).toBe(false);
    expect(result.reason).toBe('unauthorized');
    expect(savedTasks).toHaveLength(0);
  });

  it('should create task directly when chat_id is authorized', () => {
    const useCase = new HandleTelegramUpdateUseCase(
      createTaskUseCase,
      getTasksUseCase,
      new Set(['111222333'])
    );

    const result = useCase.execute({
      update_id: 2,
      message: {
        message_id: 11,
        chat: { id: 111222333, type: 'private' },
        text: 'Fechar escopo da sprint #work !alta | Alinhar com time de produto'
      }
    });

    expect(result.handled).toBe(true);
    expect(result.createdTask).toBeDefined();
    expect(result.createdTask?.title).toBe('Fechar escopo da sprint');
    expect(result.createdTask?.category).toBe('work');
    expect(result.createdTask?.priority).toBe('high');
    expect(result.createdTask?.description).toBe('Alinhar com time de produto');
    expect(result.replyText).toContain('Tarefa criada com sucesso');
    expect(savedTasks).toHaveLength(1);
  });

  it('should list pending tasks when /tarefas is sent', () => {
    const useCase = new HandleTelegramUpdateUseCase(
      createTaskUseCase,
      getTasksUseCase,
      new Set(['111222333'])
    );

    useCase.execute({
      update_id: 3,
      message: {
        message_id: 12,
        chat: { id: 111222333, type: 'private' },
        text: 'Revisar código #work !alta'
      }
    });

    const listResult = useCase.execute({
      update_id: 4,
      message: {
        message_id: 13,
        chat: { id: 111222333, type: 'private' },
        text: '/tarefas'
      }
    });

    expect(listResult.handled).toBe(true);
    expect(listResult.replyText).toContain('Tarefas pendentes');
    expect(listResult.replyText).toContain('Revisar código');
  });

  it('should load config from env and mask sensitive tokens in logs/errors', () => {
    const cfg = loadTelegramBotConfig({
      TELEGRAM_BOT_ENABLED: 'true',
      TELEGRAM_BOT_TOKEN: 'my-dummy-token-for-unit-test',
      TELEGRAM_ALLOWED_CHAT_IDS: '1001, 1002 ',
      TELEGRAM_BOT_MODE: 'polling',
      TELEGRAM_POLLING_INTERVAL_MS: '1500'
    });

    expect(cfg.enabled).toBe(true);
    expect(cfg.allowedChatIds.has('1001')).toBe(true);
    expect(cfg.allowedChatIds.has('1002')).toBe(true);
    expect(cfg.pollingIntervalMs).toBe(1500);

    const leaked = 'Request to https://api.telegram.org/botmy-dummy-token-for-unit-test/getUpdates failed';
    const sanitized = sanitizeSensitiveText(leaked, ['my-dummy-token-for-unit-test']);
    expect(sanitized).not.toContain('my-dummy-token-for-unit-test');
    expect(sanitized).toContain('[REDACTED_SECRET]');
  });

  it('TelegramPollingService.pollOnce should fetch updates, create tasks, and send reply', async () => {
    const useCase = new HandleTelegramUpdateUseCase(
      createTaskUseCase,
      getTasksUseCase,
      new Set(['555666'])
    );

    const mockFetch = jest.fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          result: [
            {
              update_id: 100,
              message: {
                message_id: 1,
                chat: { id: 555666, type: 'private' },
                text: 'Ligar para o contador !media #pessoal'
              }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: {} })
      } as Response);

    const apiClient = new TelegramApiClient('test-only-token', mockFetch);
    const pollingService = new TelegramPollingService(apiClient, useCase, 1000);

    const count = await pollingService.pollOnce();
    expect(count).toBe(1);
    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0].title).toBe('Ligar para o contador');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
