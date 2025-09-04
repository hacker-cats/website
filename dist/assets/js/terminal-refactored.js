class HackercatsTerminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.closeBtn = document.querySelector('.terminal-close');
        
        // Initialize new systems
        this.fileSystem = new VirtualFileSystem();
        this.commandRegistry = new CommandRegistry();
        
        this.currentPath = '/';
        this.commandHistory = this.loadCommandHistory();
        this.historyIndex = -1;
        this.vimMode = false;
        this.emacsMode = false;
        this.scrollPosition = 0;
        this.searchMode = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.searchIndex = 0;
        this.historySearchMode = false;
        this.historySearchQuery = '';
        this.historySearchResults = [];
        this.historySearchIndex = 0;
        this.tabCompletionState = {
            isActive: false,
            matches: [],
            currentIndex: 0,
            originalInput: ''
        };
        
        this.init();
    }
    
    init() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + ` to toggle terminal
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                if (this.terminal.classList.contains('active')) {
                    this.hide();
                } else {
                    this.show();
                }
            }
            // Ctrl + R for history search
            else if (e.ctrlKey && e.key === 'r' && this.terminal.classList.contains('active') && !this.vimMode) {
                e.preventDefault();
                this.enterHistorySearch();
            }
            // Ctrl + L to clear screen
            else if (e.ctrlKey && e.key === 'l' && this.terminal.classList.contains('active') && !this.vimMode) {
                e.preventDefault();
                this.clearOutput();
            }
            // Escape to exit any active mode or enter vim mode
            else if (e.key === 'Escape' && this.terminal.classList.contains('active')) {
                e.preventDefault();
                if (this.historySearchMode) {
                    this.exitHistorySearch();
                } else if (this.vimMode) {
                    this.exitVimMode();
                } else if (this.emacsMode) {
                    this.exitEmacsMode();
                } else {
                    this.enterVimMode();
                }
            }
            // Vim mode navigation
            else if (this.vimMode && this.terminal.classList.contains('active')) {
                this.handleVimKeydown(e);
            }
            // Emacs mode navigation
            else if (this.emacsMode && this.terminal.classList.contains('active')) {
                this.handleEmacsKeydown(e);
            }
        });
        
        // Terminal input handling
        this.input.addEventListener('keydown', (e) => {
            if (this.historySearchMode) {
                this.handleHistorySearchKeydown(e);
                return;
            }
            
            if (e.key === 'Enter') {
                this.resetTabCompletion();
                this.processCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.resetTabCompletion();
                this.navigateHistory(1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.resetTabCompletion();
                this.navigateHistory(-1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
            } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                // Reset tab completion on any typing or deletion
                this.resetTabCompletion();
            }
        });
        
        // Close button
        this.closeBtn.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.terminal.addEventListener('click', (e) => {
            if (e.target === this.terminal) {
                this.hide();
            }
        });
        
        // Welcome message
        this.addOutput('hackercats terminal v2.0.0', 'system');
        this.addOutput('Enhanced with file system and extensible commands', 'system');
        this.addOutput('Type "help" for available commands or Ctrl+` to open/close', 'system');
        this.addOutput('', 'system');
    }
    
    show() {
        this.terminal.classList.add('active');
        // Reset to insert mode when terminal is opened
        if (this.vimMode) {
            this.exitVimMode();
        }
        if (this.emacsMode) {
            this.exitEmacsMode();
        }
        this.input.focus();
        this.updateCurrentPath();
    }
    
    hide() {
        this.terminal.classList.remove('active');
    }
    
    updateCurrentPath() {
        const currentUrl = window.location.pathname;
        // Keep current path as root directory for now
        // All pages are files in root, not separate directories
        this.currentPath = '/';
        this.updatePrompt();
    }
    
    updatePrompt() {
        const prompt = document.querySelector('.terminal-prompt');
        const currentDir = this.fileSystem.getCurrentDirectory(this.currentPath);
        const dirName = this.currentPath === '/' ? 'hackercats' : currentDir?.name || 'unknown';
        
        if (this.historySearchMode) {
            const match = this.historySearchResults.length > 0 ? this.historySearchResults[this.historySearchIndex] : '';
            prompt.textContent = `(reverse-i-search)\`${this.historySearchQuery}': ${match}`;
        } else if (this.searchMode) {
            prompt.textContent = `-- SEARCH -- `;
        } else if (this.vimMode) {
            prompt.textContent = `-- VIM -- `;
        } else if (this.emacsMode) {
            prompt.textContent = `-- EMACS -- `;
        } else {
            prompt.textContent = `hackercats@${dirName}:${this.currentPath}$ `;
        }
    }
    
    processCommand() {
        const commandLine = this.input.value.trim();
        if (commandLine) {
            this.commandHistory.unshift(commandLine);
            this.saveCommandHistory();
            this.historyIndex = -1;
        }
        
        // Show command in output
        this.addOutput(`hackercats@site:${this.currentPath}$ ${commandLine}`, 'command');
        
        if (commandLine) {
            this.executeCommand(commandLine);
        }
        
        this.input.value = '';
        this.scrollToBottom();
    }
    
    executeCommand(commandLine) {
        const [commandName, ...args] = commandLine.split(' ');
        const command = this.commandRegistry.get(commandName.toLowerCase());
        
        if (command) {
            try {
                command.execute(args, this);
            } catch (error) {
                this.addOutput(`Error executing ${commandName}: ${error.message}`, 'error');
            }
        } else {
            this.addOutput(`command not found: ${commandName}`, 'error');
            this.addOutput('Type "help" for available commands', 'system');
        }
    }
    
    // Tab completion functionality
    handleTabCompletion() {
        const currentInput = this.input.value;
        
        // If we're already in tab completion mode, cycle through matches
        if (this.tabCompletionState.isActive && this.tabCompletionState.matches.length > 0) {
            this.cycleTabCompletion();
            return;
        }
        
        // Start new tab completion
        const [commandName, ...args] = currentInput.split(' ');
        let matches = [];
        let completionType = '';
        
        if (args.length === 0) {
            // Complete command names
            matches = this.commandRegistry.list().filter(cmd => 
                cmd.startsWith(commandName)
            );
            completionType = 'command';
            
            if (matches.length === 1) {
                this.input.value = matches[0] + ' ';
                this.resetTabCompletion();
                return;
            }
        } else {
            // Try command-specific completion
            const command = this.commandRegistry.get(commandName.toLowerCase());
            if (command && command.getCompletions) {
                matches = command.getCompletions(args, this);
                completionType = 'argument';
                
                if (matches.length === 1) {
                    this.input.value = `${commandName} ${matches[0]}`;
                    this.resetTabCompletion();
                    return;
                }
            }
        }
        
        if (matches.length > 1) {
            // Setup tab completion state for cycling
            this.tabCompletionState = {
                isActive: true,
                matches: matches,
                currentIndex: -1,
                originalInput: currentInput,
                completionType: completionType
            };
            
            // Show available completions on first tab
            this.showCompletions(matches);
        }
    }
    
    cycleTabCompletion() {
        const state = this.tabCompletionState;
        state.currentIndex = (state.currentIndex + 1) % state.matches.length;
        
        const match = state.matches[state.currentIndex];
        const [commandName] = state.originalInput.split(' ');
        
        if (state.completionType === 'command') {
            this.input.value = match + ' ';
        } else if (state.completionType === 'argument') {
            this.input.value = `${commandName} ${match}`;
        }
        
        // Position cursor at end
        setTimeout(() => {
            this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        }, 0);
    }
    
    resetTabCompletion() {
        this.tabCompletionState = {
            isActive: false,
            matches: [],
            currentIndex: 0,
            originalInput: ''
        };
    }
    
    showCompletions(matches) {
        this.addOutput('Completions:', 'hint');
        matches.forEach(match => {
            this.addOutput(`  ${match}`, 'command-item');
        });
        this.addOutput('', 'system');
    }
    
    // Output methods
    addOutput(text, type = 'output') {
        const wasAtBottom = this.isScrolledToBottom();
        
        const line = document.createElement('div');
        line.className = `terminal-output-line terminal-output-${type}`;
        line.textContent = text;
        this.output.appendChild(line);
        
        // Auto-scroll to bottom if we were already at the bottom
        if (wasAtBottom) {
            this.scrollToBottom();
        }
    }
    
    clearOutput() {
        this.output.innerHTML = '';
    }
    
    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    isScrolledToBottom() {
        const threshold = 5; // Allow 5px tolerance for "close enough" to bottom
        return this.output.scrollTop + this.output.clientHeight >= this.output.scrollHeight - threshold;
    }
    
    // History navigation
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        this.historyIndex += direction;
        
        if (this.historyIndex < 0) {
            this.historyIndex = -1;
            this.input.value = '';
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length - 1;
        }
        
        if (this.historyIndex >= 0) {
            this.input.value = this.commandHistory[this.historyIndex];
        }
    }
    
    // Command history management
    loadCommandHistory() {
        try {
            const history = localStorage.getItem('hackercats_terminal_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.warn('Failed to load command history:', error);
            return [];
        }
    }
    
    saveCommandHistory() {
        try {
            // Keep only last 100 commands to avoid storage bloat
            const historyToSave = this.commandHistory.slice(0, 100);
            localStorage.setItem('hackercats_terminal_history', JSON.stringify(historyToSave));
        } catch (error) {
            console.warn('Failed to save command history:', error);
        }
    }
    
    // History search (Ctrl-R) functionality
    enterHistorySearch() {
        if (this.commandHistory.length === 0) {
            this.addOutput('No command history available', 'hint');
            return;
        }
        
        this.historySearchMode = true;
        this.historySearchQuery = '';
        this.historySearchResults = [];
        this.historySearchIndex = 0;
        this.input.value = '';
        this.updatePrompt();
        this.input.focus();
    }
    
    handleHistorySearchKeydown(e) {
        if (e.key === 'Enter') {
            // Execute selected command
            if (this.historySearchResults.length > 0) {
                this.input.value = this.historySearchResults[this.historySearchIndex];
            }
            this.exitHistorySearch();
            if (this.input.value.trim()) {
                this.processCommand();
            }
        } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
            // Cancel search and stay in insert mode
            this.input.value = '';
            this.exitHistorySearch();
        } else if (e.ctrlKey && e.key === 'r') {
            // Next match (Ctrl-R again)
            e.preventDefault();
            this.nextHistorySearchMatch();
        } else if (e.key === 'Backspace') {
            // Remove character from search query
            this.historySearchQuery = this.historySearchQuery.slice(0, -1);
            this.performHistorySearch();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Add character to search query
            this.historySearchQuery += e.key;
            this.performHistorySearch();
        }
        
        // Prevent default behavior and stop propagation for all keys in history search mode
        e.preventDefault();
        e.stopPropagation();
    }
    
    performHistorySearch() {
        if (this.historySearchQuery === '') {
            this.historySearchResults = [];
            this.historySearchIndex = 0;
            this.updatePrompt();
            return;
        }
        
        // Search command history (case insensitive)
        this.historySearchResults = this.commandHistory.filter(cmd => 
            cmd.toLowerCase().includes(this.historySearchQuery.toLowerCase())
        );
        
        this.historySearchIndex = 0;
        this.updatePrompt();
        
        // Update input field with current match
        if (this.historySearchResults.length > 0) {
            this.input.value = this.historySearchResults[this.historySearchIndex];
            setTimeout(() => {
                this.input.setSelectionRange(this.input.value.length, this.input.value.length);
            }, 0);
        } else {
            this.input.value = '';
        }
    }
    
    nextHistorySearchMatch() {
        if (this.historySearchResults.length <= 1) return;
        
        this.historySearchIndex = (this.historySearchIndex + 1) % this.historySearchResults.length;
        this.updatePrompt();
        
        // Update input field with new match
        this.input.value = this.historySearchResults[this.historySearchIndex];
        setTimeout(() => {
            this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        }, 0);
    }
    
    exitHistorySearch() {
        this.historySearchMode = false;
        this.historySearchQuery = '';
        this.historySearchResults = [];
        this.historySearchIndex = 0;
        this.updatePrompt();
    }
    
    // Vim mode methods
    enterVimMode() {
        this.vimMode = true;
        this.input.blur();
        this.terminal.classList.add('vim-mode');
        this.updatePrompt();
    }
    
    exitVimMode() {
        this.vimMode = false;
        this.terminal.classList.remove('vim-mode');
        this.input.focus();
        this.updatePrompt();
    }
    
    handleVimKeydown(e) {
        e.preventDefault();
        
        switch (e.key.toLowerCase()) {
            case 'j':
                this.scrollDown();
                break;
            case 'k':
                this.scrollUp();
                break;
            case 'g':
                if (e.shiftKey) {
                    // G - go to bottom
                    this.scrollToBottom();
                } else {
                    // g - go to top (gg would need double-tap logic)
                    this.scrollToTop();
                }
                break;
            case 'd':
                if (e.ctrlKey) {
                    // Ctrl+D - scroll down half page
                    this.scrollDown(10);
                }
                break;
            case 'u':
                if (e.ctrlKey) {
                    // Ctrl+U - scroll up half page
                    this.scrollUp(10);
                }
                break;
            case 'i':
                this.exitVimMode();
                break;
            case 'q':
                this.hide();
                break;
            case 'arrowup':
                this.scrollUp();
                break;
            case 'arrowdown':
                this.scrollDown();
                break;
        }
    }
    
    // Scrolling methods for vim mode
    scrollUp(lines = 1) {
        const lineHeight = 20; // Approximate line height in pixels
        this.output.scrollTop = Math.max(0, this.output.scrollTop - (lineHeight * lines));
    }
    
    scrollDown(lines = 1) {
        const lineHeight = 20;
        const maxScroll = this.output.scrollHeight - this.output.clientHeight;
        this.output.scrollTop = Math.min(maxScroll, this.output.scrollTop + (lineHeight * lines));
    }
    
    scrollToTop() {
        this.output.scrollTop = 0;
    }
    
    // Emacs mode placeholder methods (simplified for now)
    enterEmacsMode() {
        this.emacsMode = true;
        this.input.blur();
        this.terminal.classList.add('emacs-mode');
        this.updatePrompt();
        this.addOutput('-- EMACS MODE -- (Press C-g to exit)', 'vim-indicator');
    }
    
    exitEmacsMode() {
        this.emacsMode = false;
        this.terminal.classList.remove('emacs-mode');
        this.input.focus();
        this.updatePrompt();
    }
    
    handleEmacsKeydown(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            this.exitEmacsMode();
        }
        // Add more emacs commands as needed
    }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HackercatsTerminal();
});