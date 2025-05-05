<!-- Interactive Chat Widget for n8n -->
<script>
(function() {
    // Initialize widget only once
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    // Load Poppins font
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    // Core styles (same as before)…
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        /* … all your existing CSS … */
    `;
    document.head.appendChild(widgetStyles);

    // Default configuration
    const defaultSettings = {
        webhook: { url: '', route: '' },
        branding: {
            logo: '', name: '', welcomeText: '', responseTimeText: '',
            poweredBy: { text: 'Powered by Alae', link: 'https://n8n.partnerlinks.io/fabimarkl' }
        },
        style: {
            primaryColor: '#10b981', secondaryColor: '#059669',
            position: 'right', backgroundColor: '#ffffff', fontColor: '#1f2937'
        },
        suggestedQuestions: []
    };

    // Merge user settings
    const settings = window.ChatWidgetConfig
        ? {
            webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
            style: {
                ...defaultSettings.style,
                ...window.ChatWidgetConfig.style,
                primaryColor: window.ChatWidgetConfig.style?.primaryColor || defaultSettings.style.primaryColor,
                secondaryColor: window.ChatWidgetConfig.style?.secondaryColor || defaultSettings.style.secondaryColor
            },
            suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || []
        }
        : defaultSettings;

    let conversationId = '';
    let isWaitingForResponse = false;

    // Build DOM
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // ——— UPDATED registration form HTML ———
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
                    <input type="text" id="chat-user-name" class="form-input" placeholder="Your name" required>
                    <div class="error-text" id="name-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-email">Email</label>
                    <input type="email" id="chat-user-email" class="form-input" placeholder="Your email address" required>
                    <div class="error-text" id="email-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-phone">Phone</label>
                    <input type="tel" id="chat-user-phone" class="form-input" placeholder="Your phone number" required>
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
                <textarea class="chat-textarea" placeholder="Type your message here..."></textarea>
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

    // ——— Query the new inputs ———
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
        // reset errors
        [nameError, emailError, phoneError].forEach(el => el.textContent = '');
        [nameInput, emailInput, phoneInput].forEach(el => el.classList.remove('error'));

        const name  = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        let isValid = true;

        if (!name)  { nameError.textContent = 'Please enter your name'; nameInput.classList.add('error'); isValid = false; }
        if (!email) { emailError.textContent = 'Please enter your email'; emailInput.classList.add('error'); isValid = false; }
        else if (!isValidEmail(email)) {
            emailError.textContent = 'Please enter a valid email'; emailInput.classList.add('error'); isValid = false;
        }
        if (!phone) { phoneError.textContent = 'Please enter your phone'; phoneInput.classList.add('error'); isValid = false; }

        if (!isValid) return;

        conversationId = createSessionId();
        userRegistration.classList.remove('active');
        chatBody.classList.add('active');

        // Show typing indicator
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesContainer.appendChild(typing);

        // Send load session + user info
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
            await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionPayload)
            });
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

        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user-bubble';
        userBubble.textContent = text;
        messagesContainer.appendChild(userBubble);

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

    // Event wiring
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
    launchButton.addEventListener('click', () => {
        chatWindow.classList.toggle('visible');
    });
    chatWindow.querySelectorAll('.chat-close-btn').forEach(btn =>
        btn.addEventListener('click', () => chatWindow.classList.remove('visible'))
    );
})();
</script>
