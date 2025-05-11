// Encryption key (in a real app, this should be derived from user input)
const ENCRYPTION_KEY = 'your-secure-key';

// DOM Elements
const passwordForm = document.getElementById('passwordForm');
const passwordList = document.getElementById('passwordList');
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');
const shareBtn = document.getElementById('shareBtn');
const shareBtnMobile = document.getElementById('shareBtnMobile');
const nicknameForm = document.getElementById('nicknameForm');
const verificationForm = document.getElementById('verificationForm');
const settingsBtn = document.getElementById('settingsBtn');
const settingsBtnMobile = document.getElementById('settingsBtnMobile');
const settingsForm = document.getElementById('settingsForm');
const toggleNicknameBtn = document.getElementById('toggleNickname');
const toggleInitialNicknameBtn = document.getElementById('toggleInitialNickname');
const gradientBtn = document.getElementById('gradientBtn');
const gradientBtnMobile = document.getElementById('gradientBtnMobile');

// Modal instances
const nicknameSetupModal = new bootstrap.Modal(document.getElementById('nicknameSetupModal'));
const passwordVerificationModal = new bootstrap.Modal(document.getElementById('passwordVerificationModal'));
const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));

// Accordion instances
const addPasswordCollapse = new bootstrap.Collapse(document.getElementById('addPasswordCollapse'), {
    toggle: false
});
const savedPasswordsCollapse = new bootstrap.Collapse(document.getElementById('savedPasswordsCollapse'), {
    toggle: false
});

// Toggle accordion sections
const toggleAccordion = (showAddPassword = true) => {
    if (showAddPassword) {
        savedPasswordsCollapse.hide();
        addPasswordCollapse.show();
    } else {
        addPasswordCollapse.hide();
        savedPasswordsCollapse.show();
    }
};

// Add click handlers for accordion headers
document.getElementById('addPasswordHeader').addEventListener('click', () => {
    toggleAccordion(true);
});

document.getElementById('savedPasswordsHeader').addEventListener('click', () => {
    toggleAccordion(false);
});

// Gradient switcher
let currentGradient = 1;
const maxGradients = 5;

gradientBtn.addEventListener('click', () => {
    // Only change gradient in light mode
    if (document.documentElement.getAttribute('data-theme') !== 'dark') {
        // Remove current gradient class
        document.body.classList.remove(`gradient-${currentGradient}`);
        
        // Move to next gradient
        currentGradient = currentGradient % maxGradients + 1;
        
        // Add new gradient class
        document.body.classList.add(`gradient-${currentGradient}`);
    }
});

// Check if nickname is set
const checkNickname = () => {
    const nickname = localStorage.getItem('nickname');
    if (!nickname) {
        nicknameSetupModal.show();
    }
};

// Initialize dark mode
const initDarkMode = () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        // Remove any gradient classes when switching to dark mode
        document.body.classList.remove(`gradient-${currentGradient}`);
    } else {
        // Add default gradient when in light mode
        document.body.classList.add(`gradient-${currentGradient}`);
    }
};

// Update dark mode icons
const updateDarkModeIcons = () => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    darkModeToggle.innerHTML = isDarkMode ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
    darkModeToggleMobile.innerHTML = isDarkMode ? 
        '<i class="bi bi-sun-fill"></i><span>Light</span>' : 
        '<i class="bi bi-moon-fill"></i><span>Dark</span>';
};

// Toggle dark mode
const toggleDarkMode = () => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'false');
        // Add gradient when switching to light mode
        document.body.classList.add(`gradient-${currentGradient}`);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('darkMode', 'true');
        // Remove gradient when switching to dark mode
        document.body.classList.remove(`gradient-${currentGradient}`);
    }
    updateDarkModeIcons();
};

// Add click handlers for dark mode toggles
darkModeToggle.addEventListener('click', toggleDarkMode);
darkModeToggleMobile.addEventListener('click', toggleDarkMode);

// Share functionality
shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'SecurePass Manager',
                text: 'Check out this secure password manager!',
                url: window.location.href
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    }
});

// Encryption function
const encrypt = (text) => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

// Decryption function
const decrypt = (ciphertext) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Save password to localStorage
const savePassword = (title, password, hint, id = null) => {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    const now = new Date().toISOString();
    
    if (id) {
        // Update existing password
        const index = passwords.findIndex(p => p.id === id);
        if (index !== -1) {
            passwords[index] = {
                ...passwords[index],
                title,
                password: encrypt(password),
                hint,
                updatedAt: now
            };
        }
    } else {
        // Add new password
        passwords.push({
            id: Date.now(),
            title,
            password: encrypt(password),
            hint,
            createdAt: now,
            updatedAt: now
        });
    }
    
    localStorage.setItem('passwords', JSON.stringify(passwords));
    renderPasswords();
};

// Delete password
const deletePassword = (id) => {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    const updatedPasswords = passwords.filter(p => p.id !== id);
    localStorage.setItem('passwords', JSON.stringify(updatedPasswords));
    renderPasswords();
};

// Nickname form submission
nicknameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value;
    localStorage.setItem('nickname', nickname);
    nicknameSetupModal.hide();
});

// Verification form submission
let pendingPasswordAction = null;
verificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredNickname = document.getElementById('verifyNickname').value;
    const storedNickname = localStorage.getItem('nickname');
    
    if (enteredNickname === storedNickname) {
        passwordVerificationModal.hide();
        if (pendingPasswordAction) {
            pendingPasswordAction();
            pendingPasswordAction = null;
        }
    } else {
        alert('Incorrect nickname!');
    }
    document.getElementById('verifyNickname').value = '';
});

