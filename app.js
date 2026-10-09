(() => {
  'use strict';
  const config = window.CREDITPULSE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const tasks = ['orientation', 'permissions', 'reports', 'documents'];
  const storageKey = 'creditpulse-welcome-checklist-v1';
  let progress = {};
  let storageAvailable = true;
  let guideStep = 0;
  let activeView = 'home';
  let toastTimer;
  let dialogTrigger = null;
  const steps = [
    {
      title: 'Start with your reports',
      intro: 'Bring the full picture into one place.',
      description: 'Your Equifax and TransUnion reports are the starting point. CreditPulse’s portal brings your reports and supporting documents together for review.',
      action: 'Your part: get both consumer reports and upload readable copies in your authenticated portal.',
      caption: 'Start with both reports. They may contain different information.',
      ui: `<div class="demo-heading">${icon('doc')}<div><h3>Your credit reports</h3><p>A clear place to begin</p></div></div><div class="demo-row"><div><strong>Equifax Canada</strong><small>Consumer credit report</small></div><span class="status-pill">Received</span></div><div class="demo-row"><div><strong>TransUnion Canada</strong><small>Consumer disclosure</small></div><span class="status-pill pending">To prepare</span></div><div class="demo-note">Your documents are submitted through the client portal.</div>`
    },
    {
      title: 'Make sense of the findings',
      intro: 'You know your own story.',
      description: 'AI-assisted analysis flags items that may need a closer look. A finding is not proof of an error. Review the details, answer questions and confirm what is accurate.',
      action: 'Your part: check each finding against your records and tell us what you recognise.',
      caption: 'A potential issue is a question to investigate, not an automatic dispute.',
      ui: `<div class="demo-heading">${icon('search')}<div><h3>A finding to review</h3><p>Example only · personal information</p></div></div><div class="demo-row"><div><strong>An address needs checking</strong><small>Does this address belong to you?</small></div><span class="status-pill pending">Your review</span></div><div class="demo-note">Compare the address with your records. An old address may be accurate — your input matters.</div><div class="demo-approval">${icon('shield')} You confirm the details before moving forward.</div>`
    },
    {
      title: 'Review before anything is sent',
      intro: 'Your approval is part of the process.',
      description: 'Read the draft letter and check its details. The portal shows which letters are awaiting your review, approved or mailed. Nothing is mailed until you approve it.',
      action: 'Your part: read each drafted letter and only approve it when the facts are right.',
      caption: 'You can read each drafted letter before giving your approval.',
      ui: `<div class="demo-heading">${icon('letter')}<div><h3>Your draft letter</h3><p>Example only · ready for review</p></div></div><p class="demo-letter">Request to review credit report information</p><div class="demo-letter-line"></div><div class="demo-letter-line"></div><div class="demo-letter-line short"></div><div class="demo-approval">${icon('shield')} Awaiting your review and approval</div>`
    },
    {
      title: 'Keep your next step in sight',
      intro: 'Follow your case as it develops.',
      description: 'Use your case overview to follow letters, responses and next actions. When a bureau replies, upload the response in your portal so your case can be updated.',
      action: 'Your part: look out for replies and upload any response you receive.',
      caption: 'Response timing varies. Your case file keeps the steps and correspondence together.',
      ui: `<div class="demo-heading">${icon('clock')}<div><h3>Your case timeline</h3><p>Example only · a view of the process</p></div></div><div class="demo-row"><div><strong>Reports received</strong><small>Documents ready for review</small></div><span class="status-pill">Complete</span></div><div class="demo-row"><div><strong>Letter approved</strong><small>Your decision recorded</small></div><span class="status-pill">Complete</span></div><div class="demo-row"><div><strong>Bureau response</strong><small>Upload a reply when it arrives</small></div><span class="status-pill pending">Next</span></div>`
    }
  ];

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 3400);
  }

  // Reuse the matching home step-card photo as the soft backdrop behind the glass panel.
  function stepPhoto(index) {
    const img = $(`[data-step-link="${index}"] img`);
    const src = img && !img.hidden ? img.getAttribute('src') : '';
    return src ? `url("${src}")` : 'none';
  }

  function selectStep(index, focus = false) {
    const step = steps[index];
    if (!step) return;
    $$('.process-tab').forEach((tab, i) => {
      tab.classList.toggle('active', index === i);
      tab.setAttribute('aria-selected', String(index === i));
      tab.tabIndex = index === i ? 0 : -1;
      if (focus && index === i) tab.focus();
    });
    const panel = $('#step-panel');
    panel.setAttribute('aria-labelledby', `step-tab-${index}`);
    panel.style.setProperty('--panel-photo', stepPhoto(index));
    panel.innerHTML = `<div class="panel-kicker"><span>Inside your client portal</span><span class="example-label">Illustrative preview</span></div><div class="demo-ui">${step.ui}</div><p class="panel-caption">${step.caption}</p>`;
  }

  function closeMobileMenu() {
    $('#mobile-nav').hidden = true;
    $('.menu-button').setAttribute('aria-expanded', 'false');
    $('.menu-button').setAttribute('aria-label', 'Open navigation');
  }

  function navigate() {
    const hash = location.hash.slice(1) || 'home';
    if (hash === 'main') return;
    const nextView = ['membership', 'welcome'].includes(hash) ? hash : 'home';
    ['home', 'membership', 'welcome'].forEach((view) => {
      $(`#${view}-view`).hidden = view !== nextView;
    });
    const changed = activeView !== nextView;
    activeView = nextView;
    document.title = nextView === 'membership' ? 'Membership — CreditPulse' : nextView === 'welcome' ? 'Your welcome guide — CreditPulse' : 'CreditPulse — A clearer path to your next chapter';
    $$('.desktop-nav a').forEach((link) => {
      if (link.hash === `#${hash}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    closeMobileMenu();
    requestAnimationFrame(() => {
      if (['how-it-works', 'questions'].includes(hash)) {
        $(`#${hash}`).scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      if (changed) {
        const heading = $(`#${nextView}-view h1`);
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }

  function openDialog(dialog) {
    dialogTrigger = document.activeElement;
    $$('dialog[open]').forEach((other) => other.close());
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }

  function openInfo(title, content, eyebrow = 'A little clarity') {
    $('#info-content').innerHTML = `${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}<h2 id="info-title">${title}</h2>${content}`;
    openDialog($('#info-dialog'));
  }

  function renderGuide() {
    const step = steps[guideStep];
    $('#guide-content').innerHTML = `<div class="guide-header"><span class="eyebrow">Your welcome walkthrough · ${guideStep + 1} of 4</span><h2 id="guide-title">A process you can follow.</h2></div><div class="guide-body"><div class="guide-visual" style='--panel-photo:${stepPhoto(guideStep)}'><div class="demo-ui">${step.ui}</div><span class="example-label" style="align-self:flex-start;margin-top:14px">Illustrative preview</span></div><div class="guide-copy"><span class="eyebrow">${step.intro}</span><h3>${step.title}</h3><p>${step.description}</p><p class="your-part">${step.action}</p></div></div><div class="guide-footer"><div class="guide-dots" aria-label="Walkthrough pages">${steps.map((_, i) => `<button class="${guideStep === i ? 'active' : ''}" data-guide-page="${i}" aria-label="Step ${i + 1}" ${guideStep === i ? 'aria-current="step"' : ''}></button>`).join('')}</div><div class="guide-controls">${guideStep > 0 ? '<button class="text-button" data-guide-previous>← Back</button>' : ''}<button class="button" data-guide-next>${guideStep === 3 ? 'Finish walkthrough' : 'Next step'} ${icon('arrow')}</button></div></div>`;
  }

  function openGuide(index = 0) {
    guideStep = Number.isInteger(index) && index >= 0 && index < 4 ? index : 0;
    const videoUrl = safeUrl(activeView === 'welcome' ? config.welcomeVideoUrl : config.overviewVideoUrl);
    if (videoUrl) {
      $('#guide-content').innerHTML = '<div class="guide-header"><span class="eyebrow">Get to know CreditPulse</span><h2 id="guide-title">Your next steps, explained.</h2></div><div class="video-wrap"><video class="guide-video" controls playsinline preload="metadata"></video><button class="text-link" data-text-guide style="margin-top:18px">Read the step-by-step guide instead</button></div>';
      $('.guide-video').src = videoUrl;
    } else renderGuide();
    openDialog($('#guide-dialog'));
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        tasks.forEach((key) => { progress[key] = saved[key] === true; });
      }
    } catch {
      progress = {};
      try { localStorage.removeItem(storageKey); } catch { storageAvailable = false; }
    }
  }

  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
    catch {
      storageAvailable = false;
      $('#storage-message').hidden = false;
      $('#storage-message').textContent = 'Your browser is blocking saved progress. The checklist will work for this session.';
    }
  }

  function renderProgress() {
    let complete = 0;
    tasks.forEach((key) => {
      const checked = progress[key] === true;
      const input = $(`[data-task="${key}"]`);
      input.checked = checked;
      input.closest('.onboarding-task').classList.toggle('done', checked);
      if (checked) complete += 1;
    });
    $('#progress-count').textContent = `${complete}/4`;
    $('#progress-circle').style.strokeDashoffset = String(320.442 * (1 - complete / 4));
    $('#checklist-status').textContent = complete === 4 ? 'You’re ready for the next step.' : complete === 0 ? 'Let’s begin.' : `${complete} of 4 complete`;
    if (!storageAvailable) {
      $('#storage-message').hidden = false;
      $('#storage-message').textContent = 'Progress is kept for this page session only.';
    }
  }

  function policy(kind) {
    const target = safeUrl(kind === 'privacy' ? config.privacyUrl : config.termsUrl);
    if (target) { window.open(target, '_blank', 'noopener,noreferrer'); return; }
    if (kind === 'privacy') {
      openInfo('About this preview’s data', '<p>This preview does not create an account or send your form entries to a signup service. Name and email entries remain in the current page session. No payment card or credit report data is collected here.</p><p>The welcome checklist saves only task completion on this device. Use “Reset checklist progress” to clear it. Hosting services and external fonts may process ordinary connection data.</p><p>A final privacy policy explaining the live service’s data processing must be supplied before customer signup is enabled.</p>', 'Preview information');
    } else {
      openInfo('Know what you’re joining', '<p>The proposed CreditPulse membership is <strong>$19.97 CAD every 14 days</strong>. The preview includes a walkthrough of report findings, letter review and case tracking.</p><p>No payment is taken and no subscription is created by this preview. Before live signup, the full terms must state the final tax-inclusive total, renewal schedule, cancellation process, refund policy and any minimum commitment.</p><p>Results vary. No specific credit score increase, deletion or dispute outcome is guaranteed.</p>', 'Membership information');
    }
  }

  function showPortal() {
    const target = safeUrl(config.dashboardUrl);
    if (target) { window.location.assign(target); return; }
    openInfo('Your client portal is next.', '<p>The client portal is where you upload your reports, review findings, approve letters and follow your case.</p><p>The existing app’s sign-in address hasn’t been connected to this website yet. Your preview checklist will remain here when you return.</p><button class="button" data-close-info>Return to my next step</button>', '');
  }

  function help() {
    openInfo('Let’s find your next step.', '<p>Start with the walkthrough for an overview, or use the preparation guide to get your reports ready. Your credit documents belong in the authenticated client portal.</p><button class="button" data-help-guide>Open the program walkthrough</button><p id="support-contact">A support contact will be available here when the live service is connected.</p>', 'A little help');
    if (typeof config.supportEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail)) {
      const link = document.createElement('a');
      link.href = `mailto:${encodeURIComponent(config.supportEmail)}`;
      link.textContent = config.supportEmail;
      link.className = 'text-link';
      $('#support-contact').replaceChildren(link);
    }
  }

  function reports() {
    openInfo('Get your reports ready.', '<p>Start with the Government of Canada’s instructions for obtaining your free consumer reports from Equifax and TransUnion.</p><ul><li>Follow the links to each bureau and its identity-verification process.</li><li>Download or print your complete reports. Keep a copy for your records.</li><li>In your authenticated CreditPulse portal, follow the upload instructions for each bureau.</li></ul><a class="button" href="https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/order-credit-report.html" target="_blank" rel="noopener noreferrer">Official report instructions ↗</a><p>Source: Financial Consumer Agency of Canada. This checklist does not upload or send your reports.</p>', 'Prepare · step 03');
  }

  function permissions() {
    openInfo('Understand before you agree.', '<p>Your client portal includes permissions for AI processing, authorisation to dispute and electronic consent. Read each agreement in full before signing.</p><ul><li><strong>AI processing:</strong> understand what information is analysed and how it is used.</li><li><strong>Dispute authorisation:</strong> understand what actions you are authorising and who will carry them out.</li><li><strong>Electronic consent:</strong> understand the use of electronic signatures and records.</li></ul><p>Checking a welcome task here only records that you reviewed this overview. It does not sign an agreement or authorise a dispute.</p>', 'Understand · step 02');
  }

  function documents() {
    openInfo('A little preparation helps.', '<p>Your authenticated portal explains which documents it needs. Follow those specific instructions when preparing your files.</p><ul><li>The accepted proof of identity listed in your portal.</li><li>The accepted proof of your current address.</li><li>Relevant statements or records that help you check a finding.</li><li>Any response letters you receive from a credit bureau.</li></ul><p>Make sure each file is readable and complete. Keep private documents on your own device until you’re in the authenticated upload area.</p>', 'Prepare · step 04');
  }

  // Checkout progress: the track fills as the details are completed, then moves on at review.
  function updateCheckoutProgress(stage = 'details') {
    const track = $('.checkout-progress');
    if (!track) return;
    let fill = 0.5;
    if (stage === 'details') {
      const form = $('#membership-form');
      const checks = [
        form.elements.namedItem('firstName').value.trim() !== '',
        form.elements.namedItem('lastName').value.trim() !== '',
        form.elements.namedItem('email').value.trim() !== '' && form.elements.namedItem('email').validity.valid,
        $('#preview-consent').checked
      ];
      fill = (checks.filter(Boolean).length / checks.length) * 0.5;
    }
    track.style.setProperty('--fill', fill);
    $('#checkout-step-details').classList.toggle('done', stage === 'review');
  }

  $('#membership-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    ['firstName', 'lastName'].forEach((name) => {
      const input = form.elements.namedItem(name);
      input.setCustomValidity(input.value.trim() ? '' : 'Please enter a name, or use the sample details.');
    });
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    $('#review-name').textContent = `${String(formData.get('firstName')).trim()} ${String(formData.get('lastName')).trim()}`;
    $('#review-email').textContent = String(formData.get('email')).trim();
    $('#checkout-details').hidden = true;
    $('#checkout-review').hidden = false;
    $('#checkout-step-details').classList.remove('current');
    $('#checkout-step-review').classList.add('current');
    updateCheckoutProgress('review');
    const heading = $('#checkout-review h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    $('#checkout-review').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $$('#membership-form input').forEach((input) => {
    input.addEventListener('input', () => { input.setCustomValidity(''); updateCheckoutProgress(); });
    input.addEventListener('change', () => updateCheckoutProgress());
    input.addEventListener('blur', () => input.classList.add('touched'));
  });
  $('#use-sample').addEventListener('click', () => {
    const form = $('#membership-form');
    form.elements.namedItem('firstName').value = 'Alex';
    form.elements.namedItem('lastName').value = 'Taylor';
    form.elements.namedItem('email').value = 'alex@example.com';
    $$('#membership-form input').forEach((input) => input.setCustomValidity(''));
    updateCheckoutProgress();
    $('#preview-consent').focus();
    toast('Sample details added. Review the preview notice to continue.');
  });
  $('#edit-details').addEventListener('click', () => {
    $('#checkout-details').hidden = false;
    $('#checkout-review').hidden = true;
    $('#checkout-step-details').classList.add('current');
    $('#checkout-step-review').classList.remove('current');
    updateCheckoutProgress();
    $('#first-name').focus();
  });
  $('#finish-preview').addEventListener('click', () => {
    location.hash = 'welcome';
    toast('Welcome to the guide. No membership or payment was created.');
  });
  $('.menu-button').addEventListener('click', (event) => {
    const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
    event.currentTarget.setAttribute('aria-expanded', String(!expanded));
    event.currentTarget.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    $('#mobile-nav').hidden = expanded;
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMobileMenu(); });
  $$('.process-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectStep(Number(tab.dataset.step)));
    tab.addEventListener('keydown', (event) => {
      const current = Number(tab.dataset.step);
      const index = { ArrowDown: (current + 1) % 4, ArrowUp: (current + 3) % 4, Home: 0, End: 3 }[event.key];
      if (index !== undefined) { event.preventDefault(); selectStep(index, true); }
    });
  });
  // Home step cards open the matching step in "How it works".
  $$('[data-step-link]').forEach((card) => card.addEventListener('click', (event) => {
    event.preventDefault();
    selectStep(Number(card.dataset.stepLink));
    $('#how-it-works').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
  // Until a step photo is added to assets/steps, the card shows its icon instead.
  $$('.step-media img').forEach((img) => {
    const hide = () => { img.hidden = true; };
    if (img.complete && !img.naturalWidth) hide();
    else img.addEventListener('error', hide);
    img.addEventListener('load', () => img.closest('.step-media').classList.add('has-photo'));
    if (img.complete && img.naturalWidth) img.closest('.step-media').classList.add('has-photo');
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-guide')) openGuide(Number(button.dataset.guide));
    else if (button.hasAttribute('data-guide-page')) { guideStep = Number(button.dataset.guidePage); renderGuide(); $('[data-guide-next]').focus(); }
    else if (button.hasAttribute('data-guide-previous')) { guideStep = Math.max(0, guideStep - 1); renderGuide(); $('[data-guide-next]').focus(); }
    else if (button.hasAttribute('data-guide-next')) {
      if (guideStep < 3) { guideStep += 1; renderGuide(); $('[data-guide-next]').focus(); }
      else {
        progress.orientation = true;
        saveProgress();
        renderProgress();
        $('#guide-dialog').close();
        toast('Walkthrough complete. Your first step is checked off.');
      }
    } else if (button.hasAttribute('data-text-guide')) { guideStep = 0; renderGuide(); $('[data-guide-next]').focus(); }
    else if (button.hasAttribute('data-policy')) policy(button.dataset.policy);
    else if (button.hasAttribute('data-help')) help();
    else if (button.hasAttribute('data-help-guide')) { $('#info-dialog').close(); openGuide(0); }
    else if (button.hasAttribute('data-permissions')) permissions();
    else if (button.hasAttribute('data-reports')) reports();
    else if (button.hasAttribute('data-documents')) documents();
    else if (button.hasAttribute('data-close-info')) $('#info-dialog').close();
    else if (button.classList.contains('dashboard-link')) showPortal();
    else if (button.classList.contains('dialog-close')) button.closest('dialog').close();
  });
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      const video = $('video', dialog);
      if (video) video.pause();
      if (!document.querySelector('dialog[open]')) {
        document.body.style.overflow = '';
        if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
      }
    });
  });
  $$('[data-task]').forEach((input) => input.addEventListener('change', () => {
    progress[input.dataset.task] = input.checked;
    saveProgress();
    renderProgress();
  }));
  $('#reset-progress').addEventListener('click', () => {
    progress = {};
    try { localStorage.removeItem(storageKey); } catch { storageAvailable = false; }
    renderProgress();
    toast('Your checklist has been reset.');
  });
  // Enable external handoffs only when a safe, explicit destination has been supplied.
  const checkoutUrl = safeUrl(config.checkoutUrl);
  if (checkoutUrl && config.previewMode === false) {
    const link = $('#hosted-checkout');
    link.href = checkoutUrl;
    link.hidden = false;
  }
  // Gentle fade-up for sections marked .reveal as they scroll into view.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && revealItems.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  }
  // Pricing card: a soft light follows the pointer on devices that hover.
  const pricingCard = $('.pricing-card');
  if (pricingCard && window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    pricingCard.addEventListener('pointermove', (event) => {
      const rect = pricingCard.getBoundingClientRect();
      pricingCard.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      pricingCard.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  }
  window.addEventListener('hashchange', navigate);
  window.addEventListener('storage', (event) => { if (event.key === storageKey) { readProgress(); renderProgress(); } });
  $('#copyright-year').textContent = String(new Date().getFullYear());
  readProgress();
  renderProgress();
  selectStep(0);
  navigate();
})();
