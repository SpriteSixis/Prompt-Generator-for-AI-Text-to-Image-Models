// ============================================================================
// CONFIG & CONSTANTS
// ============================================================================
const categoryNames = ['SUBJECTS', 'FEMALE SUBJECTS', 'CLOTHING', 'CLOTHING STYLES', 'PROPS', 'POSES', 'SETTINGS', 'SCENE', 'SURREAL SCENE'];
const advancedCategoryNames = ["ARTISTS", "CGI RENDERINGS", "CGI SOFTWARES", "CAMERAS", "CARVINGS AND ETCHINGS", "COLORS", "DRAWING STYLES", "EMOTIONS", "PENS", "VISUAL STYLES", "FORMAT"];

// ============================================================================
// GLOBAL STATE
// ============================================================================
let removedCategories = [];
let removedText = {}; // Object to store the removed text for each category
let textUndoStack = {}; // Change this to an object
let textRedoStack = {}; // Change this to an object
let duplicateCounters = {};
let categoryIdCounter = 0;
let templateIdCounter = 0;
let dragCategory; // Variable to store the dragged category container
let randomness = 1.0; // Randomness strength (0 = sequential, 1 = full chaos)
let lastIndexByCategory = {}; // Track last index used for each category

// ============================================================================
// DOM REFERENCES
// ============================================================================
const categoriesContainer = document.getElementById('categories');
const buttonSection = document.querySelector('.button-section');
const lockAllBtn = document.getElementById('lockAllBtn');
const IncludeAllBtn = document.getElementById('IncludeAllBtn');
const spellcheckToggleBtn = document.getElementById('spellcheckToggleBtn');
const addPromptsButton = document.getElementById('addPromptsButton');
const randomizeBtn = document.getElementById("randomizeBtn");
const undoRemoveButton = document.getElementById('undoRemoveButton');
const undoRemoveAllButton = document.getElementById('undoRemoveAllButton');
const undoClearAllButton = document.getElementById('undoClearAllButton');
const templateContainer = document.getElementById('templateContainer');
const addTemplateBtn = document.getElementById('addTemplateBtn');
const connectLLMBtn = document.getElementById('connectLLMBtn');
const sendAIQueryBtn = document.getElementById('sendAIQueryBtn');
const aiInput = document.getElementById('aiInput');
const apiKeyModal = document.getElementById('apiKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const closeApiKeyModalBtn = document.getElementById('closeApiKeyModalBtn');
const llmProviderSelect = document.getElementById('llmProvider');
const llmBaseUrlInput = document.getElementById('llmBaseUrl');
const llmModelNameInput = document.getElementById('llmModelName');
const llmLocalApiKeyInput = document.getElementById('llmLocalApiKey');
const openaiSettingsGroup = document.getElementById('openaiSettings');
const localSettingsGroup = document.getElementById('localSettings');

let lastTemplateTextarea = null;

// ============================================================================
// TEMPLATE DECK HELPERS
// ============================================================================

function autoResizeTemplateTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = '';
  textarea.style.overflowY = 'auto';
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
  const minHeight = isNaN(lineHeight) ? 0 : lineHeight;
  textarea.style.height = Math.max(minHeight, textarea.scrollHeight || 0) + 'px';
}

function ensureTemplateCardExists() {
  if (!templateContainer) return null;
  if (templateContainer.children.length === 0) {
    const card = createTemplateCard();
    templateContainer.appendChild(card);
  }
  return templateContainer.children[templateContainer.children.length - 1];
}

function getTemplateCards() {
  return Array.from(templateContainer ? templateContainer.querySelectorAll('.template-card') : []);
}

function getTemplateTextareas() {
  return Array.from(templateContainer ? templateContainer.querySelectorAll('.template-text') : []);
}

function getTemplateTargetTextarea() {
  ensureTemplateCardExists();
  const activeElement = document.activeElement;
  if (activeElement && activeElement.classList && activeElement.classList.contains('template-text')) {
    return activeElement;
  }
  if (lastTemplateTextarea && lastTemplateTextarea.isConnected) {
    return lastTemplateTextarea;
  }
  const textareas = getTemplateTextareas();
  return textareas[textareas.length - 1] || null;
}

function appendTextToTemplate(text) {
  const targetTextarea = getTemplateTargetTextarea();
  if (!targetTextarea) return null;
  
  // Initialize undo stack if it doesn't exist
  if (!textUndoStack[targetTextarea.id]) textUndoStack[targetTextarea.id] = [];
  if (!textRedoStack[targetTextarea.id]) textRedoStack[targetTextarea.id] = [];
  
  // Push current state to undo stack before changing
  textUndoStack[targetTextarea.id].push(targetTextarea.value);
  
  // Clear redo stack
  textRedoStack[targetTextarea.id].length = 0;
  
  let currentTemplate = targetTextarea.value;
  currentTemplate = currentTemplate.replace(/^,\s*/, '');
  currentTemplate += (currentTemplate === '' ? '' : ', ') + text;
  targetTextarea.value = currentTemplate;
  
  // Push new state to undo stack
  textUndoStack[targetTextarea.id].push(currentTemplate);
  
  autoResizeTemplateTextarea(targetTextarea);
  return targetTextarea;
}

function appendCategoryToTemplate(categoryName) {
  return appendTextToTemplate(`[${categoryName}]`);
}

