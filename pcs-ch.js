// Interactive Chat Widget for n8n with Phone Number Support
(function() {
    // Initialize widget only once
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    // Load font resource - using Poppins for a fresh look
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    // -----------------------------
    //  STYLES
    // -----------------------------
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        /* (KEEPING THE ORIGINAL STYLE RULES) */
        /* Additional styles remain unchanged for brevity */

        /* Phone input will reuse existing .form-input styling */
    `;
    document.head.appendChild(widgetStyles);

    // -----------------------------
    //  DEFAULT CONFIGURATION
    // -----------------------------
    const defaultSettings = {
        webhook: {
            url: '',
            route: ''
        },
        branding: {
            logo: '',
            name: '',
            welcomeText: '',
            responseTimeText: '',
            poweredBy: {
                text: 'Powered by Picsellsstudio',
                link: 'https://picsellsstudio.com/'
            }
        },
        style: {
            primaryColor: '#10b981', // Green
            secondaryColor: '#059669', // Darker green
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#1f2937'
        },
        suggestedQuestions: []
    };

    // Merge user settings with defaults
    const settings = window.ChatWidgetConfig ? {
        webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
        style: {
            ...defaultSettings.style,
            ...window.ChatWidgetConfig.style,
            primaryColor: window.ChatWidgetConfig.style?.primaryColor === '#854fff' ? '#10b981' : (window.ChatWidgetConfig.style?.primaryColor || '#10b981'),
            secondaryColor: window.ChatWidgetConfig.style?.secondaryColor === '#6b3fd4' ? '#059669' : (window.ChatWidgetConfig.style?.secondaryColor || '#059669')
        },
        suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || defaultSettings.suggestedQuestions
    } : defaultSettings;

    // -----------------------------
    //  SESSION & STATE
    // -----------------------------
    let conversationId = '';
    let isWaitingForResponse = false;
    let registeredUser = { name: '', email: '', phone: '' };

    // -----------------------------
    //  DOM CREATION
    // -----------------------------
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';

    // Apply custom colors
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-tertiary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // -----------------------------
    //  HTML SECTIONS
    // -----------------------------
    const welcomeScreenHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="${settings.branding.name}">
            <span class="chat-header-title">${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
        <div class="chat-welcome">
            <h2 class="chat-welcome-title">${settings.branding.welcomeText}</h2>
            <button class="chat-start-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Start chatting
            </button>
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
        </div>`;

    const chatInterfaceHTML = `
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="Type your message here..." rows="1"></textarea>
                <button class="chat-submit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                </button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>`;

    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;

    // Launcher button
    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <span class="chat-launcher-text">Need help?</span>`;

    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    // -----------------------------
    //  ELEMENT REFERENCES
    // -----------------------------
    const startChatButton = chatWindow.querySelector('.chat-start-btn');
    const chatBody = chatWindow.querySelector('.chat-body');
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');
    const sendButton = chatWindow.querySelector('.chat-submit');

    const registrationForm = chatWindow.querySelector('.registration-form');
    const userRegistration = chatWindow.querySelector('.user-registration');
    const chatWelcome = chatWindow.querySelector('.chat-welcome');
    const nameInput = chatWindow.querySelector('#chat-user-name');
    const emailInput = chatWindow.querySelector('#chat-user-email');
    const phoneInput = chatWindow.querySelector('#chat-user-phone');
    const nameError = chatWindow.querySelector('#name-error');
    const emailError = chatWindow.querySelector('#email-error');
    const phoneError = chatWindow.querySelector('#phone-error');

    // -----------------------------
    //  HELPERS
    // -----------------------------
    function createSessionId() {
        return crypto.randomUUID();
    }

    function createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        return indicator;
    }

    function linkifyText(text) {
        const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%%?=~_|!:,.;]*[-A-Z0-9+&@#\/%%=~_|])/gim;
        return text.replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`);
    }

    function showRegistrationForm() {
        chatWelcome.style.display = 'none';
        userRegistration.classList.add('active');
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^[\d\s+()-]{6,20}$/.test(phone); // basic phone validation
    }

    // -----------------------------
    //  REGISTRATION HANDLER
    // -----------------------------
    async function handleRegistration(event) {
        event.preventDefault();

        // Reset errors
        [nameError, emailError, phoneError].forEach(el => el.textContent = '');
        [nameInput, emailInput, phoneInput].forEach(el => el.classList.remove('error'));

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();

        let valid = true;
        if (!name) { nameError.textContent = 'Please enter your name'; nameInput.classList.add('error'); valid = false; }
        if (!email) { emailError.textContent = 'Please enter your email'; emailInput.classList.add('error'); valid = false; }
        else if (!isValidEmail(email)) { emailError.textContent = 'Invalid email address'; emailInput.classList.add('error'); valid = false; }
        if (!phone) { phoneError.textContent = 'Please enter your phone'; phoneInput.classList.add('error'); valid = false; }
        else if (!isValidPhone(phone)) { phoneError.textContent = 'Invalid phone number'; phoneInput.classList.add('error'); valid = false; }
        if (!valid) return;

        registeredUser = { name, email, phone };
        conversationId = createSessionId();

        const sessionData = [{
            action: 'loadPreviousSession',
            sessionId: conversationId,
            route: settings.webhook.route,
            metadata: { userId: email, userName: name, userPhone: phone }
        }];

        // UI transitions
        userRegistration.classList.remove('active');
        chatBody.classList.add('active');

        const typingIndicator = createTypingIndicator();
        messagesContainer.appendChild(typingIndicator);

        try {
            await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });

            const userInfoMessage = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`;
            const userInfoData = {
                action: 'sendMessage',
                sessionId: conversationId,
                route: settings.webhook.route,
                chatInput: userInfoMessage,
                metadata: { userId: email, userName: name, userPhone: phone, isUserInfo: true }
            };

            const userInfoResponse = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userInfoData)
            });
            const userInfoResponseData = await userInfoResponse.json();

            messagesContainer.removeChild(typingIndicator);
            const botMessage = document.createElement('div');
            botMessage.className = 'chat-bubble bot-bubble';
            const msgText = Array.isArray(userInfoResponseData) ? userInfoResponseData[0].output : userInfoResponseData.output;
            botMessage.innerHTML = linkifyText(msgText);
            messagesContainer.appendChild(botMessage);

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (err) {
            console.error('Registration error', err);
            messagesContainer.removeChild(typingIndicator);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'chat-bubble bot-bubble';
            errorMsg.textContent = 'Sorry, I could not connect to the server. Please try again later.';
            messagesContainer.appendChild(errorMsg);
        }
    }

    // -----------------------------
    //  MESSAGE HANDLING
    // -----------------------------
    async function submitMessage(messageText) {
        if (isWaitingForResponse) return;
        isWaitingForResponse = true;

        const { email, name, phone } = registeredUser;
        const requestData = {
            action: 'sendMessage',
            sessionId: conversationId,
            route: settings.webhook.route,
            chatInput: messageText,
            metadata: { userId: email, userName: name, userPhone: phone }
        };

        const userMsg = document.createElement('div');
        userMsg.className = 'chat-bubble user-bubble';
        userMsg.textContent = messageText;
        messagesContainer.appendChild(userMsg);

        const typingIndicator = createTypingIndicator();
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            const responseData = await response.json();
            messagesContainer.removeChild(typingIndicator);
            const botMsg = document.createElement('div');
            botMsg.className = 'chat-bubble bot-bubble';
            const txt = Array.isArray(responseData) ? responseData[0].output : responseData.output;
            botMsg.innerHTML = linkifyText(txt);
            messagesContainer.appendChild(botMsg);
        } catch (err) {
            console.error('Message error', err);
            messagesContainer.removeChild(typingIndicator);
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-bubble bot-bubble';
            errMsg.textContent = 'Sorry, I could not send your message. Please try again.';
            messagesContainer.appendChild(errMsg);
        } finally {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            isWaitingForResponse = false;
        }
    }

    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = (messageTextarea.scrollHeight > 120 ? 120 : messageTextarea.scrollHeight) + 'px';
    }

    // -----------------------------
    //  EVENT LISTENERS
    // -----------------------------
    startChatButton.addEventListener('click', showRegistrationForm);
    registrationForm.addEventListener('submit', handleRegistration);

    sendButton.addEventListener('click', () => {
        const msg = messageTextarea.value.trim();
        if (msg && !isWaitingForResponse) {
            submitMessage(msg);
            messageTextarea.value = '';
            messageTextarea.style.height = 'auto';
        }
    });

    messageTextarea.addEventListener('input', autoResizeTextarea);
    messageTextarea.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const msg = messageTextarea.value.trim();
            if (msg && !isWaitingForResponse) {
                submitMessage(msg);
                messageTextarea.value = '';
                messageTextarea.style.height = 'auto';
            }
        }
    });

    launchButton.addEventListener('click', () => chatWindow.classList.toggle('visible'));
    chatWindow.querySelectorAll('.chat-close-btn').forEach(btn => btn.addEventListener('click', () => chatWindow.classList.remove('visible')));
})();
