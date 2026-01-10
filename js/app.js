/**
 * Unstuck - Main Application Logic
 * Orchestrates the UI, API calls, timer, and export functionality
 */

import { Timer } from './timer.js';
import { breakdownTask, getErrorMessage } from './gemini.js';
import { exportAsMarkdown, copyToClipboard, downloadAsFile, generateFilename } from './export.js';

// =============================================================================
// State
// =============================================================================

const state = {
  screen: 'input', // 'input' | 'loading' | 'step' | 'all-steps'
  task: '',
  taskSummary: '',
  steps: [],
  encouragement: '',
  currentStep: 0,
  completedSteps: [],
  timer: null
};

// =============================================================================
// DOM Elements
// =============================================================================

const elements = {
  // Screens
  screenInput: document.getElementById('screen-input'),
  screenLoading: document.getElementById('screen-loading'),
  screenStep: document.getElementById('screen-step'),
  screenAllSteps: document.getElementById('screen-all-steps'),

  // Input screen
  taskForm: document.getElementById('task-form'),
  taskInput: document.getElementById('task-input'),
  submitBtn: document.getElementById('submit-btn'),
  errorMessage: document.getElementById('error-message'),

  // Settings
  apiKeyInput: document.getElementById('api-key-input'),
  toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
  clearKey: document.getElementById('clear-key'),
  timerDuration: document.getElementById('timer-duration'),
  soundEnabled: document.getElementById('sound-enabled'),
  themeToggle: document.getElementById('theme-toggle'),

  // Step view
  stepIndicator: document.getElementById('step-indicator'),
  progressFill: document.getElementById('progress-fill'),
  stepContent: document.getElementById('step-content'),
  timerDisplay: document.getElementById('timer-display'),
  timerStart: document.getElementById('timer-start'),
  timerPause: document.getElementById('timer-pause'),
  timerReset: document.getElementById('timer-reset'),
  prevStep: document.getElementById('prev-step'),
  doneStep: document.getElementById('done-step'),
  nextStep: document.getElementById('next-step'),
  showAllSteps: document.getElementById('show-all-steps'),
  exportBtn: document.getElementById('export-btn'),
  startOver: document.getElementById('start-over'),

  // All steps view
  taskSummaryEl: document.getElementById('task-summary'),
  stepsList: document.getElementById('steps-list'),
  encouragementEl: document.getElementById('encouragement'),
  focusCurrent: document.getElementById('focus-current'),
  exportAllBtn: document.getElementById('export-all-btn'),
  startOverAll: document.getElementById('start-over-all'),

  // API key modal
  apiKeyModal: document.getElementById('api-key-modal'),
  modalApiKey: document.getElementById('modal-api-key'),
  modalCancel: document.getElementById('modal-cancel'),
  modalSave: document.getElementById('modal-save'),

  // Export modal
  exportModal: document.getElementById('export-modal'),
  exportPreviewContent: document.getElementById('export-preview-content'),
  exportCancel: document.getElementById('export-cancel'),
  exportCopy: document.getElementById('export-copy'),
  exportDownload: document.getElementById('export-download'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// =============================================================================
// LocalStorage Keys
// =============================================================================

const STORAGE_KEYS = {
  API_KEY: 'unstuck_gemini_key',
  SOUND_ENABLED: 'unstuck_sound',
  TIMER_DURATION: 'unstuck_timer_duration',
  THEME: 'unstuck_theme'
};

// =============================================================================
// Screen Management
// =============================================================================

function showScreen(screenName) {
  state.screen = screenName;

  // Hide all screens
  elements.screenInput.hidden = true;
  elements.screenLoading.hidden = true;
  elements.screenStep.hidden = true;
  elements.screenAllSteps.hidden = true;

  // Show the requested screen
  switch (screenName) {
    case 'input':
      elements.screenInput.hidden = false;
      elements.taskInput.focus();
      break;
    case 'loading':
      elements.screenLoading.hidden = false;
      break;
    case 'step':
      elements.screenStep.hidden = false;
      updateStepView();
      break;
    case 'all-steps':
      elements.screenAllSteps.hidden = false;
      updateAllStepsView();
      break;
  }
}

// =============================================================================
// Step View
// =============================================================================

function updateStepView() {
  const total = state.steps.length;
  const current = state.currentStep + 1;

  // Update indicator
  elements.stepIndicator.textContent = `Step ${current} of ${total}`;

  // Update progress bar
  const progress = (current / total) * 100;
  elements.progressFill.style.width = `${progress}%`;

  // Update step content
  elements.stepContent.textContent = state.steps[state.currentStep];

  // Update label based on current step
  const stepLabel = elements.screenStep.querySelector('.step-label');
  if (state.currentStep === 0) {
    stepLabel.textContent = 'Your first 15 minutes:';
  } else {
    stepLabel.textContent = `Step ${current}:`;
  }

  // Update navigation buttons
  elements.prevStep.disabled = state.currentStep === 0;
  elements.nextStep.hidden = state.currentStep === total - 1;

  // Update done button text
  const isCompleted = state.completedSteps.includes(state.currentStep);
  if (state.currentStep === total - 1 && isCompleted) {
    elements.doneStep.textContent = 'All done!';
    elements.doneStep.disabled = true;
  } else if (isCompleted) {
    elements.doneStep.textContent = 'Completed';
    elements.doneStep.disabled = false;
  } else {
    elements.doneStep.textContent = 'Done \u2713';
    elements.doneStep.disabled = false;
  }

  // Reset timer display for new step
  updateTimerDisplay();
}

function updateAllStepsView() {
  elements.taskSummaryEl.textContent = state.taskSummary;
  elements.encouragementEl.textContent = state.encouragement;

  // Build steps list
  elements.stepsList.innerHTML = '';
  state.steps.forEach((step, index) => {
    const li = document.createElement('li');
    li.className = 'step-item';

    if (state.completedSteps.includes(index)) {
      li.classList.add('completed');
    }
    if (index === state.currentStep) {
      li.classList.add('current');
    }

    li.innerHTML = `
      <span class="step-checkbox">\u2713</span>
      <span class="step-text"><strong>Step ${index + 1}:</strong> ${step}</span>
    `;

    li.addEventListener('click', () => {
      toggleStepComplete(index);
    });

    elements.stepsList.appendChild(li);
  });
}

function toggleStepComplete(index) {
  const idx = state.completedSteps.indexOf(index);
  if (idx === -1) {
    state.completedSteps.push(index);
  } else {
    state.completedSteps.splice(idx, 1);
  }
  updateAllStepsView();
}

function goToNextStep() {
  if (state.currentStep < state.steps.length - 1) {
    state.currentStep++;
    resetTimer();
    updateStepView();
  }
}

function goToPrevStep() {
  if (state.currentStep > 0) {
    state.currentStep--;
    resetTimer();
    updateStepView();
  }
}

function markCurrentDone() {
  if (!state.completedSteps.includes(state.currentStep)) {
    state.completedSteps.push(state.currentStep);
  }

  // Auto-advance to next step if not on last
  if (state.currentStep < state.steps.length - 1) {
    goToNextStep();
  } else {
    updateStepView();
    showToast('All steps complete! Great work!');
  }
}

// =============================================================================
// Timer
// =============================================================================

function initTimer() {
  const duration = parseInt(localStorage.getItem(STORAGE_KEYS.TIMER_DURATION)) || 15;
  state.timer = new Timer(duration);
  elements.timerDuration.value = duration;
}

function updateTimerDisplay() {
  if (!state.timer) return;

  elements.timerDisplay.textContent = state.timer.getFormattedTime();
  elements.timerDisplay.classList.remove('running', 'finished');

  if (state.timer.isRunning) {
    elements.timerDisplay.classList.add('running');
  } else if (state.timer.remaining === 0) {
    elements.timerDisplay.classList.add('finished');
  }

  // Update button visibility
  elements.timerStart.hidden = state.timer.isRunning;
  elements.timerPause.hidden = !state.timer.isRunning;
  elements.timerReset.hidden = state.timer.remaining === state.timer.duration && !state.timer.isRunning;
}

function startTimer() {
  state.timer.start(
    () => updateTimerDisplay(),
    () => {
      updateTimerDisplay();
      const soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
      if (soundEnabled) {
        state.timer.playNotification();
      }
      showToast('Time\'s up! Take a moment to wrap up.');
    }
  );
  updateTimerDisplay();
}

function pauseTimer() {
  state.timer.pause();
  updateTimerDisplay();
}

function resetTimer() {
  state.timer.reset();
  updateTimerDisplay();
}

// =============================================================================
// API Key Management
// =============================================================================

function getApiKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  elements.apiKeyInput.value = key;
}

function clearApiKey() {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  elements.apiKeyInput.value = '';
}

function showApiKeyModal() {
  elements.apiKeyModal.hidden = false;
  elements.modalApiKey.value = '';
  elements.modalApiKey.focus();

  // Handle backdrop click
  elements.apiKeyModal.querySelector('.modal-backdrop').onclick = () => {
    hideApiKeyModal();
  };
}

function hideApiKeyModal() {
  elements.apiKeyModal.hidden = true;
}

// =============================================================================
// Export
// =============================================================================

function showExportModal() {
  const markdown = exportAsMarkdown(state.taskSummary, state.steps, state.completedSteps);
  elements.exportPreviewContent.textContent = markdown;
  elements.exportModal.hidden = false;

  // Handle backdrop click
  elements.exportModal.querySelector('.modal-backdrop').onclick = () => {
    hideExportModal();
  };
}

function hideExportModal() {
  elements.exportModal.hidden = true;
}

async function handleExportCopy() {
  const markdown = exportAsMarkdown(state.taskSummary, state.steps, state.completedSteps);
  const success = await copyToClipboard(markdown);
  if (success) {
    showToast('Copied to clipboard!');
  } else {
    showToast('Failed to copy. Try again.');
  }
}

function handleExportDownload() {
  const markdown = exportAsMarkdown(state.taskSummary, state.steps, state.completedSteps);
  const filename = generateFilename(state.taskSummary);
  downloadAsFile(markdown, filename);
  showToast('Downloaded!');
}

// =============================================================================
// Theme
// =============================================================================

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let newTheme;
  if (!currentTheme) {
    // No explicit theme set, toggle from system preference
    newTheme = prefersDark ? 'light' : 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'light';
  } else {
    newTheme = 'dark';
  }

  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
}

