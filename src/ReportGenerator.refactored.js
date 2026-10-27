// --- Regras de negócio (antes eram números mágicos espalhados pelo código) ---
const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

// Cada papel sabe quais itens pode ver (Replace Conditional with Polymorphism).
const VISIBILITY_RULES = {
  [ROLES.ADMIN]: () => true,
  [ROLES.USER]: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
};

const canNotSee = () => false;

function isPriority(item, user) {
  return user.role === ROLES.ADMIN && item.value > ADMIN_PRIORITY_THRESHOLD;
}

// --- Formatadores: cada formato encapsula seu cabeçalho, linha e rodapé ---
class CsvFormatter {
  header() {
    return ['ID,NOME,VALOR,USUARIO'];
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}`;
  }

  footer(total) {
    return ['', 'Total,,', `${total},,`];
  }
}

class HtmlFormatter {
  header(user) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];
  }

  row(item, user) {
    const openTag = isPriority(item, user) ? '<tr style="font-weight:bold;">' : '<tr>';
    return `${openTag}<td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }

  footer(total) {
    return ['</table>', `<h3>Total: ${total}</h3>`, '</body></html>'];
  }
}

const FORMATTERS = {
  CSV: new CsvFormatter(),
  HTML: new HtmlFormatter(),
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      return '';
    }

    const visibleItems = this.filterVisibleItems(user, items);
    const total = this.sumValues(visibleItems);

    const lines = [
      ...formatter.header(user),
      ...visibleItems.map((item) => formatter.row(item, user)),
      ...formatter.footer(total),
    ];

    return lines.join('\n').trim();
  }

  filterVisibleItems(user, items) {
    const canSee = VISIBILITY_RULES[user.role] ?? canNotSee;
    return items.filter(canSee);
  }

  sumValues(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
}
