/* @ds-bundle: {"format":4,"namespace":"QuantumPapers","components":[{"name":"Button"},{"name":"TextLink"},{"name":"SearchPanel"},{"name":"ResultRow"},{"name":"PaperRow"},{"name":"TopicTag"},{"name":"SiteHeader"},{"name":"Panel"},{"name":"DataList"},{"name":"Breadcrumb"},{"name":"Kicker"},{"name":"Checkbox"},{"name":"Radio"},{"name":"TextField"},{"name":"FilterGroup"},{"name":"Pagination"},{"name":"ResultRowSkeleton"},{"name":"SiteFooter"},{"name":"CommandPalette"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }

  function Button(p) {
    return h('button', {
      type: p.type || 'button',
      className: cx('qp-button', p.className),
      disabled: p.disabled,
      onClick: p.onClick
    }, p.children);
  }

  function TextLink(p) {
    return h('a', { href: p.href || '#', className: cx('qp-textlink', p.className) }, p.children);
  }

  function TopicTag(p) {
    return h('a', { href: p.href || '#', className: cx('qp-tag', p.className) }, '#' + p.label);
  }

  function SearchPanel(p) {
    var id = p.id || 'qp-search';
    return h('div', { className: cx('qp-panel', p.className) },
      h('form', { className: 'qp-searchbar', onSubmit: p.onSubmit },
        h('label', { htmlFor: id, className: 'qp-sr-only' }, p.label || 'Consulta'),
        h('span', { className: 'qp-searchbar__prompt', 'aria-hidden': 'true' }, '$'),
        h('input', {
          id: id,
          type: 'search',
          className: 'qp-searchbar__input',
          defaultValue: p.defaultValue,
          placeholder: p.placeholder,
          onChange: p.onChange
        }),
        h(Button, { type: 'submit' }, p.buttonLabel || 'buscar ↵')
      ),
      p.children ? h('div', { className: 'qp-panel__label' }, p.resultsLabel || 'resultados · ordenados por similitud') : null,
      p.children ? h('ol', { className: 'qp-results' }, p.children) : null
    );
  }

  function ResultRow(p) {
    var s = Math.max(0, Math.min(1, p.similarity || 0));
    return h('li', { className: 'qp-result' },
      h('span', { className: 'qp-result__rank' }, p.rank),
      h('span', { className: 'qp-result__title' }, p.title),
      h('span', { className: 'qp-result__topic' }, '#' + p.topic),
      h('span', { className: 'qp-result__bar', 'aria-hidden': 'true' },
        h('span', { className: 'qp-result__fill', style: { width: Math.round(s * 100) + '%' } }))
    );
  }

  function PaperRow(p) {
    return h('a', { href: p.href || '#', className: cx('qp-paper', p.className) },
      h('span', { className: 'qp-paper__index' }, p.index),
      h('span', { className: 'qp-paper__title' }, p.title),
      h('span', { className: 'qp-paper__topic' }, '#' + p.topic),
      h('span', { className: 'qp-paper__year' }, p.year || '[año]'),
      h('span', { className: 'qp-paper__arxiv' }, p.arxiv || '[arXiv:id]')
    );
  }

  var DEFAULT_LINKS = [
    { label: 'papers', href: '#' },
    { label: 'temas', href: '#' },
    { label: 'autores', href: '#' },
    { label: 'cómo_funciona', href: '#' }
  ];

  function SiteHeader(p) {
    var links = p.links || DEFAULT_LINKS;
    var st = React.useState(false);
    var open = p.open !== undefined ? p.open : st[0];
    function toggle() {
      if (p.onMenuClick) p.onMenuClick();
      else st[1](!st[0]);
    }
    return h('header', { className: cx('qp-header', p.compact && 'qp-header--compact', open && 'qp-header--open', p.className) },
      h('a', { href: p.homeHref || '#', className: 'qp-logo' },
        h('span', { className: 'qp-logo__prompt', 'aria-hidden': 'true' }, '>'),
        'quantum_papers'),
      h('button', { type: 'button', className: 'qp-header__menu', 'aria-expanded': open ? 'true' : 'false', 'aria-controls': 'qp-nav', onClick: toggle },
        open ? 'cerrar' : 'men\u00fa'),
      h('nav', { id: 'qp-nav', className: 'qp-nav', 'aria-label': 'Principal' },
        links.map(function (l) { return h('a', { key: l.label, href: l.href }, l.label); }),
        h('span', { className: 'qp-kbd', 'aria-hidden': 'true' }, '\u2318K'))
    );
  }

  function Panel(p) {
    return h('div', { className: cx('qp-panel qp-panel--fluid', p.className) },
      p.label ? h('div', { className: 'qp-panel__label' }, p.label) : null,
      p.children
    );
  }

  function DataList(p) {
    return h('dl', { className: cx('qp-datalist', p.className) },
      (p.items || []).map(function (it) {
        return h('div', { key: it.label, className: 'qp-datalist__row' },
          h('dt', null, it.label),
          h('dd', { className: it.accent ? 'qp-datalist__value qp-datalist__value--accent' : 'qp-datalist__value' }, it.value)
        );
      })
    );
  }

  function Breadcrumb(p) {
    var items = p.items || [];
    var out = [];
    items.forEach(function (it, i) {
      if (i > 0) out.push(h('span', { key: 's' + i, 'aria-hidden': 'true' }, '/'));
      if (i === items.length - 1) {
        out.push(h('span', { key: 'i' + i, 'aria-current': 'page', className: 'qp-breadcrumb__current' }, it.label));
      } else {
        out.push(h('a', { key: 'i' + i, href: it.href || '#' }, it.label));
      }
    });
    return h('nav', { className: cx('qp-breadcrumb', p.className), 'aria-label': 'Ruta' }, out);
  }

  function Kicker(p) {
    return h('p', { className: cx('qp-kicker', p.className) }, '// ', p.children);
  }

  function Choice(type, p) {
    return h('label', { className: cx('qp-choice', p.className) },
      h('input', {
        type: type,
        name: p.name,
        value: p.value,
        defaultChecked: p.defaultChecked,
        disabled: p.disabled,
        onChange: p.onChange
      }),
      p.children
    );
  }

  function Checkbox(p) { return Choice('checkbox', p); }
  function Radio(p) { return Choice('radio', p); }

  function TextField(p) {
    var id = p.id || ('qp-field-' + String(p.label).replace(/\W+/g, '-'));
    return h('div', { className: cx('qp-field', p.className) },
      h('label', { htmlFor: id, className: 'qp-field__label' }, p.label),
      h('input', {
        id: id,
        type: p.type || 'text',
        className: 'qp-field__input',
        name: p.name,
        defaultValue: p.defaultValue,
        placeholder: p.placeholder,
        onChange: p.onChange
      })
    );
  }

  function FilterGroup(p) {
    return h('fieldset', { className: cx('qp-filter', p.className) },
      h('legend', { className: 'qp-filter__legend' }, p.legend),
      p.children
    );
  }

  function Pagination(p) {
    var pages = p.pages || [];
    return h('nav', { className: cx('qp-pagination', p.className), 'aria-label': 'Paginación' },
      h(TextLink, { href: p.prevHref }, '← anterior'),
      h('div', { className: 'qp-pagination__pages' },
        pages.map(function (pg, i) {
          if (pg.gap) return h('span', { key: 'g' + i, 'aria-hidden': 'true', className: 'qp-pagination__gap' }, '…');
          return h('a', {
            key: 'p' + i,
            href: pg.href || '#',
            'aria-current': pg.current ? 'page' : undefined,
            className: cx('qp-pagination__page', pg.current && 'qp-pagination__page--current')
          }, pg.label);
        })
      ),
      h(TextLink, { href: p.nextHref }, 'siguiente →')
    );
  }

  function ResultRowSkeleton(p) {
    return h('li', { className: 'qp-result qp-skeleton', 'aria-hidden': 'true' },
      h('span', { className: 'qp-skeleton__block', style: { flex: '0 0 28px', height: '13px' } }),
      h('span', { className: 'qp-skeleton__block', style: { flex: '1 1 300px', maxWidth: p.titleWidth || '60%', height: '18px' } }),
      h('span', { className: 'qp-skeleton__block', style: { flex: '0 0 56px', height: '12px' } }),
      h('span', { className: 'qp-result__bar' })
    );
  }

  function SiteFooter(p) {
    return h('footer', { className: cx('qp-footer', p.className) },
      h('span', null, p.left || 'datos: arXiv'),
      h('span', null, p.right || 'proyecto de portafolio')
    );
  }

  function CommandPalette(p) {
    var groups = p.groups || [];
    return h('div', { className: cx('qp-cmd', p.className), role: 'dialog', 'aria-label': p.label || 'Paleta de comandos' },
      h('div', { className: 'qp-cmd__bar' },
        h('span', { className: 'qp-searchbar__prompt', 'aria-hidden': 'true' }, '$'),
        h('input', {
          type: 'search',
          className: 'qp-cmd__input',
          'aria-label': 'Buscar o ir a',
          defaultValue: p.defaultValue,
          placeholder: p.placeholder || 'buscar o ir a\u2026',
          onChange: p.onChange
        }),
        h('span', { className: 'qp-kbd', 'aria-hidden': 'true' }, 'esc')
      ),
      h('div', { className: 'qp-cmd__list' },
        groups.map(function (g) {
          return h('div', { key: g.label, role: 'group', 'aria-label': g.label },
            h('div', { className: 'qp-cmd__group', 'aria-hidden': 'true' }, g.label),
            h('ul', { className: 'qp-cmd__items', role: 'listbox' },
              (g.items || []).map(function (it) {
                return h('li', { key: it.label, role: 'option', 'aria-selected': it.active ? 'true' : 'false', className: cx('qp-cmd__item', it.active && 'qp-cmd__item--active') },
                  h('span', { className: 'qp-cmd__marker', 'aria-hidden': 'true' }, it.active ? '>' : ''),
                  h('span', { className: 'qp-cmd__label' }, it.label),
                  it.hint ? h('span', { className: 'qp-cmd__hint' }, it.hint) : null
                );
              })
            )
          );
        })
      ),
      h('div', { className: 'qp-cmd__footer', 'aria-hidden': 'true' },
        h('span', null, '\u2191\u2193 navegar'),
        h('span', null, '\u21b5 abrir'),
        h('span', null, 'esc cerrar')
      )
    );
  }

  window.QuantumPapers = {
    Button: Button,
    TextLink: TextLink,
    SearchPanel: SearchPanel,
    ResultRow: ResultRow,
    PaperRow: PaperRow,
    TopicTag: TopicTag,
    SiteHeader: SiteHeader,
    Panel: Panel,
    DataList: DataList,
    Breadcrumb: Breadcrumb,
    Kicker: Kicker,
    Checkbox: Checkbox,
    Radio: Radio,
    TextField: TextField,
    FilterGroup: FilterGroup,
    Pagination: Pagination,
    ResultRowSkeleton: ResultRowSkeleton,
    SiteFooter: SiteFooter,
    CommandPalette: CommandPalette
  };
})();
