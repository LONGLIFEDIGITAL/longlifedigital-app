/* ACF Free row editor. ACF handles permissions, nonces, validation and saving. */
(() => {
  function enhance() {
    document
      .querySelectorAll('.acf-field[data-name="lld_translation_offerings"]')
      .forEach((field) => {
        const storage = field.querySelector('textarea');
        if (!storage || storage.dataset.rowEditor) return;
        let rows;
        try {
          rows = JSON.parse(storage.value || '[]');
        } catch {
          return;
        }
        if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== 'object')) return;
        storage.dataset.rowEditor = 'true';
        const editor = document.createElement('div');
        editor.className = 'lld-offerings-editor';
        const list = document.createElement('div');
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        const add = button('Add document or package', () => {
          rows.push({
            id: `doc-${window.crypto.randomUUID()}`,
            title: '',
            note: '',
            unit: 'document',
            price: null,
            documents: 1,
            documentTypes: [],
            enabled: true,
          });
          sync();
          render();
          list.lastElementChild.querySelector('input[type="text"]').focus();
        });
        editor.append(list, add, status);
        storage.after(editor);
        storage.hidden = true;
        function sync() {
          storage.value = JSON.stringify(rows);
          storage.dispatchEvent(new Event('input', { bubbles: true }));
          storage.dispatchEvent(new Event('change', { bubbles: true }));
          add.disabled = rows.length >= 50;
        }
        function button(text, action, label) {
          const control = document.createElement('button');
          control.type = 'button';
          control.className = 'button';
          control.textContent = text;
          if (label) control.setAttribute('aria-label', label);
          control.addEventListener('click', action);
          return control;
        }
        function render() {
          list.replaceChildren();
          add.disabled = rows.length >= 50;
          rows.forEach((row, index) => {
            const card = document.createElement('fieldset');
            const legend = document.createElement('legend');
            legend.textContent = row.title || `New offering ${index + 1}`;
            card.append(legend);
            const grid = document.createElement('div');
            grid.className = 'lld-offering-fields';
            function input(labelText, key, type = 'text', choices) {
              const label = document.createElement('label');
              const title = document.createElement('span');
              title.textContent = labelText;
              title.id = `lld-offering-${row.id}-${key}`;
              const multiline = key === 'note' || key === 'documentTypes';
              const control = document.createElement(
                choices ? 'select' : multiline ? 'textarea' : 'input',
              );
              control.setAttribute('aria-labelledby', title.id);
              if (choices)
                choices.forEach(([value, name]) => {
                  const option = document.createElement('option');
                  option.value = value;
                  option.textContent = name;
                  control.append(option);
                });
              else if (!multiline) control.type = type;
              if (type === 'checkbox') control.checked = row[key];
              else if (key === 'documentTypes') control.value = (row[key] || []).join('\n');
              else control.value = row[key] ?? '';
              if (key === 'title' || key === 'note')
                control.maxLength = key === 'title' ? 160 : 600;
              if (multiline) {
                control.rows = key === 'documentTypes' ? 3 : 2;
                label.className = 'lld-offering-wide';
              }
              if (key === 'documentTypes') control.maxLength = 8049;
              if (key === 'price') {
                control.min = '0';
                control.max = '10000';
                control.step = '0.01';
                control.placeholder = 'Request a quote';
              }
              if (key === 'documents') {
                control.min = '1';
                control.max = '200';
                control.step = '1';
              }
              control.addEventListener('input', () => {
                row[key] =
                  key === 'documentTypes'
                    ? control.value
                        .split(/\r?\n/)
                        .map((name) => name.trim())
                        .filter(Boolean)
                    : type === 'checkbox'
                      ? control.checked
                      : type === 'number'
                        ? control.value === ''
                          ? null
                          : Number(control.value)
                        : control.value;
                if (key === 'title')
                  legend.textContent = control.value || `New offering ${index + 1}`;
                if (key === 'unit') {
                  countLabel.hidden = row.unit !== 'package';
                  if (row.unit !== 'package') {
                    row.documents = 1;
                    countLabel.querySelector('input').value = '1';
                  }
                }
                sync();
              });
              label.append(title, control);
              grid.append(label);
              return label;
            }
            input('Document or package name', 'title');
            input('Price in USD (leave blank for a quote)', 'price', 'number');
            input('Price applies to', 'unit', 'text', [
              ['document', 'Each document'],
              ['page', 'Each page'],
              ['package', 'Whole package'],
            ]);
            const countLabel = input('Documents included in package', 'documents', 'number');
            countLabel.hidden = row.unit !== 'package';
            input('Description / page-count guidance', 'note');
            const choicesLabel = input('Document choices (one per line)', 'documentTypes');
            const help = document.createElement('small');
            help.id = `lld-offering-${row.id}-document-help`;
            help.textContent =
              'Customers choose one document from this list after selecting the service group. Up to 50 unique choices, 160 characters each. Leave blank for a single document service or a fixed package.';
            choicesLabel.querySelector('textarea').setAttribute('aria-describedby', help.id);
            choicesLabel.append(help);
            input('Show on website and quote form', 'enabled', 'checkbox');
            card.append(grid);
            const actions = document.createElement('div');
            actions.className = 'lld-offering-actions';
            const move = (direction) => {
              const target = index + direction;
              [rows[index], rows[target]] = [rows[target], rows[index]];
              sync();
              render();
              status.textContent = `Moved ${row.title || 'offering'} to position ${target + 1}. Save with Update to publish.`;
              list.children[target].querySelector('input').focus();
            };
            const up = button('Move up', () => move(-1), `Move offering ${index + 1} up`);
            const down = button('Move down', () => move(1), `Move offering ${index + 1} down`);
            up.disabled = index === 0;
            down.disabled = index === rows.length - 1;
            actions.append(
              up,
              down,
              button(
                'Remove',
                () => {
                  rows.splice(index, 1);
                  sync();
                  render();
                  add.focus();
                  status.textContent =
                    'Offering removed. Save with Update to publish your changes.';
                },
                `Remove offering ${index + 1}`,
              ),
            );
            card.append(actions);
            list.append(card);
          });
          if (!rows.length) {
            const empty = document.createElement('p');
            empty.textContent =
              'No documents or packages are offered. Add an entry to make it available on the website.';
            list.append(empty);
          }
        }
        render();
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
  if (window.acf) {
    window.acf.addAction('ready', enhance);
    window.acf.addAction('append', enhance);
  }
})();
