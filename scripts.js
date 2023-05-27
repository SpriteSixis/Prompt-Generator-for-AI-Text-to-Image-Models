let removedCategories = [];
let removedText = {}; // Object to store the removed text for each category
let textUndoStack = {}; // Change this to an object
let textRedoStack = {}; // Change this to an object
let duplicateCounters = {};

const templateTextArea = document.getElementById('promptTemplate');

// Define an array of category names to be used in the application
const categoryNames = ['SUBJECTS', 'CLOTHING', 'PROPS', 'POSES', 'SETTINGS', 'SCENE'];
const advancedCategoryNames = ["ARTISTS", "CGI RENDERINGS", "CGI SOFTWARES", "CAMERAS", "CARVINGS AND ETCHINGS", "COLORS", "DRAWING STYLES", "EMOTIONS", "PENS", "VISUAL STYLES"];

let categoryIdCounter = 0;

// Function to create a new category component
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
  header.textContent = categoryName; // Move the category name to the header
  header.draggable = true; // Make the header draggable
  header.title = 'Drag and Drop to Rearrange Category Containers to your Liking'
  container.appendChild(header);

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
    // Fetch current template
    let currentTemplate = templateTextArea.value;

    // Append the category name to the template
    currentTemplate += `, [${categoryName}]`;

    // Set the updated template back to the textarea
    templateTextArea.value = currentTemplate;
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
  };
  removeButton.classList.add('category-remove-button'); // Add class for selecting

  // Append the removeButton to the optionContainer
  optionContainer.appendChild(removeButton);

  // Append the optionContainer to the main container
  container.appendChild(optionContainer);

  // Drag and drop event handlers
  header.addEventListener('dragstart', dragStart);
  header.addEventListener('dragover', dragOver);
  header.addEventListener('drop', drop);
  header.addEventListener('dragend', dragEnd); // New event handler
  header.addEventListener('dragleave', dragLeave); // New event handler

  return container;
}

// Function to handle the input event
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

let dragCategory; // Variable to store the dragged category container

function dragStart(event) {
  if (event.target.classList.contains('category-header')) {
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

// Create category components and append them to the categories container
const categoriesContainer = document.getElementById('categories');
categoryNames.forEach(categoryName => {
  const categoryComponent = createCategoryComponent(categoryName);
  categoriesContainer.appendChild(categoryComponent);
});

// Add event listeners and logic for the action buttons
document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
document.getElementById('generateBtn').addEventListener('click', generatePrompts);
document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
document.getElementById('clearAllBtn').addEventListener('click', clearAll);
document.getElementById('saveCustomPromptsBtn').addEventListener('click', saveCustomPrompts);
document.getElementById('loadCustomPromptsBtn').addEventListener('click', loadCustomPrompts);
document.getElementById('saveAllBtn').addEventListener('click', saveAll);
document.getElementById('removeAllBtn').addEventListener('click', removeAllCategories);

window.addEventListener('keydown', function (event) {
  if (event.shiftKey && event.altKey) { // Check if Shift and Alt keys are down
    switch (event.code) {
      case 'KeyQ': // If 'q' is pressed
        undoClearAll();
        event.preventDefault(); // Prevent the default action
        break;
      case 'KeyE': // If 'e' is pressed
        undoRemove();
        event.preventDefault(); // Prevent the default action
        break;
      case 'Digit5': // If 't' is pressed
        undoRemoveAll();
        event.preventDefault(); // Prevent the default action
        break;
      default:
        // Do nothing for other keys
        break;
    }
  }
});

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
}

function generatePrompts() {
  const numPrompts = parseInt(document.getElementById('numPrompts').value, 10);
  let promptTemplate = document.getElementById('promptTemplate').value;

  const categories = document.querySelectorAll('.category');
  const categoryData = Array.from(categories).map(category => {
    const words = category.querySelector('textarea').value.split(',').map(word => word.trim()).filter(word => word);
    const numWords = parseInt(category.querySelector('input[type="number"]').value, 10);
    const includeCategory = category.querySelector('.include-category').checked;
    const name = category.querySelector('label').textContent.slice(0, -1); // Remove colon at the end
    return { words, numWords, includeCategory, name };
  });

  // If promptTemplate is empty, generate a default template that includes all categories
  if (!promptTemplate) {
    promptTemplate = categoryData.map(category => `[${category.name}]`).join(', ');
  }

  const generatedPromptsContainer = document.getElementById('generatedPrompts');
  generatedPromptsContainer.innerHTML = '';

  const promptHistoryContainer = document.getElementById('promptHistory');
  for (let i = 0; i < numPrompts; i++) {
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

    // Add the textBox to the container
    textBoxContainer.appendChild(textBox);

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

    // Add the copyButton to the container
    textBoxContainer.appendChild(copyButton);

    // Add the container to the promptElement
    promptElement.appendChild(textBoxContainer);

    generatedPromptsContainer.appendChild(promptElement);
    promptHistoryContainer.innerHTML += prompt + '<br>';
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
  const numPromptsInput = document.getElementById('numPrompts');
  const numWordsInput = document.getElementById('numWords');

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
});

function autoAdjustTextareaHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight + 5) + 'px';  // Add 10px to the height
}

