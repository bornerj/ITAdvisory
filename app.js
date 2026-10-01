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
const erpSelect = contactForm.querySelector('select[name="erp"]');
const erpQualInput = contactForm.querySelector('input[name="erp-qual"]');

function syncErpQual() {
  const enabled = ['Sim', 'Em avaliação'].includes(erpSelect.value);
  erpQualInput.disabled = !enabled;
  if (!enabled) erpQualInput.value = '';
}

erpSelect.addEventListener('change', syncErpQual);

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
    syncErpQual();
  } catch (error) {
    formStatus.textContent = 'Erro de conexão. Tente novamente em instantes.';
  } finally {
    submitButton.disabled = false;
  }
});

const sfkVideo = document.getElementById('sfk-video');
if (sfkVideo) {
  const langTabs = document.querySelectorAll('[data-lang]');
  langTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      langTabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
      sfkVideo.src = tab.dataset.src;
      sfkVideo.load();
      sfkVideo.play().catch(() => {});
    });
  });
  // Ao terminar, volta ao início (poster) e para.
  sfkVideo.addEventListener('ended', () => sfkVideo.load());
}

// Carrossel SFK — adaptado de "Adaptive Thumbnail Carousel" (Taluska, MIT): https://codepen.io/Taluska/pen/eYqmXpJ
const sfkCarousel = document.querySelector('.sfk-carousel');
if (sfkCarousel) {
  const slider = sfkCarousel.querySelector('.sfk-slider');
  const screen = sfkCarousel.querySelector('.sfk-screen');
  const count = sfkCarousel.querySelector('.sfk-count');
  const prevButton = sfkCarousel.querySelector('.sfk-btn.prev');
  const nextButton = sfkCarousel.querySelector('.sfk-btn.next');
  const slides = [...slider.children];
  const sibling = (slide, dir) => (dir === 'prev' ? slide.previousElementSibling : slide.nextElementSibling);
  const activeSlide = () => slider.querySelector('.sfk-slide.active');

  function scrollToSlide(slide, behavior = 'smooth') {
    slider.scrollTo({ left: slide.offsetLeft - slider.clientWidth / 2 + slide.offsetWidth / 2, behavior });
  }

  function update(slide, behavior) {
    slides.forEach((s) => s.classList.toggle('active', s === slide));
    const img = slide.querySelector('img').cloneNode(true);
    img.loading = 'eager';
    screen.replaceChildren(img);
    count.textContent = `${String(slides.indexOf(slide) + 1).padStart(2, '0')} / ${slides.length}`;
    scrollToSlide(slide, behavior);
    prevButton.disabled = !sibling(slide, 'prev');
    nextButton.disabled = !sibling(slide, 'next');
  }

  prevButton.addEventListener('click', () => { const s = sibling(activeSlide(), 'prev'); if (s) update(s); });
  nextButton.addEventListener('click', () => { const s = sibling(activeSlide(), 'next'); if (s) update(s); });
  slider.addEventListener('click', (event) => {
    const slide = event.target.closest('.sfk-slide');
    if (slide) update(slide);
  });
  sfkCarousel.setAttribute('tabindex', '0');
  sfkCarousel.addEventListener('keydown', (event) => {
    const current = activeSlide();
    const target = { Home: slides[0], End: slides[slides.length - 1], ArrowLeft: sibling(current, 'prev'), ArrowRight: sibling(current, 'next') }[event.key];
    if (target) { event.preventDefault(); update(target); }
  });

  update(slides[0], 'auto');
  // A aba 05 começa oculta: reposiciona a faixa quando o carrossel passa a ser visível.
  new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) scrollToSlide(activeSlide(), 'auto');
  }).observe(sfkCarousel);
}