// =============================================================================
// Toast Notifications
// =============================================================================

function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, duration);
}

// =============================================================================
// Error Handling
// =============================================================================

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.hidden = false;
}

function clearError() {
  elements.errorMessage.hidden = true;
  elements.errorMessage.textContent = '';
}

// =============================================================================
// Form Submission
// =============================================================================

async function handleSubmit(e) {
  e.preventDefault();

  const task = elements.taskInput.value.trim();

  if (!task) {
    showError('Tell me what you\'re stuck on - even one sentence helps.');
    return;
  }

  // Check for API key
  let apiKey = getApiKey();
  if (!apiKey) {
    // Show modal to get API key
    showApiKeyModal();

    // Wait for user to save key or cancel
    return new Promise((resolve) => {
      const onSave = () => {
        const key = elements.modalApiKey.value.trim();
        if (key) {
          saveApiKey(key);
          hideApiKeyModal();
          // Retry submission
          handleSubmit(e);
        }
        resolve();
      };

      const onCancel = () => {
        hideApiKeyModal();
        resolve();
      };

      elements.modalSave.onclick = onSave;
      elements.modalCancel.onclick = onCancel;
    });
  }

  // Clear previous state
  clearError();
  state.task = task;
  state.currentStep = 0;
  state.completedSteps = [];

  // Show loading
  showScreen('loading');

  try {
    const result = await breakdownTask(task, apiKey);

    state.taskSummary = result.taskSummary;
    state.steps = result.steps;
    state.encouragement = result.encouragement;

    // Reset timer for new task
    initTimer();

    // Show step view
    showScreen('step');

  } catch (error) {
    console.error('Error breaking down task:', error);

    const message = getErrorMessage(error.errorType, error.message);
    showError(message);
    showScreen('input');
  }
}

