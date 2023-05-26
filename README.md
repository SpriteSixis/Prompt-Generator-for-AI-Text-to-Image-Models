# Prompt-Generator-for-AI-Text-to-Image-Models
A simple, modular, customizable app to help you generate prompts quickly and easily for Stable Diffusion, Midjourney, and Dall-E 2.

# Prompt Generator

A tool designed to generate random custom prompts for AI image generation software, like Stable Diffusion, Midjourney, and Dall-E 2.

# Custom Prompt Generator

Custom Prompt Generator is a versatile and easy-to-use tool designed to create intriguing prompts for software like Stable Diffusion. It serves users ranging from meticulous prompt engineers to those who enjoy creating varied and diverse prompts with just a few clicks.

## Quick Start

Open `index.html` in your browser to start creating prompts! If you prefer not to start from scratch, click the **Randomize** button to populate the fields with words from a default database. 

## How It Works

The generator takes a set number of random words from each category, shuffles them, and produces the desired number of unique prompts. You can directly copy the prompt to your clipboard and use it in any application of your choice.

## Detailed Features

### Category Containers

Each category container includes:

- **Include Checkbox**: Controls whether the category is considered when generating prompts.
- **Lock Checkbox**: Prevents editing of the category content and shields it from being modified by the **Randomize** button.
- **Number of Words**: Specifies how many words (or phrases separated by commas) are picked from the category.
- **Add to Template Button**: Adds the category to the custom template.
- **Delete Category Button**: Removes the category from the list.

Note: If the custom template box is empty, the prompt generating function outputs the words in the order of the category containers from top to bottom. Simply drag and drop the headers to rearrange the order.

### Sidebar Features

- **Add Category Button**: Creates new category containers.
- **Clear All Button**: Deletes all text from the category containers.
- **Undo Clear All Button**: Restores text cleared by the **Clear All** button.
- **Save Custom Prompts Button**: Exports your current workspace (words and categories) to an external file.
- **Load Custom Prompts Button**: Imports an external file, enabling you to easily switch between various curated themes.
- **Add Custom Prompts Button**: Merges prompts from a file with existing prompts.
- **Save All Button**: Stores the current layout and text in your browser storage, preserving your setup across sessions.
- **Include All and Lock All Buttons**: Toggles inclusion and editing for all categories.
- **Randomize and Generate Buttons**: Populates categories with random words and generates prompts, respectively.
- **Undo Delete Category and Undo Delete All Category Containers Buttons**: Restores deleted category containers.
- **Restore Default Button**: Returns the application to its original state.
- **Advanced Layout Button**: Adds category containers pre-filled with common Stable Diffusion modifiers.

## Browser Compatibility

Tested with the latest versions of Chrome and Firefox.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