function generatePrompt(categoryData, template) {
  // Create a map for easier category word access
  const categoryMap = categoryData.reduce((map, category) => {
    map[category.name] = category.includeCategory ? getRandomWords(category.words, category.numWords) : [];
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

function getRandomWords(wordArray, numWords) {
  // If numWords is equal to or greater than the length of wordArray, return wordArray
  if (numWords >= wordArray.length) {
    return wordArray;
  }

  let words = [...wordArray];  // Create a copy of the array so we don't mutate the original
  let randomWords = [];

  for (let i = 0; i < numWords; i++) {
    if (words.length === 0) {
      break;  // If there are no more words to choose from, exit the loop
    }

    const randomIndex = Math.floor(Math.random() * words.length);  // Choose a random index
    randomWords.push(words[randomIndex]);  // Add the word at the random index to the list of chosen words
    words.splice(randomIndex, 1);  // Remove the chosen word from the list of words
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

  // Save the template prompt
  const templatePrompt = document.getElementById('promptTemplate').value;

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

      // Load the template prompt
      document.getElementById('promptTemplate').value = data.template;
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

      // Load the template prompt
      const templateInput = document.getElementById('promptTemplate');
      templateInput.value += '\n' + data.template; // Append the loaded template prompt
    };
    reader.readAsText(file);
  });

  input.click();
}

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

  // Save the template prompt
  const templatePrompt = document.getElementById('promptTemplate').value;

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

  // Load the template prompt
  document.getElementById('promptTemplate').value = data.template;
});

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

// Add event listener to the "Add Custom Prompts" button
const addPromptsButton = document.getElementById('addPromptsButton');
addPromptsButton.addEventListener('click', addCustomPrompts);

// Attach the populateFieldsRandomly function to the click event of the randomizeBtn
const randomizeBtn = document.getElementById("randomizeBtn");
randomizeBtn.addEventListener("click", () => populateFieldsRandomly());

function removeAllCategories() {
  const categoriesContainer = document.getElementById('categories');

  // Store the removed categories along with their original index
  removedCategories = Array.from(categoriesContainer.children).map((child, index) => ({ element: child, originalIndex: index }));

  // Remove all existing categories
  while (categoriesContainer.firstChild) {
    categoriesContainer.removeChild(categoriesContainer.firstChild);
  }
}

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'Y' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'y') {
    removeAllCategories();
  }
});

function addAllToTemplate() {
  const categoriesContainer = document.getElementById('categories');

  // Fetch current template
  let currentTemplate = templateTextArea.value;

  // Loop over all category containers
  for (const categoryContainer of categoriesContainer.children) {
    // Check if the include checkbox is checked
    const includeCheckbox = categoryContainer.querySelector('.include-category');

    // If the checkbox is checked, append the category to the template
    if (includeCheckbox && includeCheckbox.checked) {
      // Find the category name header in the container
      const categoryName = categoryContainer.querySelector('.category-header').innerText;

      // Append the category name to the template
      currentTemplate += `, [${categoryName}]`;
    }
  }

  // Set the updated template back to the textarea
  templateTextArea.value = currentTemplate;
}

document.getElementById('add-all-template-btn').addEventListener('click', addAllToTemplate);

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'A' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'a') {
    addAllToTemplate();
  }
});

window.addEventListener('keydown', function (event) {
  // Only trigger if both Shift and Alt are held down
  if (!event.shiftKey || !event.altKey) {
    return;
  }

  switch (event.code) {
    case 'KeyC': // Clear All button
      clearAll();
      break;
    case 'KeyW': // Randomize button
      populateFieldsRandomly();
      break;
    case 'KeyG': // Generate button
      generatePrompts();
      break;
    case 'KeyH': // Clear History button
      clearHistory();
      break;
    case 'KeyS': // Save Custom Prompts button
      saveCustomPrompts();
      break;
    case 'KeyO': // Load Custom Prompts button
      loadCustomPrompts();
      break;
    case 'KeyL': // Lock/Unlock all categories
      toggleLockAll();
      break;
    case 'KeyP': // Include/Exclude all categories
      toggleIncludeAll();
      break;
    case 'KeyM': // Save All
      saveAll();
      break;
    case 'KeyN': // Add category
      addCategory();
      break;
    case 'KeyD': // Add category
      restoreDefaultLayout();
      break;
    case 'Digit4': // Add category
      restoreAdvancedLayout();
      break;
    case 'Digit2': // Add category
      addCustomPrompts();
      break;
  }
});

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

const lockAllBtn = document.getElementById('lockAllBtn');
lockAllBtn.addEventListener('click', toggleLockAll);

const IncludeAllBtn = document.getElementById('IncludeAllBtn');
IncludeAllBtn.addEventListener('click', toggleIncludeAll);

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
}

document.getElementById("restoreDefaultLayoutBtn").addEventListener('click', restoreDefaultLayout);
document.getElementById('advancedButton').addEventListener('click', restoreAdvancedLayout);

