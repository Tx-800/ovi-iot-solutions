/* ==========================================================================
   form.js — enhances the contact form. It does not create it.

   partials/contact-form.html is already a complete HTML form: native POST to
   Web3Forms, native `required` / `type="email"` validation, a honeypot, and a
   CSS-only success note. With scripting off, that is what runs (PRD N5).

   This module takes over when it can:
     - sets novalidate and validates inline, field by field, with messages
       tied by aria-describedby and flagged by aria-invalid;
     - on a failed submit, writes an error summary — with a link to each
       field — into the aria-live status region, and moves focus to the
       first field that needs fixing;
     - submits with fetch, per Web3Forms' documented JSON pattern, and shows
       sending / success / error states in the same live region, without a
       page reload.

   Submitted data is never logged and never written with innerHTML.
   ========================================================================== */

const ENDPOINT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* One rule per validated field. Messages say what to do, not what went
   wrong (AGENTS.md §5: errors give direction). */
const RULES = {
  name: (v) => (v ? '' : 'Enter your name'),
  email: (v) => {
    if (!v) return 'Enter your work email address';
    if (!EMAIL.test(v)) return 'Enter an email address in the correct format, like name@company.com';
    return '';
  },
  message: (v) => (v ? '' : 'Enter your message'),
};

export function init() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-form-submit]');
  const submitLabel = submit ? submit.textContent : '';
  if (!status || !submit) return;

  /* From here JavaScript owns validation; without it the browser's native
     validation runs on the same `required` / `type` attributes. */
  form.setAttribute('novalidate', '');

  const fields = Object.keys(RULES)
    .map((name) => form.elements.namedItem(name))
    .filter(Boolean);

  /* A field shows its error only after the person has left it once, or
     after a submit — never while they are still typing a first attempt. */
  const touched = new Set();

  /* --- Per-field errors ---------------------------------------------------- */

  function errorNodeFor(field) {
    return form.querySelector(`#${field.id}-error`);
  }

  function setFieldError(field, message) {
    const node = errorNodeFor(field);
    if (!node) return;

    if (message) {
      node.textContent = '';
      const prefix = document.createElement('span');
      prefix.className = 'visually-hidden';
      prefix.textContent = 'Error: ';
      node.append(prefix, document.createTextNode(message));
      node.hidden = false;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', node.id);
    } else {
      node.textContent = '';
      node.hidden = true;
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
  }

  function validateField(field) {
    const message = RULES[field.name](field.value.trim());
    setFieldError(field, message);
    return message;
  }

  for (const field of fields) {
    field.addEventListener('blur', () => {
      touched.add(field.name);
      validateField(field);
    });
    field.addEventListener('input', () => {
      if (touched.has(field.name)) validateField(field);
    });
  }

  /* --- The live status region --------------------------------------------- */

  function clearStatus() {
    status.textContent = '';
    status.removeAttribute('data-state');
  }

  function showStatus(state, title, detail) {
    status.textContent = '';
    status.setAttribute('data-state', state);
    const heading = document.createElement('p');
    heading.className = 'form__status-title';
    heading.textContent = title;
    status.append(heading);
    if (detail) {
      const p = document.createElement('p');
      p.textContent = detail;
      status.append(p);
    }
  }

  function showErrorSummary(errors) {
    status.textContent = '';
    status.setAttribute('data-state', 'error');

    const heading = document.createElement('p');
    heading.className = 'form__status-title';
    heading.textContent = errors.length === 1
      ? 'There is 1 problem with your enquiry'
      : `There are ${errors.length} problems with your enquiry`;

    const list = document.createElement('ul');
    for (const { field, message } of errors) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${field.id}`;
      link.textContent = message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        field.focus();
      });
      item.append(link);
      list.append(item);
    }

    status.append(heading, list);
  }

  /* --- Busy state ----------------------------------------------------------
     aria-disabled rather than disabled: a disabled button drops focus, and
     the person's focus is on it at the moment they submit. */

  let sending = false;

  function setBusy(busy) {
    sending = busy;
    form.setAttribute('aria-busy', String(busy));
    if (busy) {
      submit.setAttribute('aria-disabled', 'true');
      submit.textContent = 'Sending…';
    } else {
      submit.removeAttribute('aria-disabled');
      submit.textContent = submitLabel;
    }
  }

  /* --- Submit ------------------------------------------------------------- */

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    fields.forEach((f) => touched.add(f.name));
    const errors = fields
      .map((field) => ({ field, message: validateField(field) }))
      .filter((e) => e.message);

    if (errors.length) {
      showErrorSummary(errors);
      errors[0].field.focus();
      return;
    }

    /* Honeypot ticked: a person cannot see it, so this is a bot. Send
       nothing, and say nothing that would tell it so. */
    const honeypot = form.elements.namedItem('botcheck');
    if (honeypot && honeypot.checked) return;

    /* While SITE.web3formsKey is still a placeholder, sync-partials.js
       removes the key input. Sending would only bounce off Web3Forms, so
       say plainly that nothing was sent. */
    const key = form.elements.namedItem('access_key');
    if (!key || !key.value) {
      showStatus('error', 'Your enquiry was not sent',
        'This form is not connected to an inbox yet. Please try again later.');
      return;
    }

    setBusy(true);
    showStatus('sending', 'Sending your enquiry…');

    const payload = Object.fromEntries(new FormData(form));
    delete payload.redirect;   /* the no-JS redirect is not wanted here */
    delete payload.botcheck;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: ENDPOINT_HEADERS,
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 200 && result.success !== false) {
        form.reset();
        touched.clear();
        fields.forEach((f) => setFieldError(f, ''));
        showStatus('success', 'Thanks — your enquiry has been sent',
          'We’ll come back to you with a technical response.');
      } else {
        showStatus('error', 'Your enquiry could not be sent',
          'Please try again in a few minutes. Nothing you typed has been lost.');
      }
    } catch {
      showStatus('error', 'Your enquiry could not be sent',
        'The connection failed. Check your connection and try again — nothing you typed has been lost.');
    } finally {
      setBusy(false);
    }
  });

  /* A stale message from an earlier attempt should not linger once the
     person starts editing again. */
  form.addEventListener('input', () => {
    if (status.getAttribute('data-state') === 'success') clearStatus();
  });
}