// Show password hint
const showHint = (hint, elementId) => {
    const detailsDiv = document.getElementById(`details-${elementId}`);
    detailsDiv.innerHTML = `<div class="alert alert-info mb-0">Password Hint: ${hint}</div>`;
    detailsDiv.style.display = 'block';
};

// Show first three characters of password
const showFirstThree = (encryptedPassword, elementId) => {
    const password = decrypt(encryptedPassword);
    const maskedPassword = password.substring(0, 3) + '*'.repeat(password.length - 3);
    const detailsDiv = document.getElementById(`details-${elementId}`);
    detailsDiv.innerHTML = `<div class="alert alert-warning mb-0">Password: ${maskedPassword}</div>`;
    detailsDiv.style.display = 'block';
};

// Show last three characters of password
const showLastThree = (encryptedPassword, elementId) => {
    const password = decrypt(encryptedPassword);
    const maskedPassword = '*'.repeat(password.length - 3) + password.slice(-3);
    const detailsDiv = document.getElementById(`details-${elementId}`);
    detailsDiv.innerHTML = `<div class="alert alert-warning mb-0">Password: ${maskedPassword}</div>`;
    detailsDiv.style.display = 'block';
};

// Show full password
const showFullPassword = (encryptedPassword, elementId) => {
    pendingPasswordAction = () => {
        const password = decrypt(encryptedPassword);
        const detailsDiv = document.getElementById(`details-${elementId}`);
        detailsDiv.innerHTML = `<div class="alert alert-warning mb-0">Password: ${password}</div>`;
        detailsDiv.style.display = 'block';
    };
    passwordVerificationModal.show();
};

// Check if password is older than 90 days
const isPasswordOld = (updatedAt) => {
    const updatedDate = new Date(updatedAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - updatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 90;
};

// Format date for display
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Show update password modal
const showUpdateModal = (id) => {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    const password = passwords.find(p => p.id === id);
    if (password) {
        document.getElementById('title').value = password.title;
        document.getElementById('password').value = decrypt(password.password);
        document.getElementById('hint').value = password.hint || '';
        document.getElementById('passwordForm').dataset.updateId = id;
        toggleAccordion(true); // Show add password section
    }
};

// Render passwords list
const renderPasswords = () => {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    passwordList.innerHTML = passwords.map(p => `
        <div class="password-item">
            <div class="password-info">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <h6 class="mb-0">${p.title}</h6>
                    <small class="text-muted">Updated: ${formatDate(p.updatedAt)}</small>
                </div>
                <div class="password-actions">
                    ${p.hint ? `
                        <button class="btn btn-outline-primary btn-sm" onclick="showHint('${p.hint}', ${p.id})">
                            <i class="bi bi-lightbulb"></i> Hint
                        </button>
                    ` : ''}
                    <div class="btn-group">
                        <button class="btn btn-outline-primary btn-sm" onclick="showFirstThree('${p.password}', ${p.id})">
                            <i class="bi bi-eye"></i> First 3
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="showLastThree('${p.password}', ${p.id})">
                            <i class="bi bi-eye"></i> Last 3
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="showFullPassword('${p.password}', ${p.id})">
                            <i class="bi bi-eye-fill"></i> Full
                        </button>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary btn-sm" onclick="showUpdateModal(${p.id})">
                            <i class="bi bi-pencil"></i> Update
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deletePassword(${p.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                    ${isPasswordOld(p.updatedAt) ? `
                        <div class="password-warning">
                            <div class="alert alert-warning mb-0">
                                <i class="bi bi-exclamation-triangle-fill"></i>
                                This password should be changed now as it's been 90 days old
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div id="details-${p.id}" class="password-details" style="display: none;"></div>
        </div>
    `).join('');
};

// Form submission handler
passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const password = document.getElementById('password').value;
    const hint = document.getElementById('hint').value;
    const updateId = e.target.dataset.updateId;
    
    savePassword(title, password, hint, updateId ? parseInt(updateId) : null);
    passwordForm.reset();
    delete passwordForm.dataset.updateId;
    toggleAccordion(false); // Show saved passwords section
});

// Toggle nickname visibility
togglePasswordVisibility = (inputId, buttonId) => {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
};

toggleNicknameBtn.addEventListener('click', () => {
    togglePasswordVisibility('updateNickname', 'toggleNickname');
});

toggleInitialNicknameBtn.addEventListener('click', () => {
    togglePasswordVisibility('nickname', 'toggleInitialNickname');
});

// Settings button click handler
settingsBtn.addEventListener('click', () => {
    const currentNickname = localStorage.getItem('nickname');
    const nicknameInput = document.getElementById('updateNickname');
    nicknameInput.value = currentNickname || '';
    nicknameInput.type = 'password'; // Reset to password type
    const icon = toggleNicknameBtn.querySelector('i');
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
    settingsModal.show();
});

// Settings form submission
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newNickname = document.getElementById('updateNickname').value;
    localStorage.setItem('nickname', newNickname);
    settingsModal.hide();
    alert('Nickname updated successfully!');
});

// Mobile button event listeners
shareBtnMobile.addEventListener('click', () => {
    shareBtn.click(); // Trigger the original share button
});

settingsBtnMobile.addEventListener('click', () => {
    settingsBtn.click(); // Trigger the original settings button
});

gradientBtnMobile.addEventListener('click', () => {
    gradientBtn.click(); // Trigger the original gradient button
});

// Initialize
initDarkMode();
checkNickname();
renderPasswords();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
} 