// =============================================================================
// Start Over
// =============================================================================

function startOverFlow() {
  // Reset state
  state.task = '';
  state.taskSummary = '';
  state.steps = [];
  state.encouragement = '';
  state.currentStep = 0;
  state.completedSteps = [];

  // Reset timer
  if (state.timer) {
    state.timer.reset();
  }

  // Clear input and show input screen
  elements.taskInput.value = '';
  clearError();
  showScreen('input');
}

// =============================================================================
// Settings Sync
// =============================================================================

function syncSettings() {
  // API key (masked)
  const apiKey = getApiKey();
  elements.apiKeyInput.value = apiKey;
  elements.apiKeyInput.type = 'password';

  // Timer duration
  const duration = parseInt(localStorage.getItem(STORAGE_KEYS.TIMER_DURATION)) || 15;
  elements.timerDuration.value = duration;

  // Sound
  const soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
  elements.soundEnabled.checked = soundEnabled;
}

// =============================================================================
// Event Listeners
// =============================================================================

function setupEventListeners() {
  // Form submission
  elements.taskForm.addEventListener('submit', handleSubmit);

  // Settings - API key visibility toggle
  elements.toggleKeyVisibility.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.toggleKeyVisibility.setAttribute(
      'aria-label',
      isPassword ? 'Hide API key' : 'Show API key'
    );
  });

  // Settings - Clear API key
  elements.clearKey.addEventListener('click', () => {
    clearApiKey();
    showToast('API key cleared');
  });

  // Settings - API key input
  elements.apiKeyInput.addEventListener('change', (e) => {
    saveApiKey(e.target.value);
    showToast('API key saved');
  });

  // Settings - Timer duration
  elements.timerDuration.addEventListener('change', (e) => {
    const duration = parseInt(e.target.value);
    localStorage.setItem(STORAGE_KEYS.TIMER_DURATION, duration);
    if (state.timer) {
      state.timer.setDuration(duration);
      state.timer.reset();
      updateTimerDisplay();
    }
  });

  // Settings - Sound toggle
  elements.soundEnabled.addEventListener('change', (e) => {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, e.target.checked);
  });

  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Timer controls
  elements.timerStart.addEventListener('click', startTimer);
  elements.timerPause.addEventListener('click', pauseTimer);
  elements.timerReset.addEventListener('click', resetTimer);

  // Step navigation
  elements.prevStep.addEventListener('click', goToPrevStep);
  elements.nextStep.addEventListener('click', goToNextStep);
  elements.doneStep.addEventListener('click', markCurrentDone);

  // View toggles
  elements.showAllSteps.addEventListener('click', () => showScreen('all-steps'));
  elements.focusCurrent.addEventListener('click', () => showScreen('step'));

  // Export
  elements.exportBtn.addEventListener('click', showExportModal);
  elements.exportAllBtn.addEventListener('click', showExportModal);
  elements.exportCancel.addEventListener('click', hideExportModal);
  elements.exportCopy.addEventListener('click', handleExportCopy);
  elements.exportDownload.addEventListener('click', handleExportDownload);

  // Start over
  elements.startOver.addEventListener('click', startOverFlow);
  elements.startOverAll.addEventListener('click', startOverFlow);

  // API key modal
  elements.modalCancel.addEventListener('click', hideApiKeyModal);
  elements.modalSave.addEventListener('click', () => {
    const key = elements.modalApiKey.value.trim();
    if (key) {
      saveApiKey(key);
      hideApiKeyModal();
      showToast('API key saved!');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
      if (!elements.apiKeyModal.hidden) {
        hideApiKeyModal();
      }
      if (!elements.exportModal.hidden) {
        hideExportModal();
      }
    }

    // Only handle shortcuts when not in input fields
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    if (isInput) return;

    // Step view shortcuts
    if (state.screen === 'step') {
      if (e.key === 'ArrowRight' || e.key === 'n') {
        goToNextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'p') {
        goToPrevStep();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (state.timer.isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      } else if (e.key === 'd') {
        markCurrentDone();
      }
    }
  });
}

// =============================================================================
// Initialize
// =============================================================================

function init() {
  initTheme();
  initTimer();
  syncSettings();
  setupEventListeners();
  showScreen('input');
}

// Start the app
init();
