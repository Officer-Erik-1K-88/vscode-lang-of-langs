# Language of Languages Tools Changelog and Roadmap

This document outlines the changes made in each released version of the Language of Languages Tools extension for Visual Studio Code, as well as our roadmap for future features.

## Roadmap

Our development roadmap outlines the planned features for Language of Languages Tools. Features marked with a check mark have already been implemented.

- [ ] **From EBNF Tools**: The roadmap that _EBNF Tools_ has defined.
  - [x] **Syntax highlighting (colorization)**: Adds color to your EBNF syntax.
  - [x] **Syntax highlighting in Markdown fenced code blocks**: Allows you to include EBNF code in your Markdown files with the same colorization as in your .ebnf files.
  - [x] **Commenting blocks of code**: Allows you to quickly comment out blocks of EBNF code.
  - [x] **Bracket matching**: Aids in matching brackets in your EBNF code.
  - [x] **Rename symbol**: Allows renaming of symbols throughout your EBNF code.
  - [x] **Go to Definition / Peek Definition**: Quickly navigate to the definition of a symbol in your EBNF code.
  - [x] **Code folding (by markers)**: Hide sections of your EBNF code for easier reading and navigation.
  - [x] **Find All References / Peek References**: Find every reference to a specific symbol in your EBNF code.
  - [x] **Formatting**: Automatically format your EBNF code to adhere to a specific style or standard.
  - [ ] **Hover**: Show information about the symbol/object that's below the mouse cursor.
  - [x] **Diagnostic**: Indicate issues with the grammar.
  - [ ] **Actions on Errors or Warnings**: Possible corrective actions right next to an error or warning.
  - [ ] **Commands (Transpile to tmLanguage)**: A command for compiling EBNF code to tmLanguage.
  - [ ] **Railroad diagram generation**: Generate railroad diagrams from your EBNF code for visualization and documentation purposes.

## Change Log

The change log lists the updates for each version that has been released on the official Visual Studio Code extension gallery.

### Version 1.0

Released: **2025-09-12**

- Initial Fork of [EBNF Tools](https://github.com/igochkov/vscode-ebnf). Featuring all aspects of _EBNF Tools Version 1.4_.