function createTemplateCard(text = '', isActive = true, isLocked = false) {
  const card = document.createElement('div');
  card.classList.add('template-card');

  const controls = document.createElement('div');
  controls.classList.add('template-controls');

  // Add the active checkbox with switch style
  const activeContainer = document.createElement('div');
  activeContainer.classList.add('option-container');
  
  const activeLabel = document.createElement('label');
  activeLabel.classList.add('switch');
  
  const activeCheckbox = document.createElement('input');
  activeCheckbox.setAttribute('type', 'checkbox');
  activeCheckbox.classList.add('template-active');
  activeCheckbox.checked = isActive;
  activeCheckbox.title = 'Toggle to Include or Exclude Template from Prompt Generation';
  
  const activeSlider = document.createElement('div');
  activeSlider.classList.add('slider');
  activeSlider.title = 'Toggle to Include or Exclude Template from Prompt Generation';
  
  activeLabel.appendChild(activeCheckbox);
  activeLabel.appendChild(activeSlider);
  
  const activeText = document.createElement('span');
  activeText.textContent = ' Active';
  activeText.classList.add('template-label-text');
  activeContainer.appendChild(activeLabel);
  activeContainer.appendChild(activeText);
  controls.appendChild(activeContainer);

  // Add the lock checkbox with switch style
  const lockContainer = document.createElement('div');
  lockContainer.classList.add('option-container');
  
  const lockLabel = document.createElement('label');
  lockLabel.classList.add('switch');
  
  const lockCheckbox = document.createElement('input');
  lockCheckbox.setAttribute('type', 'checkbox');
  lockCheckbox.classList.add('template-lock');
  lockCheckbox.checked = isLocked;
  lockCheckbox.title = 'Lock Template to Prevent Modification';
  
  const lockSlider = document.createElement('div');
  lockSlider.classList.add('slider');
  lockSlider.title = 'Lock Template to Prevent Modification';
  
  lockLabel.appendChild(lockCheckbox);
  lockLabel.appendChild(lockSlider);
  
  const lockText = document.createElement('span');
  lockText.textContent = ' Lock';
  lockText.classList.add('template-label-text');
  lockContainer.appendChild(lockLabel);
  lockContainer.appendChild(lockText);
  controls.appendChild(lockContainer);

  const duplicateButton = document.createElement('button');
  duplicateButton.textContent = 'Duplicate';
  duplicateButton.classList.add('button', 'duplicate-btn', 'template-control-btn');
  duplicateButton.title = 'Duplicate this template card';
  duplicateButton.addEventListener('click', () => {
    const newCard = createTemplateCard(textarea.value, activeCheckbox.checked, lockCheckbox.checked);
    templateContainer.insertBefore(newCard, card.nextSibling);
    const newTextarea = newCard.querySelector('.template-text');
    if (newTextarea) {
      newTextarea.focus();
    }
  });
  controls.appendChild(duplicateButton);

  const randomTemplateButton = document.createElement('button');
  randomTemplateButton.textContent = 'Random Template';
  randomTemplateButton.classList.add('button', 'random-template-btn', 'template-control-btn');
  randomTemplateButton.title = 'Insert a random template from PROMPT TEMPLATES category';
  randomTemplateButton.addEventListener('click', () => {
    // Check if textarea is locked
    if (lockCheckbox.checked) {
      alert('Template is locked. Unlock it first to modify.');
      return;
    }
    
    // Get random template from PROMPT TEMPLATES category
    if (data && data['PROMPT TEMPLATES'] && Array.isArray(data['PROMPT TEMPLATES']) && data['PROMPT TEMPLATES'].length > 0) {
      const templates = data['PROMPT TEMPLATES'];
      const randomIndex = Math.floor(Math.random() * templates.length);
      const randomTemplate = templates[randomIndex];
      
      // Initialize undo stack if it doesn't exist
      if (!textUndoStack[textarea.id]) textUndoStack[textarea.id] = [];
      if (!textRedoStack[textarea.id]) textRedoStack[textarea.id] = [];
      
      // Push current state to undo stack before changing
      textUndoStack[textarea.id].push(textarea.value);
      
      // Clear redo stack
      textRedoStack[textarea.id].length = 0;
      
      // Set the textarea value to the random template
      textarea.value = randomTemplate;
      autoResizeTemplateTextarea(textarea);
      
      // Push new state to undo stack
      textUndoStack[textarea.id].push(randomTemplate);
      
      // Focus the textarea
      textarea.focus();
    } else {
      alert('No templates found in PROMPT TEMPLATES category.');
    }
  });
  controls.appendChild(randomTemplateButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('button', 'remove-btn', 'template-control-btn');
  deleteButton.title = 'Delete this template card';
  deleteButton.addEventListener('click', () => {
    if (templateContainer.children.length <= 1) {
      textarea.value = '';
      autoResizeTemplateTextarea(textarea);
      return;
    }
    const fallbackCard = card.nextElementSibling || card.previousElementSibling;
    card.remove();
    if (fallbackCard) {
      const fallbackTextarea = fallbackCard.querySelector('.template-text');
      if (fallbackTextarea) {
        lastTemplateTextarea = fallbackTextarea;
      }
    }
  });
  controls.appendChild(deleteButton);

  const textarea = document.createElement('textarea');
  textarea.id = `template-${templateIdCounter}`;
  templateIdCounter++;
  textarea.classList.add('soft-ui-input', 'template-text');
  textarea.rows = 4;
  textarea.spellcheck = true;
  textarea.placeholder = '[SUBJECTS], wearing [CLOTHING], with [PROPS], in a beautiful [SETTINGS], [SCENE]';
  textarea.title = 'Write whatever structure you wish with the [CATEGORY NAME] in square brackets.';
  textarea.value = text;
  textarea.readOnly = isLocked;
  textarea.classList.toggle('locked-textarea', isLocked);
  
  // Initialize undo stack with initial value
  if (!textUndoStack[textarea.id]) textUndoStack[textarea.id] = [];
  textUndoStack[textarea.id].push(text);
  if (!textRedoStack[textarea.id]) textRedoStack[textarea.id] = [];
  
  // Add input listener for auto-resize and undo stack
  textarea.addEventListener('input', (event) => {
    autoResizeTemplateTextarea(textarea);
    handleInput(event);
  });
  
  // Add keydown listener for undo/redo
  textarea.addEventListener('keydown', handleKeyDown);
  
  textarea.addEventListener('focus', () => {
    lastTemplateTextarea = textarea;
  });

  lockCheckbox.addEventListener('change', () => {
    textarea.readOnly = lockCheckbox.checked;
    textarea.classList.toggle('locked-textarea', lockCheckbox.checked);
  });

  autoResizeTemplateTextarea(textarea);

  card.appendChild(controls);
  card.appendChild(textarea);

  lastTemplateTextarea = textarea;
  return card;
}

function collectTemplateData() {
  if (!templateContainer) return [];
  return getTemplateCards().map(card => {
    const textarea = card.querySelector('.template-text');
    const activeCheckbox = card.querySelector('.template-active');
    const lockCheckbox = card.querySelector('.template-lock');
    return {
      text: textarea ? textarea.value : '',
      active: activeCheckbox ? activeCheckbox.checked : true,
      locked: lockCheckbox ? lockCheckbox.checked : false
    };
  });
}

function setTemplateCardsFromData(templateData, options = {}) {
  const append = options.append || false;
  if (!templateContainer) return;
  if (!append) {
    templateContainer.innerHTML = '';
  }

  const payload = templateData ?? '';

  if (Array.isArray(payload)) {
    payload.forEach(entry => {
      const normalized = typeof entry === 'string' ? { text: entry, active: true, locked: false } : (entry || {});
      const card = createTemplateCard(normalized.text || '', normalized.active !== false, normalized.locked || false);
      templateContainer.appendChild(card);
    });
  } else if (typeof payload === 'string') {
    const card = createTemplateCard(payload, true, false);
    templateContainer.appendChild(card);
  }

  ensureTemplateCardExists();
  const finalTextarea = getTemplateTextareas().slice(-1)[0];
  if (finalTextarea) {
    lastTemplateTextarea = finalTextarea;
  }
}

// ============================================================================
// AI ASSISTANT
// ============================================================================

function autoResize(textarea) {
  if (!textarea) return;
  const minHeight = 40;
  const maxHeight = 100;
  textarea.style.height = 'auto';
  const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
  textarea.style.height = `${newHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function updateLLMSettingsVisibility(providerValue) {
  const provider = providerValue || (llmProviderSelect ? llmProviderSelect.value : 'openai');
  if (openaiSettingsGroup) {
    openaiSettingsGroup.style.display = provider === 'openai' ? 'block' : 'none';
  }
  if (localSettingsGroup) {
    localSettingsGroup.style.display = provider === 'local' ? 'block' : 'none';
  }
}

function showApiKeyModal() {
  if (!apiKeyModal) return;
  apiKeyModal.classList.add('show');
  apiKeyModal.setAttribute('aria-hidden', 'false');
  loadStoredLLMSettings();
  const provider = llmProviderSelect ? llmProviderSelect.value : 'openai';
  updateLLMSettingsVisibility(provider);
  if (provider === 'openai' && apiKeyInput) {
    apiKeyInput.focus();
  } else if (provider === 'local' && llmBaseUrlInput) {
    llmBaseUrlInput.focus();
  }
}

function hideApiKeyModal() {
  if (!apiKeyModal) return;
  apiKeyModal.classList.remove('show');
  apiKeyModal.setAttribute('aria-hidden', 'true');
}

function setLLMButtonConnected() {
  if (!connectLLMBtn) return;
  const provider = localStorage.getItem('llm_provider') || 'openai';
  const hasOpenAIKey = !!localStorage.getItem('openai_api_key');
  const hasLocalBase = !!localStorage.getItem('llm_base_url');
  const isConnected = (provider === 'openai' && hasOpenAIKey) || (provider === 'local' && hasLocalBase);
  
  if (isConnected) {
    connectLLMBtn.textContent = 'LLM Connected (Reset)';
    connectLLMBtn.classList.remove('llm-disconnected');
    connectLLMBtn.classList.add('llm-connected');
  } else {
    connectLLMBtn.textContent = 'Connect LLM';
    connectLLMBtn.classList.remove('llm-connected');
    connectLLMBtn.classList.add('llm-disconnected');
  }
}

function loadStoredLLMSettings() {
  const provider = localStorage.getItem('llm_provider') || 'openai';
  const storedKey = localStorage.getItem('openai_api_key') || '';
  const storedBaseUrl = localStorage.getItem('llm_base_url') || '';
  const storedModelName = localStorage.getItem('llm_model_name') || 'local-model';
  const storedLocalKey = localStorage.getItem('llm_local_api_key') || 'not-needed';

  if (llmProviderSelect) {
    llmProviderSelect.value = provider;
  }
  if (apiKeyInput) {
    apiKeyInput.value = storedKey;
  }
  if (llmBaseUrlInput) {
    llmBaseUrlInput.value = storedBaseUrl;
  }
  if (llmModelNameInput) {
    llmModelNameInput.value = storedModelName || 'local-model';
  }
  if (llmLocalApiKeyInput) {
    llmLocalApiKeyInput.value = storedLocalKey || 'not-needed';
  }
  updateLLMSettingsVisibility(provider);
}

function saveLLMSettings() {
  const provider = llmProviderSelect ? llmProviderSelect.value : 'openai';
  const key = apiKeyInput ? apiKeyInput.value.trim() : '';
  const baseUrl = llmBaseUrlInput ? llmBaseUrlInput.value.trim() : '';
  const modelName = llmModelNameInput ? llmModelNameInput.value.trim() : '';
  const localKey = llmLocalApiKeyInput ? llmLocalApiKeyInput.value.trim() : '';

  if (provider === 'openai' && !key) {
    alert('Please enter a valid OpenAI API key.');
    return;
  }

  if (provider === 'local' && !baseUrl) {
    alert('Please enter a Base URL for your local LLM (e.g., http://localhost:1234/v1).');
    return;
  }

  localStorage.setItem('llm_provider', provider);
  localStorage.setItem('openai_api_key', key);
  localStorage.setItem('llm_base_url', baseUrl);
  localStorage.setItem('llm_model_name', modelName || 'local-model');
  localStorage.setItem('llm_local_api_key', localKey || '');

  setLLMButtonConnected();
  hideApiKeyModal();
}

function sanitizeJsonResponse(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function findCategoryContainerByName(name) {
  if (!name) return null;
  const normalized = name.trim().toUpperCase();
  return Array.from(document.querySelectorAll('.category')).find(category => {
    const headerName = category.querySelector('.category-header-name');
    return headerName && headerName.textContent.trim().toUpperCase() === normalized;
  }) || null;
}

function appendWordsToCategory(categoryElement, wordsString) {
  if (!categoryElement || !wordsString) return;
  const textarea = categoryElement.querySelector('textarea');
  if (!textarea) return;

  const cleanedWords = Array.isArray(wordsString) ? wordsString : wordsString.split(',').map(word => word.trim()).filter(Boolean);
  if (!cleanedWords.length) return;

  const newWordsText = cleanedWords.join(', ');
  const currentValue = textarea.value.trim();
  const separator = currentValue && !currentValue.endsWith(',') ? ', ' : '';
  textarea.value = currentValue ? `${currentValue}${separator}${newWordsText}` : newWordsText;

  if (!textUndoStack[textarea.id]) textUndoStack[textarea.id] = [];
  textUndoStack[textarea.id].push(textarea.value);
}

function upsertCategoryFromLLM(entry) {
  if (!entry || !entry.name) return;
  const normalizedName = entry.name.trim().toUpperCase();
  const words = typeof entry.words === 'string' ? entry.words : Array.isArray(entry.words) ? entry.words.join(', ') : '';

  let categoryElement = findCategoryContainerByName(normalizedName);
  if (!categoryElement) {
    categoryElement = createCategoryComponent(normalizedName);
    categoriesContainer.appendChild(categoryElement);
    setTimeout(() => updateAllMoveButtons(), 0);
  }

  appendWordsToCategory(categoryElement, words);
}

function applyTemplateFromLLM(templateText) {
  if (!templateText) return;
  const targetTextarea = getTemplateTargetTextarea();
  if (!targetTextarea) return;
  
  // Initialize undo stack if it doesn't exist
  if (!textUndoStack[targetTextarea.id]) textUndoStack[targetTextarea.id] = [];
  if (!textRedoStack[targetTextarea.id]) textRedoStack[targetTextarea.id] = [];
  
  // Push current state to undo stack before changing
  textUndoStack[targetTextarea.id].push(targetTextarea.value);
  
  // Clear redo stack
  textRedoStack[targetTextarea.id].length = 0;
  
  targetTextarea.value = templateText;
  
  // Push new state to undo stack
  textUndoStack[targetTextarea.id].push(templateText);
  
  autoResizeTemplateTextarea(targetTextarea);
}

function setAIPending(isPending) {
  if (!sendAIQueryBtn) return;
  sendAIQueryBtn.disabled = isPending;
  sendAIQueryBtn.textContent = isPending ? 'Thinking...' : 'Send Prompt';
}

function getLLMSettings() {
  return {
    provider: localStorage.getItem('llm_provider') || 'openai',
    openaiKey: localStorage.getItem('openai_api_key') || '',
    baseUrl: localStorage.getItem('llm_base_url') || '',
    modelName: localStorage.getItem('llm_model_name') || 'local-model',
    localApiKey: localStorage.getItem('llm_local_api_key') || ''
  };
}

async function sendAIQuery() {
  const settings = getLLMSettings();
  const prompt = aiInput ? aiInput.value.trim() : '';
  if (!prompt) {
    alert('Please enter a prompt for the LLM.');
    return;
  }

  const systemMessage = {
    role: "system",
    content: `You are an intelligent assistant for a 'Random Prompt Generator' app. Your goal is to help the user build creative setups for AI image generation based on their request.

    INSTRUCTIONS:

    1. You must respond with **ONLY valid JSON**. Do not include markdown formatting, backticks, or conversational text.

    2. Analyze the user's request (e.g., "Create a Dark Fantasy setup" or "I need ideas for Sci-Fi portraits").

    3. Generate relevant **Categories** (lists of creative, comma-separated words/phrases).

    4. Generate a **Template** (a sentence structure using those categories in square brackets).

    JSON STRUCTURE:

    {
      "categories": [
        { "name": "CATEGORY_NAME", "words": "item1, item2, item3..." }
      ],
      "template": "A sentence using [CATEGORY_NAME] placeholders."
    }

    RULES:

    - Category names should be UPPERCASE to match the app's style (e.g., "SUBJECTS", "LIGHTING").

    - Provide at least 10-15 varied items per category to ensure good randomization.

    - Ensure every [PLACEHOLDER] in the template has a corresponding category in the list.

    - If the user asks for a specific style (e.g. "Sora video" or "Stable Diffusion"), tailor the template structure accordingly.`
  };

  setAIPending(true);

  const headers = { 'Content-Type': 'application/json' };
  const messages = [
    systemMessage,
    { role: 'user', content: prompt }
  ];

  const payload = {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    messages
  };

  let endpoint = 'https://api.openai.com/v1/chat/completions';

  if (settings.provider === 'local') {
    if (!settings.baseUrl) {
      alert('Please connect your Local LLM base URL first.');
      setAIPending(false);
      return;
    }
    endpoint = settings.baseUrl.trim();
    if (!/\/chat\/completions\/?$/i.test(endpoint)) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
    payload.model = settings.modelName || 'local-model';
    headers['Authorization'] = `Bearer ${settings.localApiKey || 'lm-studio'}`;
  } else {
    if (!settings.openaiKey) {
      alert('Please connect your OpenAI API key first.');
      setAIPending(false);
      return;
    }
    headers['Authorization'] = `Bearer ${settings.openaiKey}`;
    payload.model = "gpt-3.5-turbo";
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';
    const cleaned = sanitizeJsonResponse(rawContent);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse LLM response', parseError, cleaned);
      alert('Could not parse LLM response. Please try again.');
      return;
    }

    const categoriesPayload = Array.isArray(parsed.categories) ? parsed.categories : [];
    categoriesPayload.forEach(entry => upsertCategoryFromLLM(entry));

    if (parsed.template) {
      applyTemplateFromLLM(parsed.template);
    }
  } catch (error) {
    console.error('LLM request failed', error);
    if (settings.provider === 'local') {
      alert('Could not connect to Local Host. Ensure CORS is enabled and the server is running.');
    } else {
      alert('LLM request failed. Please check the console for details and verify your API key.');
    }
  } finally {
    setAIPending(false);
  }
}

function initializeAIAssistant() {
  if (aiInput) {
    autoResize(aiInput);
    aiInput.addEventListener('input', () => autoResize(aiInput));
  }

  loadStoredLLMSettings();
  setLLMButtonConnected();

  if (connectLLMBtn) {
    connectLLMBtn.addEventListener('click', showApiKeyModal);
  }

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', saveLLMSettings);
  }

  if (closeApiKeyModalBtn) {
    closeApiKeyModalBtn.addEventListener('click', hideApiKeyModal);
  }

  if (llmProviderSelect) {
    llmProviderSelect.addEventListener('change', (event) => {
      updateLLMSettingsVisibility(event.target.value);
    });
  }

  if (apiKeyModal) {
    apiKeyModal.addEventListener('click', (event) => {
      if (event.target === apiKeyModal) {
        hideApiKeyModal();
      }
    });
  }

  if (sendAIQueryBtn) {
    sendAIQueryBtn.addEventListener('click', sendAIQuery);
  }
}

// ============================================================================
// CATEGORY UI CORE
// ============================================================================

function createCategoryComponent(categoryName) {
  const container = document.createElement('div');

  // Generate a unique ID for the category container
  container.id = `category-${categoryIdCounter}`;
  categoryIdCounter++;

  container.classList.add('category', 'mb-4', 'category-container');
  container.draggable = false; // Change this line, make the container not draggable


  // Add a header to the container
  const header = document.createElement('div');
  header.className = 'category-header'; // We'll use this class in CSS to style the header
  
  // Create a container for the category name (left side)
  const headerName = document.createElement('div');
  headerName.className = 'category-header-name';
  headerName.textContent = categoryName;
  headerName.draggable = true; // Make the name draggable
  headerName.title = 'Drag and Drop to Rearrange Category Containers to your Liking';
  header.appendChild(headerName);
  
  // Create a container for the up/down buttons (right side)
  const headerButtons = document.createElement('div');
  headerButtons.className = 'category-header-buttons';
  
  // Create up button
  const upButton = document.createElement('button');
  upButton.className = 'category-move-btn category-move-up';
  upButton.innerHTML = '▲';
  upButton.title = 'Move Category Up';
  upButton.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    moveCategoryUp(container);
  };
  // Prevent drag when clicking button
  upButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  upButton.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  
  // Create down button
  const downButton = document.createElement('button');
  downButton.className = 'category-move-btn category-move-down';
  downButton.innerHTML = '▼';
  downButton.title = 'Move Category Down';
  downButton.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    moveCategoryDown(container);
  };
  // Prevent drag when clicking button
  downButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  downButton.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  
  headerButtons.appendChild(upButton);
  headerButtons.appendChild(downButton);
  header.appendChild(headerButtons);
  
  container.appendChild(header);
  
  // Update button states after appending to DOM
  setTimeout(() => updateMoveButtons(container), 0);

  const label = document.createElement('label');
  // Comment out or remove this line to disable label text
  // label.textContent = `${categoryName}:`;
  label.textContent = `${categoryName}:`;
  label.classList.add('hidden-label');
  container.appendChild(label);

  const textarea = document.createElement('textarea');
  textarea.id = categoryName;
  textarea.setAttribute('data-category', categoryName.replace(/\d+$/, ''));  // add this line
  textarea.setAttribute('rows', '3');
  textarea.setAttribute('placeholder', `Enter ${categoryName}, separated by commas`);
  textarea.classList.add('w-full', 'mt-2');
  container.appendChild(textarea);

  // Add event listeners to the text area
  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('keydown', handleKeyDown);

  // Create new container for checkbox, lock, and number
  const optionContainer = document.createElement('div');
  optionContainer.classList.add('spacing-class');

  // Create a new container for the elements you want to have specific spacing
  const elementsContainer = document.createElement('div');
  elementsContainer.classList.add('elements-container');

  // Add the include/exclude checkbox and label
  const includeContainer = document.createElement('div');
  includeContainer.classList.add('option-container');

  const includeLabel = document.createElement('label');
  includeLabel.classList.add('switch');

  const includeCheckbox = document.createElement('input');
  includeCheckbox.setAttribute('type', 'checkbox');
  includeCheckbox.classList.add('ml-2', 'include-category');
  includeCheckbox.checked = true;  // By default, all categories are included
  includeCheckbox.title = 'Toggle to Include or Exclude Category from the Prompt Generation Operation. Shift + Alt + U'; // Set the title attribute

  const slider = document.createElement('div');
  slider.classList.add('slider');
  slider.title = 'Toggle to Include or Exclude Category from the Prompt Generation Operation. Shift + Alt + U'; // Set the title attribute

  includeCheckbox.addEventListener('input', function () {
    header.classList.toggle('category-header-excluded', !this.checked);
    container.classList.toggle('category-excluded', !this.checked);
    textarea.classList.toggle('desaturated-textarea', !this.checked);
    optionContainer.classList.toggle('desaturated-container', !this.checked);
  });

  includeLabel.appendChild(includeCheckbox);
  includeLabel.appendChild(slider);

  const includeText = document.createTextNode(' Include');  // Added space for clarity
  includeContainer.appendChild(includeLabel);
  includeContainer.appendChild(includeText);

  optionContainer.appendChild(includeContainer);

  // Add the lock checkbox
  const lockContainer = document.createElement('div');
  lockContainer.classList.add('option-container');

  const lockLabel = document.createElement('label');
  lockLabel.classList.add('switch');

  const lockCheckbox = document.createElement('input');
  lockCheckbox.setAttribute('type', 'checkbox');
  lockCheckbox.classList.add('ml-2', 'lock-category');
  lockCheckbox.checked = false;  // Set the checkbox to be unchecked by default
  lockCheckbox.title = 'Shortcut: Shift + Alt + K'; // Set the title attribute

  // Add an "onchange" event listener to the checkbox
  lockCheckbox.onchange = function () {
    // When the checkbox is changed, set the "readonly" attribute of the textarea
    textarea.readOnly = this.checked;

    // If the checkbox is checked, add the "locked-textarea" class, otherwise remove it
    if (this.checked) {
      textarea.classList.add('locked-textarea');
    } else {
      textarea.classList.remove('locked-textarea');
    }
  };

  // Set the textarea's readOnly property to the checkbox's checked property
  textarea.readOnly = lockCheckbox.checked;

  const lockSlider = document.createElement('div');
  lockSlider.classList.add('slider');
  lockSlider.title = 'Lock Text Area to Prevent Modification. Shift + Alt + K'; // Set the title attribute

  lockLabel.appendChild(lockCheckbox);
  lockLabel.appendChild(lockSlider);

  const lockText = document.createTextNode(' Lock'); // Added space for clarity
  lockContainer.appendChild(lockLabel);
  lockContainer.appendChild(lockText);

  optionContainer.appendChild(lockContainer);

  // Add the number of words input
  const numberContainer = document.createElement('div');
  numberContainer.classList.add('option-container');

  const numberLabel = document.createElement('label');
  numberLabel.textContent = ' Number of Words:'; // Added space for clarity
  numberLabel.style.textTransform = 'none'; // Remove text-transform inline
  numberLabel.style.fontWeight = 'bold'; // Remove font-weight inline

  const numberInput = document.createElement('input');
  numberInput.setAttribute('type', 'number');
  numberInput.setAttribute('min', '0');  // Change the min to '0'
  numberInput.setAttribute('max', '500');
  numberInput.classList.add('w-16', 'ml-2');
  numberInput.value = 1;  // Set the initial value to '0'
  numberInput.title = 'Number of Words to be Drawn for the Generation of the Prompt'

  numberInput.addEventListener('input', () => {
    if (numberInput.value > 500) {
      numberInput.value = 500;
    }
    if (numberInput.value < 0) {  // Add this block to prevent negative numbers
      numberInput.value = 0;
    }
  });

  numberLabel.appendChild(numberInput);
  numberContainer.appendChild(numberLabel);
  optionContainer.appendChild(numberContainer);
  container.appendChild(optionContainer);

  // Append the existing elements to this new container
  elementsContainer.appendChild(includeContainer);
  elementsContainer.appendChild(lockContainer);
  elementsContainer.appendChild(numberContainer);

  // Append this new container to the optionContainer
  optionContainer.appendChild(elementsContainer);

  // Add the duplicate button
  const duplicateButton = document.createElement('button');
  duplicateButton.textContent = 'Duplicate';
  duplicateButton.classList.add('button', 'duplicate-btn'); // Set a class for the button
  duplicateButton.title = 'Duplicate Category Container. Shift + Alt + B'; // Set the title attribute
  duplicateButton.onclick = () => {
    // Duplicate the category
    duplicateCategory(container);
  };
  optionContainer.appendChild(duplicateButton);

  // Add to template button
  const addToTemplateButton = document.createElement('button');
  addToTemplateButton.textContent = 'Add to Template';
  addToTemplateButton.classList.add('button', 'add-template-btn');
  addToTemplateButton.title = 'Add this category to the template. Shift + Alt + T'; // Set the title attribute
  addToTemplateButton.onclick = () => {
    appendCategoryToTemplate(categoryName);

    // Add the fade-in-animation-container class to the container
    const container = addToTemplateButton.closest('.category-container');
    container.classList.add('fade-in-animation-container');
    setTimeout(() => {
      container.classList.remove('fade-in-animation-container');
    }, 100);
  };

  // Append the addToTemplateButton to the optionContainer
  optionContainer.appendChild(addToTemplateButton);

  // Put the remove button inside the optionContainer
  const removeButton = document.createElement('button');
  removeButton.textContent = 'Delete Category';
  removeButton.classList.add('button', 'remove-btn'); // Use 'button' class instead of 'soft-ui-button'
  removeButton.title = 'Delete Category Container. Shift + Alt + X'; // Set the title attribute
  removeButton.onclick = () => {
    const categoryId = container.id;
    const removedCategory = document.getElementById(categoryId);

    // Get the index of the removed category
    const index = Array.from(categoriesContainer.children).indexOf(removedCategory);

    // Store the removed category and its original index
    removedCategories.push({ category: removedCategory, index: index });

    // Remove the category
    container.remove();
    updateAllMoveButtons();
  };
  removeButton.classList.add('category-remove-button'); // Add class for selecting

  // Append the removeButton to the optionContainer
  optionContainer.appendChild(removeButton);

  // Append the optionContainer to the main container
  container.appendChild(optionContainer);

  // Drag and drop event handlers (attach to the name element, not the whole header)
  headerName.addEventListener('dragstart', dragStart);
  headerName.addEventListener('dragover', dragOver);
  headerName.addEventListener('drop', drop);
  headerName.addEventListener('dragend', dragEnd); // New event handler
  headerName.addEventListener('dragleave', dragLeave); // New event handler

  return container;
}

function dragStart(event) {
  if (event.target.classList.contains('category-header-name')) {
    dragCategory = event.target.closest('.category-container');
    dragCategory.classList.add('dragging');
  }
}

function dragOver(event) {
  if (dragCategory) {
    event.preventDefault();
    // Highlight the potential drop target
    const targetCategory = event.target.closest('.category-container');
    if (targetCategory) {
      targetCategory.classList.add('over');
    }
  }
}

function drop(event) {
  if (dragCategory) {
    event.preventDefault();
    const targetCategory = event.target.closest('.category-container');
    const categoriesContainer = targetCategory.parentNode;
    const rect = targetCategory.getBoundingClientRect();
    const dropPosition = event.clientY - rect.top > rect.height / 2 ? 'after' : 'before';

    // Remove the highlighting from the drop target
    targetCategory.classList.remove('over');

    if (dropPosition === 'after') {
      categoriesContainer.insertBefore(dragCategory, targetCategory.nextSibling);
    } else {
      categoriesContainer.insertBefore(dragCategory, targetCategory);
    }

    // Remove the dragging style from the dropped item
    dragCategory.classList.remove('dragging');
    updateAllMoveButtons();
    dragCategory = null;
  }
}

function dragEnd(event) {
  if (dragCategory) {
    // Remove the dragging style from the dragged item
    dragCategory.classList.remove('dragging');
    dragCategory = null;
  }
}

function dragLeave(event) {
  if (dragCategory) {
    // Remove the over class when the dragged item leaves a potential drop target
    const targetCategory = event.target.closest('.category-container');
    if (targetCategory) {
      targetCategory.classList.remove('over');
    }
  }
}

function moveCategoryUp(container) {
  const categoriesContainer = container.parentNode;
  const previousSibling = container.previousElementSibling;
  if (previousSibling) {
    categoriesContainer.insertBefore(container, previousSibling);
    updateMoveButtons(container);
    updateMoveButtons(previousSibling);
  }
}

function moveCategoryDown(container) {
  const categoriesContainer = container.parentNode;
  const nextSibling = container.nextElementSibling;
  if (nextSibling) {
    categoriesContainer.insertBefore(nextSibling, container);
    updateMoveButtons(container);
    updateMoveButtons(nextSibling);
  }
}

function updateMoveButtons(container) {
  const categoriesContainer = container.parentNode;
  const upButton = container.querySelector('.category-move-up');
  const downButton = container.querySelector('.category-move-down');
  
  if (upButton && downButton) {
    const isFirst = !container.previousElementSibling;
    const isLast = !container.nextElementSibling;
    
    upButton.disabled = isFirst;
    downButton.disabled = isLast;
  }
}

function updateAllMoveButtons() {
  const categories = document.querySelectorAll('.category-container');
  categories.forEach(container => updateMoveButtons(container));
}

function duplicateCategory(activeCategory) {
  // Extract the original category name
  let originalCategoryName = activeCategory.querySelector('.category-header-name').textContent;

  let duplicateCategoryName = originalCategoryName;
  let duplicateCount = 2;

  // Create a list of all existing category names
  let existingCategoryNames = Array.from(document.querySelectorAll('.category-header-name')).map(header => header.textContent);

  // Continue incrementing the duplicate count until we find a name that doesn't exist
  while (existingCategoryNames.includes(duplicateCategoryName + duplicateCount)) {
    duplicateCount++;
  }

  duplicateCategoryName = originalCategoryName + duplicateCount;

  // Create a new category with the duplicated name
  const categoryComponent = createCategoryComponent(duplicateCategoryName);

  // Add the fade-in-animation class to the new category container
  categoryComponent.classList.add('fade-in-animation-btn');

  // Copy the contents of the original category to the duplicated category
  let originalTextArea = activeCategory.querySelector('textarea');
  let duplicateTextArea = categoryComponent.querySelector('textarea');
  duplicateTextArea.value = originalTextArea.value;

  // Copy the state of the 'include' and 'lock' checkboxes
  let originalIncludeCheckbox = activeCategory.querySelector('.include-category');
  let duplicateIncludeCheckbox = categoryComponent.querySelector('.include-category');
  duplicateIncludeCheckbox.checked = originalIncludeCheckbox.checked;

  let originalLockCheckbox = activeCategory.querySelector('.lock-category');
  let duplicateLockCheckbox = categoryComponent.querySelector('.lock-category');
  duplicateLockCheckbox.checked = originalLockCheckbox.checked;

  // Trigger the onchange event for the lock checkbox
  duplicateLockCheckbox.dispatchEvent(new Event('change'));
  duplicateIncludeCheckbox.dispatchEvent(new Event('input'));

  // Find the index of the active category
  let activeCategoryIndex = Array.from(categoriesContainer.children).indexOf(activeCategory);

  // Find the position of the last duplicate of the active category
  let insertIndex = activeCategoryIndex + 1;
  while (insertIndex < categoriesContainer.children.length &&
    categoriesContainer.children[insertIndex].querySelector('.category-header-name').textContent.startsWith(originalCategoryName)) {
    insertIndex++;
  }

  // Insert the new category at the correct position
  if (insertIndex < categoriesContainer.children.length) {
    categoriesContainer.insertBefore(categoryComponent, categoriesContainer.children[insertIndex]);
  } else {
    categoriesContainer.appendChild(categoryComponent);
  }
  updateAllMoveButtons();
}

function addCategory() {
  const categoryName = prompt('Enter the category name:');
  if (!categoryName) return;

  // Transform to uppercase and limit to 2000 characters
  const formattedCategoryName = categoryName.toUpperCase().substring(0, 2000);

  // Check if a category with the same name already exists
  const existingCategory = document.querySelector(`textarea[data-category='${formattedCategoryName}']`);
  if (existingCategory) {
    // If it does, show a warning and ask the user to confirm
    const confirmDuplicate = confirm(`A category named "${formattedCategoryName}" already exists. Are you sure you want to add another one?`);
    if (!confirmDuplicate) return;
  }

  const categoryComponent = createCategoryComponent(formattedCategoryName);
  categoriesContainer.appendChild(categoryComponent);
  updateAllMoveButtons();
}

function removeAllCategories() {
  const categoriesContainer = document.getElementById('categories');

  // Store the removed categories along with their original index
  removedCategories = Array.from(categoriesContainer.children).map((child, index) => ({ element: child, originalIndex: index }));

  // Remove all existing categories
  while (categoriesContainer.firstChild) {
    categoriesContainer.removeChild(categoriesContainer.firstChild);
  }
}

function undoRemove() {
  if (removedCategories.length > 0) {
    const lastRemoved = removedCategories.pop();

    // If the removed category was the last in the list, we can append it
    if (lastRemoved.index === categoriesContainer.children.length) {
      categoriesContainer.appendChild(lastRemoved.category);
    } else {
      // Otherwise, we insert it at the original position
      categoriesContainer.insertBefore(lastRemoved.category, categoriesContainer.children[lastRemoved.index]);
    }
    updateAllMoveButtons();
  }
}

function undoRemoveAll() {
  const categoriesContainer = document.getElementById('categories');

  // Restore all removed categories to their original positions
  // Sort the removedCategories array in reverse order of originalIndex before reinserting,
  // to ensure elements are inserted in the correct position
  removedCategories.sort((a, b) => b.originalIndex - a.originalIndex);
  while (removedCategories.length > 0) {
    const { element, originalIndex } = removedCategories.pop();
    if (originalIndex < categoriesContainer.children.length) {
      categoriesContainer.insertBefore(element, categoriesContainer.children[originalIndex]);
    } else {
      categoriesContainer.appendChild(element);
    }
  }
  updateAllMoveButtons();
}

// ============================================================================
// TEXT EDITING & UNDO/REDO
// ============================================================================

function handleInput(event) {
  const textarea = event.target;
  const categoryId = textarea.id;
  const currentState = textarea.value;

  // Initialize the undo stack for this textarea if it doesn't exist
  if (!textUndoStack[categoryId]) textUndoStack[categoryId] = [];

  // Store the current text state
  textUndoStack[categoryId].push(currentState);

  // Initialize the redo stack for this textarea if it doesn't exist
  if (!textRedoStack[categoryId]) textRedoStack[categoryId] = [];

  // Clear the redo stack
  textRedoStack[categoryId].length = 0;
}

function handleKeyDown(event) {
  const textarea = event.target;
  const categoryId = textarea.id;

  if (!textUndoStack[categoryId]) textUndoStack[categoryId] = [];
  if (!textRedoStack[categoryId]) textRedoStack[categoryId] = [];

  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();

    if (textUndoStack[categoryId].length > 1) {
      const currentState = textUndoStack[categoryId].pop();
      textRedoStack[categoryId].push(currentState);

      const previousState = textUndoStack[categoryId][textUndoStack[categoryId].length - 1];
      if (previousState !== undefined) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const removedText = currentState.slice(previousState.length);
        textarea.value = previousState;

        if (start !== end) {
          // If there was a selection, restore the selection range
          textarea.setSelectionRange(start, end);
        } else {
          // If there was no selection, adjust the cursor position
          const cursorPos = previousState.length - (currentState.length - start);
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }
  }

  if (event.ctrlKey && event.key === 'y') {
    event.preventDefault();

    if (textRedoStack[categoryId].length > 0) {
      const nextState = textRedoStack[categoryId].pop();
      textUndoStack[categoryId].push(nextState);

      if (nextState !== undefined) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const removedText = nextState.slice(textarea.value.length);
        textarea.value = nextState;

        if (start !== end) {
          // If there was a selection, restore the selection range
          textarea.setSelectionRange(start, end);
        } else {
          // If there was no selection, adjust the cursor position
          const cursorPos = nextState.length - (textarea.value.length - start);
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }
  }

  // Limit the size of the undo stack to 100 states
  for (const categoryId in textUndoStack) {
    while (textUndoStack[categoryId] && textUndoStack[categoryId].length > 100) {
      textUndoStack[categoryId].shift();
    }
  }

  // Limit the size of the redo stack to 50 states
  for (const categoryId in textRedoStack) {
    while (textRedoStack[categoryId] && textRedoStack[categoryId].length > 50) {
      textRedoStack[categoryId].shift();
    }
  }
}

// Create category components and append them to the categories container
categoryNames.forEach(categoryName => {
  const categoryComponent = createCategoryComponent(categoryName);
  categoriesContainer.appendChild(categoryComponent);
});
// Update move buttons after all categories are created
setTimeout(() => updateAllMoveButtons(), 0);
ensureTemplateCardExists();
initializeAIAssistant();

// ============================================================================
// KEYBOARD SHORTCUTS - Consolidated hotkey handler
// ============================================================================
// All Shift+Alt keyboard shortcuts are handled in one place for better organization
// ============================================================================

document.addEventListener('keydown', function (event) {
  // Only process if both Shift and Alt are held down
  if (!event.shiftKey || !event.altKey) {
    return;
  }

  // Get active textarea for context-aware operations
  const textarea = document.activeElement;
  const isTextarea = textarea.tagName === 'TEXTAREA';
  const category = isTextarea ? textarea.closest('.category') : null;

  // ========================================================================
  // UNDO/REDO OPERATIONS
  // ========================================================================
  switch (event.code) {
    case 'KeyQ': // Undo Clear All
      undoClearAll();
      event.preventDefault();
      return;
    case 'KeyE': // Undo Remove (single category)
      undoRemove();
      event.preventDefault();
      return;
    case 'Digit5': // Undo Remove All (all categories)
      undoRemoveAll();
      event.preventDefault();
      return;
  }

  // ========================================================================
  // CATEGORY OPERATIONS (Context-aware - requires textarea focus)
  // ========================================================================
  if (isTextarea && category) {
    switch (event.key.toLowerCase()) {
      case 'k': // Toggle Lock for active category
        const lockCheckbox = category.querySelector('.lock-category');
        if (lockCheckbox) {
          lockCheckbox.checked = !lockCheckbox.checked;
          lockCheckbox.dispatchEvent(new Event('change'));
        }
        event.preventDefault();
        return;

      case 'u': // Toggle Include/Exclude for active category
        const includeCheckbox = category.querySelector('.include-category');
        if (includeCheckbox) {
          includeCheckbox.checked = !includeCheckbox.checked;
          includeCheckbox.dispatchEvent(new Event('input'));
        }
        event.preventDefault();
        return;

      case 'x': // Delete active category
        const removeButton = category.querySelector('.category-remove-button');
        if (removeButton) {
          const index = Array.from(categoriesContainer.children).indexOf(category);
          removedCategories.push({ category: category, index: index });
          category.remove();
        }
        event.preventDefault();
        return;

      case 't': // Add active category to template
        const categoryName = category.querySelector('.category-header-name').textContent;
        appendCategoryToTemplate(categoryName);
        
        // Add animation
        category.classList.add('fade-in-animation-container');
        setTimeout(() => {
          category.classList.remove('fade-in-animation-container');
        }, 500);
        event.preventDefault();
        return;

      case 'b': // Duplicate active category
        duplicateCategory(category);
        event.preventDefault();
        return;
    }
  }

  // ========================================================================
  // TEMPLATE OPERATIONS
  // ========================================================================
  switch (event.key.toLowerCase()) {
    case 'a': // Add all included categories to template
      addAllToTemplate();
      event.preventDefault();
      return;
  }

  // ========================================================================
  // FILE OPERATIONS
  // ========================================================================
  switch (event.code) {
    case 'KeyS': // Save Custom Prompts (to file)
      saveCustomPrompts();
      event.preventDefault();
      return;
    case 'KeyO': // Load Custom Prompts (from file)
      loadCustomPrompts();
      event.preventDefault();
      return;
    case 'KeyM': // Save All (to localStorage)
      saveAll();
      event.preventDefault();
      return;
    case 'Digit2': // Add Custom Prompts (append from file)
      addCustomPrompts();
      event.preventDefault();
      return;
  }

  // ========================================================================
  // LAYOUT OPERATIONS
  // ========================================================================
  switch (event.code) {
    case 'KeyD': // Restore Default Layout
      restoreDefaultLayout();
      event.preventDefault();
      return;
    case 'Digit4': // Restore Advanced Layout
      restoreAdvancedLayout();
      event.preventDefault();
      return;
    case 'Digit0': // Restore Default Layout with Template
      restoreDefaultLayoutWithTemplate();
      event.preventDefault();
      return;
  }

  // ========================================================================
  // GENERAL OPERATIONS
  // ========================================================================
  switch (event.code) {
    case 'KeyC': // Clear All
      clearAll();
      event.preventDefault();
      return;
    case 'KeyW': // Randomize fields
      populateFieldsRandomly();
      event.preventDefault();
      return;
    case 'KeyG': // Generate prompts
      generatePrompts();
      event.preventDefault();
      return;
    case 'KeyH': // Clear History
      clearHistory();
      event.preventDefault();
      return;
    case 'KeyL': // Toggle Lock All categories
      toggleLockAll();
      event.preventDefault();
      return;
    case 'KeyP': // Toggle Include/Exclude All categories
      toggleIncludeAll();
      event.preventDefault();
      return;
    case 'KeyN': // Add new category
      addCategory();
      event.preventDefault();
      return;
    case 'KeyY': // Remove All categories
      removeAllCategories();
      event.preventDefault();
      return;
    case 'Digit7': // Toggle spellcheck
      toggleSpellcheck();
      event.preventDefault();
      return;
  }
});

// ============================================================================
// PROMPT GENERATION & HISTORY
// ============================================================================

function generatePrompts() {
  const numPrompts = parseInt(document.getElementById('numPrompts').value, 10);

  // Reset last index tracking for each new batch of prompts
  lastIndexByCategory = {};

  const categories = document.querySelectorAll('.category');
  const categoryData = Array.from(categories).map(category => {
    const words = category.querySelector('textarea').value.split(',').map(word => word.trim()).filter(word => word);
    const numWords = parseInt(category.querySelector('input[type="number"]').value, 10);
    const includeCategory = category.querySelector('.include-category').checked;
    const name = category.querySelector('label').textContent.slice(0, -1); // Remove colon at the end
    return { words, numWords, includeCategory, name };
  });

  const defaultTemplate = categoryData.filter(category => category.includeCategory).map(category => `[${category.name}]`).join(', ');
  const activeTemplateCards = getTemplateCards().filter(card => card.querySelector('.template-active')?.checked);

  const generatedPromptsContainer = document.getElementById('generatedPrompts');
  generatedPromptsContainer.innerHTML = '';

  const promptHistoryContainer = document.getElementById('promptHistory');
  for (let i = 0; i < numPrompts; i++) {
    let promptTemplate = '';
    if (activeTemplateCards.length > 0) {
      const randomCard = activeTemplateCards[Math.floor(Math.random() * activeTemplateCards.length)];
      const textarea = randomCard.querySelector('.template-text');
      promptTemplate = textarea ? textarea.value : '';
    }

    if (!promptTemplate) {
      promptTemplate = defaultTemplate;
    }

    const prompt = generatePrompt(categoryData, promptTemplate);
    const promptElement = document.createElement('div');
    promptElement.classList.add('mb-3');

    // Create a div to hold the textBox and copyButton
    const textBoxContainer = document.createElement('div');
    textBoxContainer.classList.add('textBoxContainer');

    // Create a read-only text box for the generated prompt
    const textBox = document.createElement('textarea');
    textBox.value = prompt;
    textBox.classList.add('form-control', 'me-2', 'prompt-output');
    textBox.readOnly = true;

    // Call the function to adjust the height of the textarea
    setTimeout(() => autoAdjustTextareaHeight(textBox), 0);

    // Add an event listener to adjust the height when the content changes
    textBox.addEventListener('input', () => autoAdjustTextareaHeight(textBox));

    // Create the "Copy" button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.classList.add('button', 'copy-btn'); // Use 'button' class instead of 'soft-ui-button'
    copyButton.title = 'Copy Generated Prompt to Clipboard'
    copyButton.onclick = () => {
      navigator.clipboard.writeText(prompt);
    };    

    // Add the textBox to the container
    textBoxContainer.appendChild(textBox);
    
    // Add the copyButton to the container
    textBoxContainer.appendChild(copyButton);

    // Add the container to the promptElement
    promptElement.appendChild(textBoxContainer);

    generatedPromptsContainer.appendChild(promptElement);
    promptHistoryContainer.innerHTML += prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '<br>';
  }
}

function autoAdjustTextareaHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight + 5) + 'px';  // Add 10px to the height
}

function generatePrompt(categoryData, template) {
  // Create a map for easier category word access
  const categoryMap = categoryData.reduce((map, category) => {
    map[category.name] = category.includeCategory ? getRandomWords(category.words, category.numWords, category.name) : [];
    return map;
  }, {});

  let prompt = template;

  // Replace category placeholders with actual words
  for (let category in categoryMap) {
    const regex = new RegExp(`\\[${category}\\]`, 'gi'); // added 'i' flag for case insensitive matching
    prompt = prompt.replace(regex, categoryMap[category].join(', '));
  }

  return prompt;
}

function pickIndexWithRandomness(wordArray, categoryKey) {
  const n = wordArray.length;
  if (n === 0) return -1;
  if (n === 1) {
    lastIndexByCategory[categoryKey] = 0;
    return 0;
  }

  // Deterministic start when randomness is low so the first draw is stable
  if (!(categoryKey in lastIndexByCategory)) {
    const startIndex = randomness < 0.35 ? 0 : Math.floor(Math.random() * n);
    lastIndexByCategory[categoryKey] = startIndex;
    return startIndex;
  }

  const lastIndex = lastIndexByCategory[categoryKey];

  // Full chaos: jump anywhere
  if (randomness >= 0.999) {
    const idx = Math.floor(Math.random() * n);
    lastIndexByCategory[categoryKey] = idx;
    return idx;
  }

  // Max step size grows non-linearly with randomness (small values keep steps tiny)
  const maxStep = Math.max(1, Math.floor(Math.pow(randomness, 2) * (n - 1))); // 1 .. n-1

  // Small jump around last index
  const step = Math.floor(Math.random() * (2 * maxStep + 1)) - maxStep; // [-maxStep, +maxStep]
  let newIndex = lastIndex + step;

  // Clamp into range
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= n) newIndex = n - 1;

  lastIndexByCategory[categoryKey] = newIndex;
  return newIndex;
}

function getRandomWords(wordArray, numWords, categoryKey) {
  if (numWords <= 0) return [];

  // If numWords is equal to or greater than the length of wordArray, return wordArray
  if (numWords >= wordArray.length) {
    return wordArray;
  }

  // Sequential mode: walk the list without jumping
  if (randomness === 0) {
    const n = wordArray.length;
    const startIndex = ((lastIndexByCategory[categoryKey] ?? -1) + 1) % n;
    const sequentialWords = [];

    for (let i = 0; i < numWords; i++) {
      sequentialWords.push(wordArray[(startIndex + i) % n]);
    }

    // Advance the pointer so the next call continues where we left off
    lastIndexByCategory[categoryKey] = (startIndex + numWords - 1) % n;
    return sequentialWords;
  }

  // Get the base index for this category selection (only update once per selection)
  let baseIndex = pickIndexWithRandomness(wordArray, categoryKey);
  
  let randomWords = [];
  let usedIndices = new Set(); // Track which original indices we've used to avoid duplicates

  for (let i = 0; i < numWords; i++) {
    // Build list of available indices
    const availableIndices = [];
    for (let j = 0; j < wordArray.length; j++) {
      if (!usedIndices.has(j)) {
        availableIndices.push(j);
      }
    }
    
    if (availableIndices.length === 0) {
      break;  // No more words available
    }

    let targetIndex;
    
    // If baseIndex is available, use it or find nearby available index
    if (availableIndices.includes(baseIndex)) {
      targetIndex = baseIndex;
    } else {
      // Find the closest available index to baseIndex
      let minDistance = Infinity;
      let closestIndex = availableIndices[0];
      
      for (const idx of availableIndices) {
        const distance = Math.abs(idx - baseIndex);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      }
      targetIndex = closestIndex;
    }
    
    usedIndices.add(targetIndex);
    randomWords.push(wordArray[targetIndex]);
  }

  return randomWords;
}

function clearHistory() {
  const promptHistoryContainer = document.getElementById('promptHistory');
  promptHistoryContainer.innerHTML = '';
}

function clearAll() {
  const categories = document.querySelectorAll('.category');
  removedText = {}; // Clear the previously removed text

  categories.forEach(category => {
    const lockCheckbox = category.querySelector('.lock-category');
    const textarea = category.querySelector('textarea');
    if (!lockCheckbox.checked) {
      removedText[category.id] = textarea.value; // Store the removed text
      textarea.value = ''; // Clear the textarea
    }
  });

  // Clear the "generatedPrompts" container
  const generatedPromptsContainer = document.getElementById('generatedPrompts');
  generatedPromptsContainer.innerHTML = '';

  // Clear the history
  clearHistory();
}

function undoClearAll() {
  const categories = document.querySelectorAll('.category');
  categories.forEach(category => {
    const categoryId = category.id;
    const textarea = category.querySelector('textarea');
    if (removedText.hasOwnProperty(categoryId)) {
      textarea.value = removedText[categoryId]; // Restore the removed text
    }
  });

  removedText = {}; // Clear the stored removed text
}

// ============================================================================
// RANDOMIZER
// ============================================================================

function populateFieldsRandomly(specificCategory) {
  // Get the number of words to insert from the new input field
  const numWordsToInsert = document.getElementById('numWords').value;

  // Extract the base category name without the numeric suffix if specificCategory is defined
  let baseCategory = specificCategory ? specificCategory.replace(/\d+$/, '') : undefined;

  // Loop through each key in the data object
  for (const key in data) {
    // If a specific category is specified, and this isn't it, skip it
    if (specificCategory !== undefined && key !== specificCategory) continue;

    // Get the corresponding textarea element by ID
    const textareas = document.querySelectorAll(`textarea[data-category='${key}']`);

    textareas.forEach(textarea => {
      const categoryElement = textarea.closest('.category');
      const lockCheckbox = categoryElement.querySelector('.lock-category');
      const includeCheckbox = categoryElement.querySelector('.include-category');

      // If the lock checkbox is not checked and the include checkbox is checked, randomize the textarea value
      if (!lockCheckbox.checked && includeCheckbox.checked) {
        // Create an empty array to store the selected words
        const selectedWords = [];
        let dataCopy = [...data[key]]; // Copy the array

        // Add random words to the array
        for (let i = 0; i < numWordsToInsert && dataCopy.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * dataCopy.length);
          selectedWords.push(dataCopy[randomIndex]);
          dataCopy.splice(randomIndex, 1); // Remove the selected word from the copy
        }

        // Set the textarea's value to the selected words, joined by commas
        textarea.value = selectedWords.join(', ');
        // Save the new state
        if (!textUndoStack[textarea.id]) textUndoStack[textarea.id] = [];
        textUndoStack[textarea.id].push(textarea.value);
      }
    });

  }
}

// ============================================================================
// PERSISTENCE: FILES
// ============================================================================

async function saveCustomPrompts() {
  const categories = document.querySelectorAll('.category');
  const categoryData = Array.from(categories).map(category => {
    const words = category.querySelector('textarea').value;
    const numWords = category.querySelector('input[type="number"]').value;
    const categoryName = category.querySelector('label').textContent.replace(':', '');
    const isChecked = category.querySelector('.include-category').checked;
    const isLocked = category.querySelector('.lock-category').checked;
    return { categoryName, words, numWords, isChecked, isLocked }; // Include checkbox states
  });

  const templatePrompt = collectTemplateData();

  const data = JSON.stringify({ categories: categoryData, template: templatePrompt }, null, 2);
  const file = new File([data], 'custom-prompts.json', { type: 'application/json' });

  const opts = {
    types: [
      {
        description: 'JSON Files',
        accept: {
          'application/json': ['.json'],
        },
      },
    ],
  };

  try {
    // Try the new File System Access API first
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      alert('Custom prompts saved!');
    } else {
      // Fall back to older method if File System Access API is not supported
      const fileURL = URL.createObjectURL(file);

      const link = document.createElement('a');
      link.href = fileURL;
      link.download = 'custom-prompts.json';
      document.body.appendChild(link); // This line is needed for Firefox
      link.click();
      document.body.removeChild(link); // Cleanup
    }
  } catch (error) {
    console.error(error);
  }
}

function loadCustomPrompts() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const data = JSON.parse(e.target.result);
      const categories = document.getElementById('categories');

      // Clear existing categories before re-creating them
      while (categories.firstChild) {
        categories.firstChild.remove();
      }

      data.categories.forEach((categoryData) => {
        // Always create the category
        let category = createCategoryComponent(categoryData.categoryName);
        categories.appendChild(category);
        const textarea = category.querySelector('textarea');
        textarea.value = categoryData.words;
        // Save the initial state
        if (!textUndoStack[textarea.id]) textUndoStack[textarea.id] = [];
        textUndoStack[textarea.id].push(textarea.value);

        category.querySelector('input[type="number"]').value = categoryData.numWords;

        const includeCheckbox = category.querySelector('.include-category');
        includeCheckbox.checked = categoryData.isChecked;
        includeCheckbox.dispatchEvent(new Event('input')); // Manually trigger the oninput event

        category.querySelector('.include-category').checked = categoryData.isChecked;
        const lockCheckbox = category.querySelector('.lock-category');
        lockCheckbox.checked = categoryData.isLocked;
        lockCheckbox.dispatchEvent(new Event('change')); // Manually trigger the onchange event
      });

      const templatePayload = data.templates ?? data.template;
      setTemplateCardsFromData(templatePayload);

      // Update move buttons after loading
      setTimeout(() => updateAllMoveButtons(), 0);
    };
    reader.readAsText(file);
  });

  input.click();
}

function addCustomPrompts() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const data = JSON.parse(e.target.result);
      const categories = document.getElementById('categories');
      data.categories.forEach((categoryData) => {
        let category = Array.from(categories.children).find(category => category.querySelector('label').textContent.replace(':', '') === categoryData.categoryName);
        if (!category) {
          category = createCategoryComponent(categoryData.categoryName, categoryData.duplicateCount);
          categories.appendChild(category);
        } else {
          const existingCount = duplicateCounters[categoryData.categoryName] || 1;
          duplicateCounters[categoryData.categoryName] = Math.max(existingCount, categoryData.duplicateCount);
        }
        const textarea = category.querySelector('textarea');
        textarea.value += '\n' + categoryData.words; // Append the loaded text
        // Save the initial state
        if (!textUndoStack[textarea.id]) textUndoStack[textarea.id] = [];
        textUndoStack[textarea.id].push(textarea.value);

        category.querySelector('input[type="number"]').value = categoryData.numWords;

        const includeCheckbox = category.querySelector('.include-category');
        includeCheckbox.checked = categoryData.isChecked;
        includeCheckbox.dispatchEvent(new Event('input')); // Manually trigger the oninput event

        category.querySelector('.include-category').checked = categoryData.isChecked;
        const lockCheckbox = category.querySelector('.lock-category');
        lockCheckbox.checked = categoryData.isLocked;
        lockCheckbox.dispatchEvent(new Event('change')); // Manually trigger the onchange event
      });

      const templatePayload = data.templates ?? data.template;
      if (templatePayload !== undefined) {
        setTemplateCardsFromData(templatePayload, { append: true });
      }
      
      // Update move buttons after adding
      setTimeout(() => updateAllMoveButtons(), 0);
    };
    reader.readAsText(file);
  });

  input.click();
}

// ============================================================================
// PERSISTENCE: LOCALSTORAGE
// ============================================================================

function saveAll() {
  const categories = document.querySelectorAll('.category');
  const categoryData = Array.from(categories).map(category => {
    const words = category.querySelector('textarea').value;
    const numWords = category.querySelector('input[type="number"]').value;
    const categoryName = category.querySelector('label').textContent.replace(':', '');
    const isChecked = category.querySelector('.include-category').checked;
    const isLocked = category.querySelector('.lock-category').checked;
    return { categoryName, words, numWords, isChecked, isLocked }; // Include checkbox states };
  });

  const templatePrompt = collectTemplateData();

  localStorage.setItem('categoryData', JSON.stringify({ categories: categoryData, template: templatePrompt }));
  alert('Saved!');
}

window.addEventListener('load', () => {
  const savedData = localStorage.getItem('categoryData');
  if (!savedData) return;

  const data = JSON.parse(savedData);
  const categories = document.getElementById('categories');

  // Clear existing categories before re-creating them
  while (categories.firstChild) {
    categories.firstChild.remove();
  }

  data.categories.forEach((categoryData) => {
    // Always create the category
    let category = createCategoryComponent(categoryData.categoryName);
    categories.appendChild(category);
    category.querySelector('textarea').value = categoryData.words;
    category.querySelector('input[type="number"]').value = categoryData.numWords;

    const includeCheckbox = category.querySelector('.include-category');
    includeCheckbox.checked = categoryData.isChecked;
    includeCheckbox.dispatchEvent(new Event('input')); // Manually trigger the oninput event

    const lockCheckbox = category.querySelector('.lock-category');
    lockCheckbox.checked = categoryData.isLocked;
    lockCheckbox.dispatchEvent(new Event('change')); // Manually trigger the onchange event

    // Add initial state to undo stack for each text area
    if (!textUndoStack[categoryData.categoryName]) textUndoStack[categoryData.categoryName] = [];
    textUndoStack[categoryData.categoryName].push(categoryData.words);
  });

  const templatePayload = data.templates ?? data.template;
  setTemplateCardsFromData(templatePayload);
  
  // Update move buttons after loading from localStorage
  setTimeout(() => updateAllMoveButtons(), 0);
});

// ============================================================================
// LAYOUT & VIEW HELPERS
// ============================================================================

function restoreDefaultLayout() {
  const categoriesContainer = document.getElementById('categories');

  // Remove all existing categories
  while (categoriesContainer.firstChild) {
    categoriesContainer.removeChild(categoriesContainer.firstChild);
  }

  // Re-create the default categories
  for (const categoryName of categoryNames) {
    const categoryComponent = createCategoryComponent(categoryName);
    categoriesContainer.appendChild(categoryComponent);
  }
  
  // Update move buttons after restoring
  setTimeout(() => updateAllMoveButtons(), 0);
}

function restoreAdvancedLayout() {
  const categoriesContainer = document.getElementById('categories');

  // Create a list of existing category names
  const existingCategoryNames = Array.from(categoriesContainer.children).map(category => category.querySelector('label').textContent.replace(':', ''));

  // Re-create the advanced categories only if they do not already exist
  for (const categoryName of advancedCategoryNames) {
    if (!existingCategoryNames.includes(categoryName)) {
      const categoryComponent = createCategoryComponent(categoryName);
      categoriesContainer.appendChild(categoryComponent);

      // populate this category with random words
      populateFieldsRandomly(categoryName);
    }
  }
  
  // Update move buttons after restoring advanced layout
  setTimeout(() => updateAllMoveButtons(), 0);
}

function restoreDefaultLayoutWithTemplate() {
  restoreDefaultLayout();
  setTemplateCardsFromData('', { append: false });
}

function updateButtonSection() {
  const scrollY = window.scrollY || window.pageYOffset;
  if (scrollY > buttonSection.offsetTop) {
    buttonSection.classList.add('fixed');
  } else {
    buttonSection.classList.remove('fixed');
  }
}

window.addEventListener('scroll', updateButtonSection);

// ============================================================================
// TEMPLATE HELPERS
// ============================================================================

function addAllToTemplate() {
  const categoriesContainer = document.getElementById('categories');

  // Create an array to store the category names
  const categoryNames = [];

  // Loop over all category containers
  for (const categoryContainer of categoriesContainer.children) {
    // Check if the include checkbox is checked
    const includeCheckbox = categoryContainer.querySelector('.include-category');

    // If the checkbox is checked, add the category name to the array
    if (includeCheckbox && includeCheckbox.checked) {
      // Find the category name header in the container
      const categoryName = categoryContainer.querySelector('.category-header-name').innerText;

      // Add the category name to the array
      categoryNames.push(`[${categoryName}]`);

      // Add the fade-in-animation-container class to the category
      categoryContainer.classList.add('fade-in-animation-container');
      setTimeout(() => {
        categoryContainer.classList.remove('fade-in-animation-container');
      }, 100);
    }
  }

  // Create the template string by joining the category names with commas and spaces
  const categoryString = categoryNames.join(', ');

  const targetTextarea = getTemplateTargetTextarea();
  if (!targetTextarea) return;

  // Initialize undo stack if it doesn't exist
  if (!textUndoStack[targetTextarea.id]) textUndoStack[targetTextarea.id] = [];
  if (!textRedoStack[targetTextarea.id]) textRedoStack[targetTextarea.id] = [];
  
  // Push current state to undo stack before changing
  textUndoStack[targetTextarea.id].push(targetTextarea.value);
  
  // Clear redo stack
  textRedoStack[targetTextarea.id].length = 0;

  let currentTemplate = targetTextarea.value.replace(/^,\s*/, '');
  currentTemplate += (currentTemplate.length > 0 ? ', ' : '') + categoryString;
  targetTextarea.value = currentTemplate;
  
  // Push new state to undo stack
  textUndoStack[targetTextarea.id].push(currentTemplate);
  
  autoResizeTemplateTextarea(targetTextarea);
}

// ============================================================================
// TOGGLE HELPERS
// ============================================================================

function toggleLockAll() {
  const categories = document.querySelectorAll('.category');
  const firstLockCheckbox = categories[0].querySelector('.lock-category');
  const lockAll = !firstLockCheckbox.checked; // We'll use the state of the first checkbox to determine what to do

  categories.forEach(category => {
    const lockCheckbox = category.querySelector('.lock-category');
    lockCheckbox.checked = lockAll;
    lockCheckbox.dispatchEvent(new Event('change')); // Manually trigger the onchange event
  });
}

function toggleIncludeAll() {
  const categories = document.querySelectorAll('.category');
  const firstIncludeCheckbox = categories[0].querySelector('.include-category');
  const includeAll = !firstIncludeCheckbox.checked; // We'll use the state of the first checkbox to determine what to do

  categories.forEach(category => {
    const includeCheckbox = category.querySelector('.include-category');
    includeCheckbox.checked = includeAll;
    includeCheckbox.dispatchEvent(new Event('input')); // Manually trigger the oninput event
  });
}

function toggleSpellcheck() {
  const textareas = document.querySelectorAll('textarea');
  
  textareas.forEach((textarea) => {
    textarea.spellcheck = !textarea.spellcheck;
  });
}

// ============================================================================
// EVENT WIRING / BOOTSTRAP
// ============================================================================

// Button event listeners
document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
document.getElementById('generateBtn').addEventListener('click', generatePrompts);
document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
document.getElementById('clearAllBtn').addEventListener('click', clearAll);
document.getElementById('saveCustomPromptsBtn').addEventListener('click', saveCustomPrompts);
document.getElementById('loadCustomPromptsBtn').addEventListener('click', loadCustomPrompts);
document.getElementById('saveAllBtn').addEventListener('click', saveAll);
document.getElementById('removeAllBtn').addEventListener('click', removeAllCategories);
document.getElementById('add-all-template-btn').addEventListener('click', addAllToTemplate);
document.getElementById("restoreDefaultLayoutBtn").addEventListener('click', restoreDefaultLayout);
document.getElementById('advancedButton').addEventListener('click', restoreAdvancedLayout);

addPromptsButton.addEventListener('click', addCustomPrompts);
randomizeBtn.addEventListener("click", () => populateFieldsRandomly());
lockAllBtn.addEventListener('click', toggleLockAll);
IncludeAllBtn.addEventListener('click', toggleIncludeAll);
spellcheckToggleBtn.addEventListener('click', toggleSpellcheck);
undoRemoveButton.addEventListener('click', undoRemove);
undoRemoveAllButton.addEventListener('click', undoRemoveAll);
undoClearAllButton.addEventListener('click', undoClearAll);
if (addTemplateBtn) {
  addTemplateBtn.addEventListener('click', () => {
    const card = createTemplateCard();
    templateContainer.appendChild(card);
    const textarea = card.querySelector('.template-text');
    if (textarea) {
      textarea.focus();
    }
  });
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

document.addEventListener('DOMContentLoaded', (event) => {
  const numPromptsInput = document.getElementById('numPrompts');
  const numWordsInput = document.getElementById('numWords');
  const randomnessSlider = document.getElementById('randomness');
  const randomnessLabel = document.getElementById('randomnessLabel');

  numPromptsInput.addEventListener('input', () => {
    if (numPromptsInput.value > 1000) {
      numPromptsInput.value = 1000;
    }
  });

  numWordsInput.addEventListener('input', () => {
    if (numWordsInput.value > 20000) {
      numWordsInput.value = 20000;
    }
  });

  // Handle randomness slider
  if (randomnessSlider && randomnessLabel) {
    randomnessSlider.addEventListener('input', (e) => {
      randomness = parseFloat(e.target.value);
      if (randomness === 0) {
        randomnessLabel.textContent = 'Sequential';
      } else if (randomness < 0.4) {
        randomnessLabel.textContent = 'Low';
      } else if (randomness < 0.8) {
        randomnessLabel.textContent = 'Medium';
      } else {
        randomnessLabel.textContent = 'Full chaos';
      }
    });
  }
});
