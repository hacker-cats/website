class HackercatsTerminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.closeBtn = document.querySelector('.terminal-close');
        
        this.currentPath = '/';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.vimMode = false;
        this.scrollPosition = 0;
        
        this.pages = {
            '/': { title: 'Home', url: '/' },
            '/about': { title: 'About', url: '/about' },
            '/events': { title: 'Events', url: '/events' },
            '/projects': { title: 'Projects', url: '/projects' },
            '/stats': { title: 'CTF Stats', url: '/stats' },
            '/join': { title: 'Join Us', url: '/join' }
        };
        
        this.commands = {
            'help': 'Show available commands',
            'ls': 'List available pages',
            'cd <page>': 'Navigate to a page',
            'pwd': 'Show current page',
            'clear': 'Clear terminal output',
            'whoami': 'Display user info',
            'exit': 'Close terminal'
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
            // Escape to enter vim mode
            else if (e.key === 'Escape' && this.terminal.classList.contains('active')) {
                if (!this.vimMode) {
                    this.enterVimMode();
                }
            }
            // Vim mode navigation
            else if (this.vimMode && this.terminal.classList.contains('active')) {
                this.handleVimKeydown(e);
            }
        });
        
        // Terminal input handling
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.processCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
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
        this.addOutput('hackercats terminal v1.0.0', 'system');
        this.addOutput('Type "help" for available commands or Ctrl+` to open/close', 'system');
        this.addOutput('', 'system');
    }
    
    show() {
        this.terminal.classList.add('active');
        this.input.focus();
        // Update current path based on current page
        this.updateCurrentPath();
    }
    
    hide() {
        this.terminal.classList.remove('active');
    }
    
    updateCurrentPath() {
        const currentUrl = window.location.pathname;
        this.currentPath = currentUrl === '/' ? '/' : currentUrl.replace(/\/$/, '');
        this.updatePrompt();
    }
    
    updatePrompt() {
        const prompt = document.querySelector('.terminal-prompt');
        const pageName = this.currentPath === '/' ? 'home' : this.currentPath.substring(1);
        if (this.vimMode) {
            prompt.textContent = `-- VIM -- `;
        } else {
            prompt.textContent = `hackercats@${pageName}:~$ `;
        }
    }
    
    processCommand() {
        const command = this.input.value.trim();
        if (command) {
            this.commandHistory.unshift(command);
            this.historyIndex = -1;
        }
        
        // Show command in output
        this.addOutput(`hackercats@site:~$ ${command}`, 'command');
        
        if (command) {
            this.executeCommand(command);
        }
        
        this.input.value = '';
        this.scrollToBottom();
    }
    
    executeCommand(command) {
        const [cmd, ...args] = command.toLowerCase().split(' ');
        
        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'ls':
                this.listPages();
                break;
            case 'cd':
                this.changeDirectory(args.join(' '));
                break;
            case 'pwd':
                this.printWorkingDirectory();
                break;
            case 'clear':
                this.clearOutput();
                break;
            case 'whoami':
                this.showUser();
                break;
            case 'exit':
                this.hide();
                break;
            default:
                this.addOutput(`command not found: ${cmd}`, 'error');
                this.addOutput('Type "help" for available commands', 'system');
        }
    }
    
    showHelp() {
        this.addOutput('HACKERCATS TERMINAL HELP', 'header');
        this.addOutput('', 'system');
        this.addOutput('', 'system');
        
        this.addOutput('COMMANDS', 'section');
        this.addOutput('', 'system');
        Object.entries(this.commands).forEach(([cmd, desc]) => {
            this.addOutput(`${cmd.padEnd(15)} - ${desc}`, 'command-item');
        });
        this.addOutput('', 'system');
        this.addOutput('', 'system');
        
        this.addOutput('KEYBOARD SHORTCUTS', 'section');
        this.addOutput('', 'system');
        this.addOutput('Ctrl + `        - Open/close terminal', 'command-item');
        this.addOutput('Escape          - Close terminal', 'command-item');
        this.addOutput('Up/Down arrows  - Navigate command history', 'command-item');
        this.addOutput('Enter           - Execute command', 'command-item');
        this.addOutput('', 'system');
        this.addOutput('', 'system');
        
        this.addOutput('Type "ls" to see available pages', 'hint');
        this.addOutput('Use "cd <page>" to navigate (e.g., cd /about)', 'hint');
    }
    
    listPages() {
        this.addOutput('AVAILABLE PAGES', 'section');
        this.addOutput('', 'system');
        Object.entries(this.pages).forEach(([path, info]) => {
            const current = path === this.currentPath;
            const indicator = current ? '●' : ' ';
            const status = current ? ' (current)' : '';
            this.addOutput(`${indicator} ${path.padEnd(12)} - ${info.title}${status}`, current ? 'current-page' : 'command-item');
        });
        this.addOutput('', 'system');
        this.addOutput('Use "cd <page>" to navigate to a page', 'hint');
    }
    
    changeDirectory(path) {
        if (!path) {
            this.addOutput('cd: missing argument', 'error');
            this.addOutput('Usage: cd <page>', 'system');
            return;
        }
        
        // Normalize path
        let targetPath = path.startsWith('/') ? path : '/' + path;
        if (targetPath !== '/' && targetPath.endsWith('/')) {
            targetPath = targetPath.slice(0, -1);
        }
        
        // Check if page exists
        if (this.pages[targetPath]) {
            this.addOutput(`Navigating to ${this.pages[targetPath].title}...`, 'system');
            // Delay navigation slightly for better UX
            setTimeout(() => {
                window.location.href = this.pages[targetPath].url;
            }, 500);
        } else {
            this.addOutput(`cd: no such page: ${path}`, 'error');
            this.addOutput('Use "ls" to see available pages', 'system');
        }
    }
    
    printWorkingDirectory() {
        const pageName = this.pages[this.currentPath]?.title || 'Unknown';
        this.addOutput(`${this.currentPath} (${pageName})`, 'system');
    }
    
    clearOutput() {
        this.output.innerHTML = '';
    }
    
    showUser() {
        this.addOutput('l337_h4ck3r', 'system');
        this.addOutput('Member of hackercats collective', 'system');
        this.addOutput('Access level: ADMIN', 'system');
    }
    
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
    
    addOutput(text, type = 'output') {
        const line = document.createElement('div');
        line.className = `terminal-output-line terminal-output-${type}`;
        line.textContent = text;
        this.output.appendChild(line);
    }
    
    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    enterVimMode() {
        this.vimMode = true;
        this.input.blur();
        this.terminal.classList.add('vim-mode');
        this.updatePrompt();
        
        // Show vim mode indicator
        this.addOutput('-- VIM MODE --', 'vim-indicator');
        this.addOutput('j/k: scroll • i: insert mode • q: quit • ?: help', 'vim-help');
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
                    this.scrollToBottom();
                } else {
                    // Handle gg (go to top) - would need double-tap logic
                    this.scrollToTop();
                }
                break;
            case 'd':
                if (e.ctrlKey) {
                    this.scrollDown(5);
                }
                break;
            case 'u':
                if (e.ctrlKey) {
                    this.scrollUp(5);
                }
                break;
            case 'i':
                this.exitVimMode();
                break;
            case 'q':
                this.hide();
                break;
            case '?':
                this.showVimHelp();
                break;
            case 'arrowup':
                this.scrollUp();
                break;
            case 'arrowdown':
                this.scrollDown();
                break;
        }
    }
    
    scrollUp(lines = 1) {
        const lineHeight = 22; // Approximate line height
        this.output.scrollTop = Math.max(0, this.output.scrollTop - (lineHeight * lines));
    }
    
    scrollDown(lines = 1) {
        const lineHeight = 22;
        const maxScroll = this.output.scrollHeight - this.output.clientHeight;
        this.output.scrollTop = Math.min(maxScroll, this.output.scrollTop + (lineHeight * lines));
    }
    
    scrollToTop() {
        this.output.scrollTop = 0;
    }
    
    showVimHelp() {
        this.addOutput('VIM MODE COMMANDS', 'section');
        this.addOutput('', 'system');
        this.addOutput('j / ↓        - Scroll down', 'command-item');
        this.addOutput('k / ↑        - Scroll up', 'command-item');
        this.addOutput('Ctrl+d       - Scroll down 5 lines', 'command-item');
        this.addOutput('Ctrl+u       - Scroll up 5 lines', 'command-item');
        this.addOutput('g            - Go to top', 'command-item');
        this.addOutput('G            - Go to bottom', 'command-item');
        this.addOutput('i            - Enter insert mode', 'command-item');
        this.addOutput('q            - Quit terminal', 'command-item');
        this.addOutput('?            - Show this help', 'command-item');
        this.addOutput('', 'system');
    }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HackercatsTerminal();
});