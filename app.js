const tabs = [...document.querySelectorAll('[role="tab"]')];
const views = [...document.querySelectorAll('[role="tabpanel"]')];

function selectView(id) {
  tabs.forEach((tab) => {
    const active = tab.dataset.view === id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  views.forEach((view) => {
    const active = view.id === id;
    view.hidden = !active;
    view.classList.toggle('active', active);
  });
  history.replaceState(null, '', `#${id}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectView(tab.dataset.view));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[target].focus();
    selectView(tabs[target].dataset.view);
  });
});

const initial = location.hash.slice(1);
if (tabs.some((tab) => tab.dataset.view === initial)) selectView(initial);

const contactDialog = document.querySelector('.contact-dialog');
const openContactButtons = [...document.querySelectorAll('[data-open-contact]')];
const closeContactButton = document.querySelector('[data-close-contact]');
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

function openContactDialog() {
  contactDialog.showModal();
  contactDialog.querySelector('input[name="nome"]').focus();
}

openContactButtons.forEach((button) => button.addEventListener('click', openContactDialog));
closeContactButton.addEventListener('click', () => contactDialog.close());
contactDialog.addEventListener('click', (event) => {
  if (event.target === contactDialog) contactDialog.close();
});
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(contactForm).entries());

  submitButton.disabled = true;
  formStatus.textContent = 'Enviando...';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      formStatus.textContent = data.error || 'Não foi possível enviar sua solicitação. Tente novamente.';
      return;
    }

    formStatus.textContent = 'Solicitação enviada. Em breve retornarei o contato.';
    contactForm.reset();
  } catch (error) {
    formStatus.textContent = 'Erro de conexão. Tente novamente em instantes.';
  } finally {
    submitButton.disabled = false;
  }
});
