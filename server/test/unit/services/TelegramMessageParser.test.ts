import { TelegramMessageParser } from '../../../src/application/services/TelegramMessageParser.js';

describe('TelegramMessageParser', () => {
  const parser = new TelegramMessageParser();

  it('should parse simple text message as personal medium-priority task', () => {
    const result = parser.parse('Comprar café em grãos');
    expect(result).toEqual({
      type: 'create_task',
      task: {
        title: 'Comprar café em grãos',
        description: '',
        priority: 'medium',
        category: 'personal'
      }
    });
  });

  it('should extract category (#work / #trabalho) and priority (!alta / !baixa) tags', () => {
    const result = parser.parse('Preparar relatório trimestral #work !alta');
    expect(result).toEqual({
      type: 'create_task',
      task: {
        title: 'Preparar relatório trimestral',
        description: '',
        priority: 'high',
        category: 'work'
      }
    });

    const lowResult = parser.parse('#pessoal Organizar gaveta !baixa');
    expect(lowResult).toEqual({
      type: 'create_task',
      task: {
        title: 'Organizar gaveta',
        description: '',
        priority: 'low',
        category: 'personal'
      }
    });
  });

  it('should extract description separated by pipe | or newline', () => {
    const pipeResult = parser.parse('Revisar PR de autenticação #trabalho !urgente | Conferir cobertura de testes');
    expect(pipeResult).toEqual({
      type: 'create_task',
      task: {
        title: 'Revisar PR de autenticação',
        description: 'Conferir cobertura de testes',
        priority: 'high',
        category: 'work'
      }
    });

    const multilineResult = parser.parse('Fazer compras do mês #pessoal\nLeite, ovos, pão e frutas');
    expect(multilineResult).toEqual({
      type: 'create_task',
      task: {
        title: 'Fazer compras do mês',
        description: 'Leite, ovos, pão e frutas',
        priority: 'medium',
        category: 'personal'
      }
    });
  });

  it('should support explicit /tarefa and /add commands', () => {
    const res = parser.parse('/tarefa Atualizar documentação da API #work !media');
    expect(res).toEqual({
      type: 'create_task',
      task: {
        title: 'Atualizar documentação da API',
        description: '',
        priority: 'medium',
        category: 'work'
      }
    });
  });

  it('should truncate titles exceeding 100 chars and preserve full text in description', () => {
    const longTitle = 'A'.repeat(115);
    const res = parser.parse(longTitle);
    expect(res.type).toBe('create_task');
    if (res.type === 'create_task') {
      expect(res.task.title.length).toBeLessThanOrEqual(100);
      expect(res.task.title.endsWith('...')).toBe(true);
      expect(res.task.description).toContain(longTitle);
    }
  });

  it('should parse /start, /help, /ajuda and /tarefas commands', () => {
    expect(parser.parse('/start')).toEqual({ type: 'command_help' });
    expect(parser.parse('/ajuda')).toEqual({ type: 'command_help' });
    expect(parser.parse('/tarefas')).toEqual({ type: 'command_list', category: undefined });
    expect(parser.parse('/list #work')).toEqual({ type: 'command_list', category: 'work' });
  });

  it('should return empty result when message or /add command has no title', () => {
    expect(parser.parse('   ').type).toBe('empty');
    expect(parser.parse('/tarefa   ').type).toBe('empty');
    expect(parser.parse('#work !alta').type).toBe('empty');
    expect(parser.parse('/comandoinvalido').type).toBe('empty');
  });
});
