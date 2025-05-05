<script>
(function() {
  if (window.N8nChatWidgetLoaded) return;
  window.N8nChatWidgetLoaded = true;

  // ── Your translations (fill in your text) ──
  const translations = {
    en: {
      chooseLang: 'Choose your language',
      nameLabel:  'Name',
      placeholderName:  'Your name',
      emailLabel: 'Email',
      placeholderEmail: 'Your email',
      phoneLabel: 'Phone',
      placeholderPhone: 'Your phone number',
      continueBtn: 'Continue'
    },
    fr: {
      chooseLang: 'Choisissez votre langue',
      nameLabel:  'Nom',
      placeholderName:  'Votre nom',
      emailLabel: 'Email',
      placeholderEmail: 'Votre email',
      phoneLabel: 'Téléphone',
      placeholderPhone: 'Votre numéro',
      continueBtn: 'Continuer'
    },
    ar: {
      chooseLang: 'اختر لغتك',
      nameLabel:  'الاسم',
      placeholderName:  'اسمك',
      emailLabel: 'البريد الإلكتروني',
      placeholderEmail: 'بريدك الإلكتروني',
      phoneLabel: 'الهاتف',
      placeholderPhone: 'رقم هاتفك',
      continueBtn: 'متابعة'
    }
  };
  let currentLang = null;

  // ── Language picker screen ──
  const languagePickerHTML = `
    <div class="language-picker" style="text-align:center; padding:24px;">
      <h2>${translations.en.chooseLang}</h2>
      <button class="lang-btn" data-lang="ar">العربية</button>
      <button class="lang-btn" data-lang="fr">Français</button>
      <button class="lang-btn" data-lang="en">English</button>
    </div>
  `;

  // ── Registration form HTML (per-language) ──
  function registrationFormHTML() {
    const t = translations[currentLang];
    return `
      <div class="user-registration" style="padding:24px;">
        <h2 class="registration-title">${t.chooseLang}</h2>
        <form class="registration-form" style="display:flex; flex-direction:column; gap:12px;">
          <label>${t.nameLabel}<input type="text" id="chat-user-name" placeholder="${t.placeholderName}" required></label>
          <label>${t.emailLabel}<input type="email" id="chat-user-email" placeholder="${t.placeholderEmail}" required></label>
          <label>${t.phoneLabel}<input type="tel" id="chat-user-phone" placeholder="${t.placeholderPhone}" required></label>
          <button type="submit" class="submit-registration">${t.continueBtn}</button>
        </form>
      </div>
    `;
  }

  // ── After reg-form is in DOM, hook up its handlers ──
  function bindRegistrationHandlers() {
    const startChatButton  = chatWindow.querySelector('.chat-start-btn');
    const registrationForm = chatWindow.querySelector('.registration-form');

    if (startChatButton) {
      startChatButton.addEventListener('click', showRegistrationForm);
    }
    if (registrationForm) {
      registrationForm.addEventListener('submit', handleRegistration);
    }

    // Now bind chat controls
    const sendButton      = chatWindow.querySelector('.chat-submit');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');

    if (sendButton && messageTextarea) {
      sendButton.addEventListener('click', () => {
        const text = messageTextarea.value.trim();
        if (text && !isWaitingForResponse) {
          submitMessage(text);
          messageTextarea.value = '';
          autoResizeTextarea();
        }
      });
      messageTextarea.addEventListener('input', autoResizeTextarea);
      messageTextarea.addEventListener('keypress', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          const txt = messageTextarea.value.trim();
          if (txt && !isWaitingForResponse) {
            submitMessage(txt);
            messageTextarea.value = '';
            autoResizeTextarea();
          }
        }
      });
    }
  }

  // ── Inject Poppins font ──
  const fontLink = document.createElement('link');
  fontLink.rel  = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
  document.head.appendChild(fontLink);

  // ── Inject widget CSS ──
  const style = document.createElement('style');
  style.textContent = `
    .chat-assist-widget {
      --chat-color-primary: var(--chat-widget-primary, #10b981);
      --chat-color-secondary: var(--chat-widget-secondary, #059669);
      --chat-color-tertiary: var(--chat-widget-tertiary, #047857);
      --chat-color-light: var(--chat-widget-light, #d1fae5);
      --chat-color-surface: var(--chat-widget-surface, #ffffff);
      --chat-color-text: var(--chat-widget-text, #1f2937);
      --chat-color-text-light: var(--chat-widget-text-light, #6b7280);
      --chat-color-border: var(--chat-widget-border, #e5e7eb);
      --chat-shadow-sm: 0 1px 3px rgba(16, 185, 129, 0.1);
      --chat-shadow-md: 0 4px 6px rgba(16, 185, 129, 0.15);
      --chat-shadow-lg: 0 10px 15px rgba(16, 185, 129, 0.2);
      --chat-radius-sm: 8px;
      --chat-radius-md: 12px;
      --chat-radius-lg: 20px;
      --chat-radius-full: 9999px;
      --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Poppins', sans-serif;
    }
    .chat-assist-widget .chat-window {
      position: fixed;
      bottom: 90px;
      z-index: 1000;
      width: 380px;
      height: 580px;
      background: var(--chat-color-surface);
      border-radius: var(--chat-radius-lg);
      box-shadow: var(--chat-shadow-lg);
      border: 1px solid var(--chat-color-light);
      overflow: hidden;
      display: none;
      flex-direction: column;
      transition: var(--chat-transition);
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    .chat-assist-widget .chat-window.visible {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .chat-assist-widget .chat-window.right-side { right: 20px; }
    .chat-assist-widget .chat-window.left-side  { left: 20px; }
    .chat-assist-widget .chat-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
      color: white;
      position: relative;
    }
    .chat-assist-widget .chat-header-logo {
      width: 32px; height: 32px;
      border-radius: var(--chat-radius-sm);
      background: white; padding: 4px;
      object-fit: contain;
    }
    .chat-assist-widget .chat-header-title { font-size:16px; font-weight:600; }
    .chat-assist-widget .chat-close-btn {
      position:absolute; right:16px; top:50%;
      transform:translateY(-50%);
      background:rgba(255,255,255,0.2);
      border:none; color:white; cursor:pointer;
      padding:4px; border-radius:9999px;
      width:28px;height:28px; font-size:18px;
      display:flex; align-items:center; justify-content:center;
      transition:var(--chat-transition);
    }
    .chat-assist-widget .chat-close-btn:hover {
      background:rgba(255,255,255,0.3);
      transform:translateY(-50%) scale(1.1);
    }
    .chat-assist-widget .chat-welcome {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      padding:24px; text-align:center; width:100%; max-width:320px;
    }
    .chat-assist-widget .chat-welcome-title {
      font-size:22px; font-weight:700; margin-bottom:24px;
      color:var(--chat-color-text);
    }
    .chat-assist-widget .chat-start-btn {
      display:flex; align-items:center; justify-content:center; gap:10px;
      width:100%; padding:14px 20px;
      background:linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
      color:white; border:none; border-radius:var(--chat-radius-md);
      font-size:15px; font-weight:600; cursor:pointer;
      transition:var(--chat-transition); box-shadow:var(--chat-shadow-md);
    }
    .chat-assist-widget .chat-start-btn:hover {
      transform:translateY(-2px); box-shadow:var(--chat-shadow-lg);
    }
    .chat-assist-widget .chat-response-time {
      font-size:14px; color:var(--chat-color-text-light); margin:0;
    }
    .chat-assist-widget .chat-body {
      display:none; flex-direction:column; height:100%;
    }
    .chat-assist-widget .chat-body.active { display:flex; }
    .chat-assist-widget .chat-messages {
      flex:1; overflow-y:auto; padding:20px;
      background:#f9fafb; display:flex; flex-direction:column; gap:12px;
    }
    .chat-assist-widget .chat-messages::-webkit-scrollbar { width:6px; }
    .chat-assist-widget .chat-messages::-webkit-scrollbar-track { background:transparent; }
    .chat-assist-widget .chat-messages::-webkit-scrollbar-thumb {
      background-color:rgba(16,185,129,0.3); border-radius:9999px;
    }
    .chat-assist-widget .chat-bubble {
      padding:14px 18px; border-radius:var(--chat-radius-md);
      max-width:85%; word-wrap:break-word; font-size:14px;
      line-height:1.6; position:relative; white-space:pre-line;
    }
    .chat-assist-widget .chat-bubble.user-bubble {
      background:linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
      color:white; align-self:flex-end; border-bottom-right-radius:4px;
      box-shadow:var(--chat-shadow-sm);
    }
    .chat-assist-widget .chat-bubble.bot-bubble {
      background:white; color:var(--chat-color-text);
      align-self:flex-start; border-bottom-left-radius:4px;
      box-shadow:var(--chat-shadow-sm); border:1px solid var(--chat-color-light);
    }
    .chat-assist-widget .typing-indicator {
      display:flex; align-items:center; gap:4px;
      padding:14px 18px; background:white; border-radius:var(--chat-radius-md);
      border-bottom-left-radius:4px; max-width:80px; align-self:flex-start;
      box-shadow:var(--chat-shadow-sm); border:1px solid var(--chat-color-light);
    }
    .chat-assist-widget .typing-dot {
      width:8px; height:8px; background:var(--chat-color-primary);
      border-radius:9999px; opacity:0.7;
      animation:typingAnimation 1.4s infinite ease-in-out;
    }
    .chat-assist-widget .typing-dot:nth-child(2){animation-delay:0.2s;}
    .chat-assist-widget .typing-dot:nth-child(3){animation-delay:0.4s;}
    @keyframes typingAnimation {
      0%,60%,100%{transform:translateY(0);}
      30%{transform:translateY(-4px);}
    }
    .chat-assist-widget .chat-controls {
      padding:16px; background:var(--chat-color-surface);
      border-top:1px solid var(--chat-color-light);
      display:flex; gap:10px;
    }
    .chat-assist-widget .chat-textarea {
      flex:1; padding:14px 16px;
      border:1px solid var(--chat-color-light);
      border-radius:var(--chat-radius-md); background:var(--chat-color-surface);
      color:var(--chat-color-text); resize:none; font-family:inherit;
      font-size:14px; line-height:1.5; max-height:120px; min-height:48px;
      transition:var(--chat-transition);
    }
    .chat-assist-widget .chat-textarea:focus {
      outline:none; border-color:var(--chat-color-primary);
      box-shadow:0 0 0 3px rgba(16,185,129,0.2);
    }
    .chat-assist-widget .chat-textarea::placeholder {
      color:var(--chat-color-text-light);
    }
    .chat-assist-widget .chat-submit {
      background:linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
      color:white; border:none; border-radius:var(--chat-radius-md);
      width:48px; height:48px; cursor:pointer; transition:var(--chat-transition);
      display:flex; align-items:center; justify-content:center;
      box-shadow:var(--chat-shadow-sm);
    }
    .chat-assist-widget .chat-submit:hover {
      transform:scale(1.05); box-shadow:var(--chat-shadow-md);
    }
    .chat-assist-widget .chat-launcher {
      position:fixed; bottom:20px; border-radius:9999px;
      background:linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
      color:white; border:none; cursor:pointer; box-shadow:var(--chat-shadow-md);
      z-index:999; transition:var(--chat-transition);
      display:flex; align-items:center; padding:0 20px 0 16px; gap:8px;
    }
    .chat-assist-widget .chat-launcher.right-side { right:20px; }
    .chat-assist-widget .chat-launcher.left-side  { left:20px; }
    .chat-assist-widget .chat-launcher-text {
      font-weight:600; font-size:15px; white-space:nowrap;
    }
    .chat-assist-widget .chat-footer {
      padding:10px; text-align:center;
      background:var(--chat-color-surface);
      border-top:1px solid var(--chat-color-light);
    }
    .chat-assist-widget .chat-footer-link {
      color:var(--chat-color-primary);
      text-decoration:none; font-size:12px; opacity:0.8;
      transition:var(--chat-transition);
    }
    .chat-assist-widget .chat-footer-link:hover { opacity:1; }
    .chat-assist-widget .suggested-questions {
      display:flex; flex-direction:column; gap:8px;
      margin:12px 0; align-self:flex-start; max-width:85%;
    }
    .chat-assist-widget .suggested-question-btn {
      background:#f3f4f6; border:1px solid var(--chat-color-light);
      border-radius:var(--chat-radius-md); padding:10px 14px;
      text-align:left; font-size:13px; cursor:pointer;
      transition:var(--chat-transition); line-height:1.4;
    }
    .chat-assist-widget .suggested-question-btn:hover {
      background:var(--chat-color-light);
      border-color:var(--chat-color-primary);
    }
    .chat-assist-widget .chat-link {
      color:var(--chat-color-primary);
      text-decoration:underline; word-break:break-all;
      transition:var(--chat-transition);
    }
    .chat-assist-widget .chat-link:hover {
      color:var(--chat-color-secondary);
    }
    .chat-assist-widget .user-registration {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      padding:24px; text-align:center;
      width:100%; max-width:320px; display:none;
    }
    .chat-assist-widget .user-registration.active { display:block; }
    .chat-assist-widget .registration-title {
      font-size:18px; font-weight:600; margin-bottom:16px;
      color:var(--chat-color-text);
    }
    .chat-assist-widget .registration-form {
      display:flex; flex-direction:column; gap:12px; margin-bottom:16px;
    }
    .chat-assist-widget .form-field {
      display:flex; flex-direction:column; gap:4px; text-align:left;
    }
    .chat-assist-widget .form-label {
      font-size:14px; font-weight:500; color:var(--chat-color-text);
    }
    .chat-assist-widget .form-input {
      padding:12px 14px; border:1px solid var(--chat-color-border);
      border-radius:var(--chat-radius-md); font-family:inherit;
      font-size:14px; transition:var(--chat-transition);
    }
    .chat-assist-widget .form-input:focus {
      outline:none; border-color:var(--chat-color-primary);
      box-shadow:0 0 0 3px rgba(16,185,129,0.2);
    }
    .chat-assist-widget .form-input.error {
      border-color:#ef4444;
    }
    .chat-assist-widget .error-text {
      font-size:12px; color:#ef4444; margin-top:2px;
    }
    .chat-assist-widget .submit-registration {
      display:flex; align-items:center; justify-content:center;
      width:100%; padding:14px 20px;
      background:linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
      color:white; border:none; border-radius:var(--chat-radius-md);
      cursor:pointer; font-size:15px; font-weight:600;
      transition:var(--chat-transition); box-shadow:var(--chat-shadow-md);
    }
    .chat-assist-widget .submit-registration:hover {
      transform:translateY(-2px); box-shadow:var(--chat-shadow-lg);
    }
    .chat-assist-widget .submit-registration:disabled {
      opacity:0.7; cursor:not-allowed; transform:none;
    }
  `;
  document.head.appendChild(style);

  // ── Default & merged settings ──
  const defaultSettings = {
    webhook:   { url: '', route: '' },
    branding:  {
      logo:'', name:'', welcomeText:'', responseTimeText:'',
      poweredBy:{ text:'Powered by Picsellsstudio', link:'https://picsellsstudio.com/' }
    },
    style:     {
      primaryColor:'#10b981', secondaryColor:'#059669',
      position:'right', backgroundColor:'#ffffff', fontColor:'#1f2937'
    },
    suggestedQuestions:[]
  };
  const settings = window.ChatWidgetConfig
    ? {
        webhook:   {...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook},
        branding:  {...defaultSettings.branding, ...window.ChatWidgetConfig.branding},
        style:     {
          ...defaultSettings.style,
          ...window.ChatWidgetConfig.style,
          primaryColor: window.ChatWidgetConfig.style?.primaryColor === '#854fff'
            ? '#10b981'
            : (window.ChatWidgetConfig.style?.primaryColor || '#10b981'),
          secondaryColor: window.ChatWidgetConfig.style?.secondaryColor === '#6b3fd4'
            ? '#059669'
            : (window.ChatWidgetConfig.style?.secondaryColor || '#059669')
        },
        suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || []
      }
    : defaultSettings;

  // ── Session state ──
  let conversationId = '';
  let isWaitingForResponse = false;

  // ── Build widget DOM ──
  const widgetRoot = document.createElement('div');
  widgetRoot.className = 'chat-assist-widget';
  Object.entries({
    '--chat-widget-primary': settings.style.primaryColor,
    '--chat-widget-secondary': settings.style.secondaryColor,
    '--chat-widget-surface': settings.style.backgroundColor,
    '--chat-widget-text': settings.style.fontColor
  }).forEach(([prop,val]) => widgetRoot.style.setProperty(prop, val));

  const chatWindow = document.createElement('div');
  chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
  chatWindow.innerHTML = languagePickerHTML;
  widgetRoot.appendChild(chatWindow);
  document.body.appendChild(widgetRoot);

  // ── Single launcher button ──
  const launchButton = document.createElement('button');
  launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
  launchButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8
               8.5 8.5 0 0 1-7.6 4.7
               8.38 8.38 0 0 1-3.8-.9
               L3 21l1.9-5.7
               a8.38 8.38 0 0 1-.9-3.8
               8.5 8.5 0 0 1 4.7-7.6
               8.38 8.38 0 0 1 3.8-.9
               h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    <span class="chat-launcher-text">Need help?</span>
  `;
  widgetRoot.appendChild(launchButton);
  launchButton.addEventListener('click', () => {
    chatWindow.classList.toggle('visible');
  });

  // ── Common helpers ──
  function createSessionId() {
    return crypto.randomUUID();
  }
  function createTypingIndicator() {
    const d = document.createElement('div');
    d.className = 'typing-indicator';
    d.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    return d;
  }
  function linkifyText(text) {
    return text.replace(
      /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
      url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`
    );
  }
  function autoResizeTextarea() {
    const ta = chatWindow.querySelector('.chat-textarea');
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function showRegistrationForm() {
    chatWindow.querySelector('.chat-welcome').style.display = 'none';
    chatWindow.querySelector('.user-registration').classList.add('active');
  }

  // ── Registration handler ──
  async function handleRegistration(ev) {
    ev.preventDefault();
    const nameInputEl  = chatWindow.querySelector('#chat-user-name');
    const emailInputEl = chatWindow.querySelector('#chat-user-email');
    const phoneInputEl = chatWindow.querySelector('#chat-user-phone');
    const nameErrorEl  = chatWindow.querySelector('#name-error');
    const emailErrorEl = chatWindow.querySelector('#email-error');
    const phoneErrorEl = chatWindow.querySelector('#phone-error');
    const chatBodyEl   = chatWindow.querySelector('.chat-body');
    const msgsEl       = chatWindow.querySelector('.chat-messages');

    nameErrorEl.textContent = '';
    emailErrorEl.textContent = '';
    phoneErrorEl.textContent = '';

    const name  = nameInputEl.value.trim();
    const email = emailInputEl.value.trim();
    const phone = phoneInputEl.value.trim();
    let ok = true;
    if (!name)  { nameErrorEl.textContent = 'Please enter your name';    nameInputEl.classList.add('error'); ok=false; }
    if (!email) { emailErrorEl.textContent = 'Please enter your email';  emailInputEl.classList.add('error');ok=false; }
    else if (!isValidEmail(email)) {
      emailErrorEl.textContent = 'Please enter a valid email'; emailInputEl.classList.add('error'); ok=false;
    }
    if (!phone){ phoneErrorEl.textContent = 'Please enter your phone'; phoneInputEl.classList.add('error'); ok=false; }
    if (!ok) return;

    // show chat
    chatWindow.querySelector('.user-registration').classList.remove('active');
    chatBodyEl.classList.add('active');

    conversationId = createSessionId();
    // You can fire your loadPreviousSession here…

    // Send user info as first message
    const initial = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`;
    try {
      const typing = createTypingIndicator();
      msgsEl.appendChild(typing);
      msgsEl.scrollTop = msgsEl.scrollHeight;

      // load session
      await fetch(settings.webhook.url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify([{ action:'loadPreviousSession', sessionId:conversationId, route:settings.webhook.route, metadata:{userId:email, userName:name, userPhone:phone}}])
      });

      // send user info
      const resp = await fetch(settings.webhook.url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action:'sendMessage', sessionId:conversationId, route:settings.webhook.route, chatInput:initial, metadata:{userId:email,userName:name,isUserInfo:true}})
      });
      const data = await resp.json();

      msgsEl.removeChild(typing);

      const out = Array.isArray(data)?data[0].output:data.output;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble bot-bubble';
      bubble.innerHTML = linkifyText(out);
      msgsEl.appendChild(bubble);

      // suggested questions
      if (settings.suggestedQuestions.length) {
        const sq = document.createElement('div');
        sq.className = 'suggested-questions';
        settings.suggestedQuestions.forEach(q => {
          const btn = document.createElement('button');
          btn.className = 'suggested-question-btn';
          btn.textContent = q;
          btn.onclick = () => submitMessage(q);
          sq.appendChild(btn);
        });
        msgsEl.appendChild(sq);
      }
      msgsEl.scrollTop = msgsEl.scrollHeight;

    } catch(err) {
      console.error(err);
      const errBubble = document.createElement('div');
      errBubble.className = 'chat-bubble bot-bubble';
      errBubble.textContent = "Sorry, couldn't connect. Please try again later.";
      msgsEl.appendChild(errBubble);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  }

  // ── Sending messages ──
  async function submitMessage(text) {
    if (isWaitingForResponse) return;
    isWaitingForResponse = true;
    const msgsEl = chatWindow.querySelector('.chat-messages');
    const nameEl = chatWindow.querySelector('#chat-user-name');
    const emailEl= chatWindow.querySelector('#chat-user-email');
    const name  = nameEl?nameEl.value.trim(): '';
    const email = emailEl?emailEl.value.trim(): '';

    // user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.textContent = text;
    msgsEl.appendChild(userBubble);
    msgsEl.scrollTop = msgsEl.scrollHeight;

    // typing
    const typing = createTypingIndicator();
    msgsEl.appendChild(typing);
    msgsEl.scrollTop = msgsEl.scrollHeight;

    try {
      const res = await fetch(settings.webhook.url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action:'sendMessage', sessionId:conversationId, route:settings.webhook.route, chatInput:text, metadata:{userId:email,userName:name}})
      });
      const data = await res.json();
      msgsEl.removeChild(typing);
      const out = Array.isArray(data)?data[0].output:data.output;
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble bot-bubble';
      botBubble.innerHTML = linkifyText(out);
      msgsEl.appendChild(botBubble);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch(err) {
      console.error(err);
      msgsEl.removeChild(typing);
      const errB = document.createElement('div');
      errB.className = 'chat-bubble bot-bubble';
      errB.textContent = "Sorry, couldn't send your message. Try again.";
      msgsEl.appendChild(errB);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } finally {
      isWaitingForResponse = false;
    }
  }

  // ── Bind up closes & language pick ──
  chatWindow.addEventListener('click', ev => {
    if (ev.target.classList.contains('chat-close-btn')) {
      chatWindow.classList.remove('visible');
    }
  });
  chatWindow.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      chatWindow.innerHTML = registrationFormHTML() + `
        <div class="chat-body">
          <div class="chat-messages"></div>
          <div class="chat-controls">
            <textarea class="chat-textarea" placeholder="Type your message here..." rows="1"></textarea>
            <button class="chat-submit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </button>
          </div>
          <div class="chat-footer">
            <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
          </div>
        </div>
      `;
      bindRegistrationHandlers();
    });
  });

})();
</script>