// Add the code for freezing the left pane here
const buttonSection = document.querySelector('.button-section');

function updateButtonSection() {
  const scrollY = window.scrollY || window.pageYOffset;
  if (scrollY > buttonSection.offsetTop) {
    buttonSection.classList.add('fixed');
  } else {
    buttonSection.classList.remove('fixed');
  }
}

window.addEventListener('scroll', updateButtonSection);

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'K' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'k') {
    const textarea = document.activeElement;
    if (textarea.tagName !== 'TEXTAREA') return; // Ignore if the focused element is not a textarea

    const category = textarea.closest('.category');
    if (!category) return; // Ignore if the textarea is not inside a category

    const lockCheckbox = category.querySelector('.lock-category');
    if (!lockCheckbox) return; // Ignore if there is no lock checkbox in the category

    // Toggle the checkbox and manually trigger the onchange event
    lockCheckbox.checked = !lockCheckbox.checked;
    lockCheckbox.dispatchEvent(new Event('change'));
  }
});

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'U' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'u') {
    const textarea = document.activeElement;
    if (textarea.tagName !== 'TEXTAREA') return; // Ignore if the focused element is not a textarea

    const category = textarea.closest('.category');
    if (!category) return; // Ignore if the textarea is not inside a category

    const includeCheckbox = category.querySelector('.include-category');
    if (!includeCheckbox) return; // Ignore if there is no include checkbox in the category

    // Toggle the checkbox
    includeCheckbox.checked = !includeCheckbox.checked;
  }
});

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'X' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'x') {
    const textarea = document.activeElement;
    if (textarea.tagName !== 'TEXTAREA') return; // Ignore if the focused element is not a textarea

    const category = textarea.closest('.category');
    if (!category) return; // Ignore if the textarea is not inside a category

    const removeButton = category.querySelector('.category-remove-button');
    if (!removeButton) return; // Ignore if there is no remove button in the category

    // Get the index of the removed category
    const index = Array.from(categoriesContainer.children).indexOf(category);

    // Store the removed category and its original index
    removedCategories.push({ category: category, index: index });

    // Remove the category
    category.remove();
  }
});

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'T' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 't') {
    const textarea = document.activeElement;
    if (textarea.tagName !== 'TEXTAREA') return; // Ignore if the focused element is not a textarea

    const category = textarea.closest('.category');
    if (!category) return; // Ignore if the textarea is not inside a category

    const categoryName = category.querySelector('.category-header').textContent;

    // Fetch current template
    let currentTemplate = templateTextArea.value;

    // Append the category name to the template
    currentTemplate += ` [${categoryName}]`;

    // Set the updated template back to the textarea
    templateTextArea.value = currentTemplate;
  }
});

document.addEventListener('keydown', function (event) {
  // Shift + Alt + 'B' was pressed
  if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'b') {
    const textarea = document.activeElement;
    if (textarea.tagName !== 'TEXTAREA') return; // Ignore if the focused element is not a textarea

    const category = textarea.closest('.category');
    if (!category) return; // Ignore if the textarea is not inside a category

    // Duplicate the active category
    duplicateCategory(category);
  }
});

function duplicateCategory(activeCategory) {
  // Extract the original category name
  let originalCategoryName = activeCategory.querySelector('.category-header').textContent;

  let duplicateCategoryName = originalCategoryName;
  let duplicateCount = 2;

  // Create a list of all existing category names
  let existingCategoryNames = Array.from(document.querySelectorAll('.category-header')).map(header => header.textContent);

  // Continue incrementing the duplicate count until we find a name that doesn't exist
  while (existingCategoryNames.includes(duplicateCategoryName + duplicateCount)) {
    duplicateCount++;
  }

  duplicateCategoryName = originalCategoryName + duplicateCount;

  // Create a new category with the duplicated name
  const categoryComponent = createCategoryComponent(duplicateCategoryName);

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
    categoriesContainer.children[insertIndex].querySelector('.category-header').textContent.startsWith(originalCategoryName)) {
    insertIndex++;
  }

  // Insert the new category at the correct position
  if (insertIndex < categoriesContainer.children.length) {
    categoriesContainer.insertBefore(categoryComponent, categoriesContainer.children[insertIndex]);
  } else {
    categoriesContainer.appendChild(categoryComponent);
  }
}

function restoreDefaultLayoutWithTemplate() {
  restoreDefaultLayout();
  const promptTemplate = document.getElementById('promptTemplate');
  promptTemplate.value = "";
}

window.addEventListener('keydown', function (event) {
  // Check if Shift+Alt+0 was pressed
  if (event.shiftKey && event.altKey && event.code === 'Digit0') {
    restoreDefaultLayoutWithTemplate();
  }
});

// Function to undo remove
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
}

const undoRemoveButton = document.getElementById('undoRemoveButton');
undoRemoveButton.addEventListener('click', undoRemove);

const undoRemoveAllButton = document.getElementById('undoRemoveAllButton');
undoRemoveAllButton.addEventListener('click', undoRemoveAll);

const undoClearAllButton = document.getElementById('undoClearAllButton');
undoClearAllButton.addEventListener('click', undoClearAll);
