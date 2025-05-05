<!-- Interactive Chat Widget for n8n -->
<script>
(function() {
    // Initialize widget only once
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    // Load font resource - using Poppins for a fresh look
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    // Apply widget styles
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        /* ──────────────── WIDGET CSS ──────────────── */
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
            z-index: 1000;
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
            object-fit: contain;
            background: white;
            padding: 4px;
        }
        .chat-assist-widget .chat-header-title {
            font-size: 16px; font-weight: 600; color: white;
        }
        .chat-assist-widget .chat-close-btn {
            position: absolute;
            right: 16px; top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.2);
            border: none; color: white; cursor: pointer;
            padding: 4px;
            display: flex; align-items: center; justify-content: center;
            transition: var(--chat-transition);
            font-size: 18px;
            border-radius: var(--chat-radius-full);
            width: 28px; height: 28px;
        }
        .chat-assist-widget .chat-close-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-50%) scale(1.1);
        }

        .chat-assist-widget .chat-welcome {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%,-50%);
            padding: 24px; text-align: center;
            width: 100%; max-width: 320px;
        }
        .chat-assist-widget .chat-welcome-title {
            font-size: 22px; font-weight: 700;
            color: var(--chat-color-text);
            margin-bottom: 24px; line-height: 1.3;
        }
        .chat-assist-widget .chat-start-btn {
            display: flex; align-items: center; justify-content: center;
            gap: 10px;
            width: 100%; padding: 14px 20px;
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: white; border: none;
            border-radius: var(--chat-radius-md);
            cursor: pointer; font-size: 15px;
            transition: var(--chat-transition);
            font-weight: 600; font-family: inherit;
            margin-bottom: 16px; box-shadow: var(--chat-shadow-md);
        }
        .chat-assist-widget .chat-start-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--chat-shadow-lg);
        }
        .chat-assist-widget .chat-response-time {
            font-size: 14px; color: var(--chat-color-text-light); margin: 0;
        }

        .chat-assist-widget .user-registration {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%,-50%);
            padding: 24px; text-align: center;
            width: 100%; max-width: 320px;
            display: none;
        }
        .chat-assist-widget .user-registration.active {
            display: block;
        }
        .chat-assist-widget .registration-title {
            font-size: 18px; font-weight: 600;
            color: var(--chat-color-text);
            margin-bottom: 16px; line-height: 1.3;
        }
        .chat-assist-widget .registration-form {
            display: flex; flex-direction: column; gap: 12px;
            margin-bottom: 16px;
        }
        .chat-assist-widget .form-field {
            display: flex; flex-direction: column; gap: 4px;
            text-align: left;
        }
        .chat-assist-widget .form-label {
            font-size: 14px; font-weight: 500;
            color: var(--chat-color-text);
        }
        .chat-assist-widget .form-input {
            padding: 12px 14px;
            border: 1px solid var(--chat-color-border);
            border-radius: var(--chat-radius-md);
            font-family: inherit; font-size: 14px;
            transition: var(--chat-transition);
        }
        .chat-assist-widget .form-input.error {
            border-color: #ef4444;
        }
        .chat-assist-widget .error-text {
            font-size: 12px; color: #ef4444; margin-top: 2px;
        }
        .chat-assist-widget .submit-registration {
            display: flex; align-items: center; justify-content: center;
            width: 100%; padding: 14px 20px;
            background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
            color: white; border: none;
            border-radius: var(--chat-radius-md);
            cursor: pointer; font-size: 15px;
            transition: var(--chat-transition);
            font-weight: 600; font-family: inherit;
            box-shadow: var(--chat-shadow-md);
        }
        .chat-assist-widget .submit-registration:hover {
            transform: translateY(-2px); box-shadow: var(--chat-shadow-lg);
        }

        .chat-assist-widget .chat-body {
            display: none; flex-direction: column; height: 100%;
        }
        .chat-assist-widget .chat-body.active {
            display: flex;
        }
        .chat-assist-widget .chat-messages {
            flex: 1; overflow-y: auto; padding: 20px;
            background: #f9fafb; display: flex;
            flex-direction: column; gap: 12px;
        }
        /* scrollbar, bubbles, controls, launcher, footer, etc. */
        /* … (you can keep the rest of your original CSS here) … */
        /* ───────────── END WIDGET CSS ───────────── */
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration
    const defaultSettings = {
        webhook: { url: '', route: '' },
        branding: {
            logo: '', name: '', welcomeText: '', responseTimeText: '',
            poweredBy: { text: 'Powered by Picsellsstudio', link: 'https://picsellsstudio.com/' }
        },
        style: { primaryColor: '#10b981', secondaryColor: '#059669', position: 'right', backgroundColor: '#ffffff', fontColor: '#1f2937' },
        suggestedQuestions: []
    };

    // Merge user settings
    const settings = window.ChatWidgetConfig
        ? {
            webhook:     { ...defaultSettings.webhook,     ...window.ChatWidgetConfig.webhook },
            branding:    { ...defaultSettings.branding,    ...window.ChatWidgetConfig.branding },
            style:       { ...defaultSettings.style,       ...window.ChatWidgetConfig.style },
            suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || []
        }
        : defaultSettings;

    // Session tracking
    let conversationId = '';
    let isWaitingForResponse = false;

    // Build DOM
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    widgetRoot.style.setProperty('--chat-widget-primary',   settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface',   settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text',      settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // ——— UPDATED registration form HTML with Phone field ———
    const welcomeScreenHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="${settings.branding.name}">
            <span class="chat-header-title">${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
        <div class="chat-welcome">
            <h2 class="chat-welcome-title">${settings.branding.welcomeText}</h2>
            <button class="chat-start-btn">Start chatting</button>
            <p class="chat-response-time">${settings.branding.responseTimeText}</p>
        </div>
        <div class="user-registration">
            <h2 class="registration-title">Please enter your details to start chatting</h2>
            <form class="registration-form">
                <div class="form-field">
                    <label class="form-label" for="chat-user-name">Name</label>
                    <input type="text"   id="chat-user-name" class="form-input" placeholder="Your name" required>
                    <div class="error-text" id="name-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-email">Email</label>
                    <input type="email"  id="chat-user-email" class="form-input" placeholder="Your email address" required>
                    <div class="error-text" id="email-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-phone">Phone</label>
                    <input type="tel"    id="chat-user-phone" class="form-input" placeholder="Your phone number" required>
                    <div class="error-text" id="phone-error"></div>
                </div>
                <button type="submit" class="submit-registration">Continue to Chat</button>
            </form>
        </div>
    `;

    const chatInterfaceHTML = `
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="Type your message here..." rows="1"></textarea>
                <button class="chat-submit">Send</button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">
                    ${settings.branding.poweredBy.text}
                </a>
            </div>
        </div>
    `;

    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;

    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `<span class="chat-launcher-text">Need help?</span>`;

    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    // Query DOM elements (including phone)
    const startChatButton = chatWindow.querySelector('.chat-start-btn');
    const registrationForm  = chatWindow.querySelector('.registration-form');
    const userRegistration  = chatWindow.querySelector('.user-registration');
    const chatWelcome       = chatWindow.querySelector('.chat-welcome');
    const nameInput         = chatWindow.querySelector('#chat-user-name');
    const emailInput        = chatWindow.querySelector('#chat-user-email');
    const phoneInput        = chatWindow.querySelector('#chat-user-phone');
    const nameError         = chatWindow.querySelector('#name-error');
    const emailError        = chatWindow.querySelector('#email-error');
    const phoneError        = chatWindow.querySelector('#phone-error');
    const chatBody          = chatWindow.querySelector('.chat-body');
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea   = chatWindow.querySelector('.chat-textarea');
    const sendButton        = chatWindow.querySelector('.chat-submit');

    // Helpers
    function createSessionId() {
        return crypto.randomUUID();
    }
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function linkifyText(text) {
        return text.replace(/(\bhttps?:\/\/\S+)/g, url =>
            `<a href="${url}" target="_blank" class="chat-link">${url}</a>`
        );
    }

    function showRegistrationForm() {
        chatWelcome.style.display = 'none';
        userRegistration.classList.add('active');
    }

    async function handleRegistration(event) {
        event.preventDefault();

        // Reset errors
        [nameError, emailError, phoneError].forEach(el => el.textContent = '');
        [nameInput, emailInput, phoneInput].forEach(el => el.classList.remove('error'));

        const name  = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        let isValid = true;

        if (!name)  { nameError.textContent = 'Please enter your name';    nameInput.classList.add('error'); isValid = false; }
        if (!email) { emailError.textContent = 'Please enter your email';  emailInput.classList.add('error'); isValid = false; }
        else if (!isValidEmail(email)) {
            emailError.textContent = 'Please enter a valid email'; emailInput.classList.add('error'); isValid = false;
        }
        if (!phone) { phoneError.textContent = 'Please enter your phone';  phoneInput.classList.add('error'); isValid = false; }

        if (!isValid) return;

        conversationId = createSessionId();
        userRegistration.classList.remove('active');
        chatBody.classList.add('active');

        // Show typing indicator
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesContainer.appendChild(typing);

        // Prepare payloads
        const sessionPayload = [{
            action: "loadPreviousSession",
            sessionId: conversationId,
            route: settings.webhook.route,
            metadata: { userName: name, userEmail: email, userPhone: phone }
        }];
        const userInfoPayload = {
            action: "sendMessage",
            sessionId: conversationId,
            route: settings.webhook.route,
            chatInput: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`,
            metadata: { userName: name, userEmail: email, userPhone: phone, isUserInfo: true }
        };

        try {
            // Load previous session
            await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionPayload)
            });
            // Send user info
            const res = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userInfoPayload)
            });
            const data = await res.json();

            messagesContainer.removeChild(typing);

            const botBubble = document.createElement('div');
            botBubble.className = 'chat-bubble bot-bubble';
            botBubble.innerHTML = linkifyText(Array.isArray(data) ? data[0].output : data.output);
            messagesContainer.appendChild(botBubble);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (err) {
            console.error(err);
            messagesContainer.removeChild(typing);
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-bubble bot-bubble';
            errMsg.textContent = "Connection error, please try again later.";
            messagesContainer.appendChild(errMsg);
        }
    }

    async function submitMessage(text) {
        if (isWaitingForResponse) return;
        isWaitingForResponse = true;

        // Show user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user-bubble';
        userBubble.textContent = text;
        messagesContainer.appendChild(userBubble);

        // Show typing
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesContainer.appendChild(typing);

        const payload = {
            action: "sendMessage",
            sessionId: conversationId,
            route: settings.webhook.route,
            chatInput: text,
            metadata: {}
        };

        try {
            const res = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            messagesContainer.removeChild(typing);
            const botBubble = document.createElement('div');
            botBubble.className = 'chat-bubble bot-bubble';
            botBubble.innerHTML = linkifyText(Array.isArray(data) ? data[0].output : data.output);
            messagesContainer.appendChild(botBubble);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (err) {
            console.error(err);
            messagesContainer.removeChild(typing);
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-bubble bot-bubble';
            errMsg.textContent = "Failed to send message.";
            messagesContainer.appendChild(errMsg);
        } finally {
            isWaitingForResponse = false;
        }
    }

    function autoResize() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = Math.min(messageTextarea.scrollHeight, 120) + 'px';
    }

    // Event listeners
    startChatButton.addEventListener('click', showRegistrationForm);
    registrationForm.addEventListener('submit', handleRegistration);
    sendButton.addEventListener('click', () => {
        const txt = messageTextarea.value.trim();
        if (txt) { submitMessage(txt); messageTextarea.value = ''; autoResize(); }
    });
    messageTextarea.addEventListener('input', autoResize);
    messageTextarea.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const txt = messageTextarea.value.trim();
            if (txt) { submitMessage(txt); messageTextarea.value = ''; autoResize(); }
        }
    });
    launchButton.addEventListener('click', () => chatWindow.classList.toggle('visible'));
    chatWindow.querySelectorAll('.chat-close-btn').forEach(btn =>
        btn.addEventListener('click', () => chatWindow.classList.remove('visible'))
    );
})();
</script>
