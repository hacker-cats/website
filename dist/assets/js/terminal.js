class HackercatsTerminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.closeBtn = document.querySelector('.terminal-close');
        
        this.currentPath = '/';
        this.commandHistory = this.loadCommandHistory();
        this.historyIndex = -1;
        this.vimMode = false;
        this.scrollPosition = 0;
        this.searchMode = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.searchIndex = 0;
        this.historySearchMode = false;
        this.historySearchQuery = '';
        this.historySearchResults = [];
        this.historySearchIndex = 0;
        
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
            'tree': 'Show site structure',
            'uptime': 'Show system uptime',
            'hash <text>': 'Generate MD5/SHA256 hash',
            'base64 <text>': 'Encode/decode base64',
            'md5 <text>': 'Generate MD5 hash',
            'email': 'Show contact information',
            'matrix': 'Enter the matrix...',
            'cowsay <text>': 'ASCII cow says your message',
            'fortune': 'Display hacker wisdom',
            'sl': 'Steam locomotive',
            'history': 'Show command history',
            'history -c': 'Clear command history',
            'history -n': 'Show last n commands',
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
            // Ctrl + R for history search
            else if (e.ctrlKey && e.key === 'r' && this.terminal.classList.contains('active') && !this.vimMode) {
                e.preventDefault();
                this.enterHistorySearch();
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
            if (this.historySearchMode) {
                this.handleHistorySearchKeydown(e);
                return;
            }
            
            if (e.key === 'Enter') {
                this.processCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
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
        if (this.historySearchMode) {
            const match = this.historySearchResults.length > 0 ? this.historySearchResults[this.historySearchIndex] : '';
            prompt.textContent = `(reverse-i-search)\`${this.historySearchQuery}': ${match}`;
        } else if (this.searchMode) {
            prompt.textContent = `-- SEARCH -- `;
        } else if (this.vimMode) {
            prompt.textContent = `-- VIM -- `;
        } else {
            prompt.textContent = `hackercats@${pageName}:~$ `;
        }
    }
    
    processCommand() {
        const command = this.input.value.trim();
        if (command) {
            this.commandHistory.unshift(command);
            this.saveCommandHistory();
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
            case 'tree':
                this.showTree();
                break;
            case 'uptime':
                this.showUptime();
                break;
            case 'hash':
                this.generateHash(args.join(' '));
                break;
            case 'base64':
                this.processBase64(args.join(' '));
                break;
            case 'md5':
                this.generateMD5(args.join(' '));
                break;
            case 'email':
                this.showEmail();
                break;
            case 'matrix':
                this.startMatrix();
                break;
            case 'cowsay':
                this.cowsay(args.join(' '));
                break;
            case 'fortune':
                this.showFortune();
                break;
            case 'sl':
                this.steamLocomotive();
                break;
            case 'history':
                this.showHistory(args);
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
        this.addOutput('Ctrl + R        - Reverse history search', 'command-item');
        this.addOutput('Escape          - Enter vim mode / Cancel search', 'command-item');
        this.addOutput('Up/Down arrows  - Navigate command history', 'command-item');
        this.addOutput('Tab             - Auto-complete commands/paths', 'command-item');
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
        
        if (this.searchMode) {
            this.handleSearchKeydown(e);
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case '/':
                this.enterSearchMode();
                break;
            case 'n':
                this.searchNext();
                break;
            case 'N':
                if (e.shiftKey) {
                    this.searchPrevious();
                }
                break;
            case 'y':
                // Single line yank
                this.yankLine();
                break;
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
            case 'arrowleft':
            case 'arrowright':
                // Arrow keys for navigation
                if (e.key === 'arrowleft') {
                    this.scrollUp();
                } else {
                    this.scrollDown();
                }
                break;
            case 'escape':
                this.exitVimMode();
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
        this.addOutput('NAVIGATION', 'section');
        this.addOutput('j / ↓        - Scroll down', 'command-item');
        this.addOutput('k / ↑        - Scroll up', 'command-item');
        this.addOutput('Ctrl+d       - Scroll down 5 lines', 'command-item');
        this.addOutput('Ctrl+u       - Scroll up 5 lines', 'command-item');
        this.addOutput('g            - Go to top', 'command-item');
        this.addOutput('G            - Go to bottom', 'command-item');
        this.addOutput('←/→          - Scroll up/down', 'command-item');
        this.addOutput('', 'system');
        this.addOutput('SEARCH', 'section');
        this.addOutput('/            - Enter search mode', 'command-item');
        this.addOutput('n            - Next search result', 'command-item');
        this.addOutput('N            - Previous search result', 'command-item');
        this.addOutput('', 'system');
        this.addOutput('YANK', 'section');
        this.addOutput('y            - Yank (copy) current line', 'command-item');
        this.addOutput('', 'system');
        this.addOutput('MODE CONTROL', 'section');
        this.addOutput('i            - Enter insert mode', 'command-item');
        this.addOutput('q            - Quit terminal', 'command-item');
        this.addOutput('?            - Show this help', 'command-item');
        this.addOutput('', 'system');
    }
    
    // New command implementations
    showTree() {
        this.addOutput('hackercats.club/', 'section');
        this.addOutput('├── home/', 'system');
        this.addOutput('│   └── index.html', 'system');
        this.addOutput('├── about/', 'system');
        this.addOutput('│   ├── team.txt', 'system');
        this.addOutput('│   └── mission.md', 'system');
        this.addOutput('├── events/', 'system');
        this.addOutput('│   ├── hackathons.log', 'system');
        this.addOutput('│   └── workshops.cfg', 'system');
        this.addOutput('├── projects/', 'system');
        this.addOutput('│   ├── campus-navigator/', 'system');
        this.addOutput('│   ├── studybuddy/', 'system');
        this.addOutput('│   └── pixel-quest/', 'system');
        this.addOutput('├── stats/', 'system');
        this.addOutput('│   ├── ctf-results.db', 'system');
        this.addOutput('│   └── member-scores.json', 'system');
        this.addOutput('└── join/', 'system');
        this.addOutput('    ├── discord-invite.link', 'system');
        this.addOutput('    └── application.form', 'system');
        this.addOutput('', 'system');
        this.addOutput('8 directories, 10 files', 'hint');
    }
    
    showUptime() {
        const now = new Date();
        const startDate = new Date('2023-01-15'); // Fake start date
        const uptime = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        this.addOutput(`${hours}:${minutes}:${now.getSeconds().toString().padStart(2, '0')} up ${uptime} days, 3 users, load average: 0.15, 0.09, 0.05`, 'system');
        this.addOutput('hackercats@mainframe processes: 1337 active, 42 sleeping', 'hint');
    }
    
    async generateHash(text) {
        if (!text) {
            this.addOutput('hash: missing argument', 'error');
            this.addOutput('Usage: hash <text>', 'system');
            return;
        }
        
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            const md5Hash = await this.simpleMD5(text);
            const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
            const sha256Hash = Array.from(new Uint8Array(sha256Buffer))
                .map(b => b.toString(16).padStart(2, '0')).join('');
            
            this.addOutput(`MD5:    ${md5Hash}`, 'command-item');
            this.addOutput(`SHA256: ${sha256Hash}`, 'command-item');
        } catch (error) {
            this.addOutput('Error generating hash', 'error');
        }
    }
    
    processBase64(text) {
        if (!text) {
            this.addOutput('base64: missing argument', 'error');
            this.addOutput('Usage: base64 <text>', 'system');
            return;
        }
        
        try {
            // Try to decode first (if it's base64)
            if (/^[A-Za-z0-9+/]*={0,2}$/.test(text) && text.length % 4 === 0) {
                try {
                    const decoded = atob(text);
                    this.addOutput(`Decoded: ${decoded}`, 'command-item');
                    return;
                } catch (e) {
                    // Not valid base64, encode it
                }
            }
            
            // Encode the text
            const encoded = btoa(text);
            this.addOutput(`Encoded: ${encoded}`, 'command-item');
        } catch (error) {
            this.addOutput('Error processing base64', 'error');
        }
    }
    
    async generateMD5(text) {
        if (!text) {
            this.addOutput('md5: missing argument', 'error');
            this.addOutput('Usage: md5 <text>', 'system');
            return;
        }
        
        const hash = await this.simpleMD5(text);
        this.addOutput(hash, 'command-item');
    }
    
    // Simple MD5 implementation (for demo purposes)
    async simpleMD5(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data); // Using SHA-1 as MD5 substitute
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    showEmail() {
        this.addOutput('CONTACT INFORMATION', 'section');
        this.addOutput('', 'system');
        this.addOutput('📧 Email: hackercats@college.edu', 'command-item');
        this.addOutput('💬 Discord: @hackercats-admins', 'command-item');
        this.addOutput('🏢 Location: Computer Science Building, Room 101', 'command-item');
        this.addOutput('🕒 Meetings: Wednesdays at 6:00 PM', 'command-item');
        this.addOutput('', 'system');
        this.addOutput('> Join our Discord for fastest response!', 'hint');
    }
    
    startMatrix() {
        this.addOutput('Initializing matrix protocol...', 'system');
        this.addOutput('', 'system');
        
        const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const lines = 8;
        
        for (let i = 0; i < lines; i++) {
            let line = '';
            for (let j = 0; j < 60; j++) {
                line += matrixChars[Math.floor(Math.random() * matrixChars.length)];
            }
            setTimeout(() => {
                this.addOutput(line, 'matrix');
            }, i * 200);
        }
        
        setTimeout(() => {
            this.addOutput('', 'system');
            this.addOutput('Matrix connection established. Welcome to the real world.', 'hint');
        }, lines * 200 + 500);
    }
    
    cowsay(message) {
        if (!message) {
            message = 'moo! welcome to hackercats!';
        }
        
        const msgLength = message.length;
        const border = '-'.repeat(msgLength + 2);
        
        this.addOutput(` ${border}`, 'system');
        this.addOutput(`< ${message} >`, 'command-item');
        this.addOutput(` ${border}`, 'system');
        this.addOutput('        \\   ^__^', 'system');
        this.addOutput('         \\  (oo)\\_______', 'system');
        this.addOutput('            (__)\\       )\\/\\', 'system');
        this.addOutput('                ||----w |', 'system');
        this.addOutput('                ||     ||', 'system');
    }
    
    showFortune() {
        const fortunes = [
            "A bug in the code is worth two in the documentation.",
            "Real programmers count from 0.",
            "There are only 10 types of people: those who understand binary and those who don't.",
            "To err is human, but to really foul things up requires a computer.",
            "The best way to accelerate a computer is at 9.8 m/s².",
            "Programming is like sex: one mistake and you have to support it for the rest of your life.",
            "Debugging is twice as hard as writing the code. So if you write the code as cleverly as possible, you are not smart enough to debug it.",
            "Code never lies, comments sometimes do.",
            "A good programmer is someone who always looks both ways before crossing a one-way street.",
            "First, solve the problem. Then, write the code.",
            "Experience is the name everyone gives to their mistakes.",
            "The computer was born to solve problems that did not exist before."
        ];
        
        const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        this.addOutput(`💭 ${randomFortune}`, 'hint');
    }
    
    steamLocomotive() {
        this.addOutput('', 'system');
        this.addOutput('                          (  ) (  ) (  )', 'system');
        this.addOutput('                       ) (  ) (  ) (', 'system');
        this.addOutput('                    ( (  ) (  ) (  ) )', 'system');
        this.addOutput('                  (  ) (  ) (  ) (  )', 'system');
        this.addOutput('                ) (  ) (  ) (  ) (', 'system');
        this.addOutput('               (  (  ) (  ) (  ) )', 'system');
        this.addOutput('             ) (  ) (  ) (  ) (', 'system');
        this.addOutput('            (  (  ) (  ) (  ) )', 'system');
        this.addOutput('              ____', 'system');
        this.addOutput('             |DD|____T_', 'system');
        this.addOutput('            |_ |_____|<', 'system');
        this.addOutput('             @-@-@-oo\\', 'system');
        this.addOutput('', 'system');
        this.addOutput('choo choo! 🚂', 'hint');
    }
    
    // Tab completion functionality
    handleTabCompletion() {
        const currentInput = this.input.value;
        const [command, ...args] = currentInput.split(' ');
        
        if (args.length === 0) {
            // Complete command names
            const matches = Object.keys(this.commands).filter(cmd => 
                cmd.startsWith(command)
            );
            
            if (matches.length === 1) {
                this.input.value = matches[0] + ' ';
            } else if (matches.length > 1) {
                this.showCompletions(matches);
            }
        } else if (command === 'cd') {
            // Complete page paths
            const partial = args.join(' ');
            const matches = Object.keys(this.pages).filter(path => 
                path.startsWith(partial) || path.substring(1).startsWith(partial)
            );
            
            if (matches.length === 1) {
                this.input.value = `cd ${matches[0]}`;
            } else if (matches.length > 1) {
                this.showCompletions(matches.map(path => `cd ${path}`));
            }
        }
    }
    
    showCompletions(matches) {
        this.addOutput('Completions:', 'hint');
        matches.forEach(match => {
            this.addOutput(`  ${match}`, 'command-item');
        });
        this.addOutput('', 'system');
    }
    
    // Search functionality
    enterSearchMode() {
        this.searchMode = true;
        this.searchQuery = '';
        this.addOutput('/', 'search-prompt');
        this.updatePrompt();
    }
    
    handleSearchKeydown(e) {
        if (e.key === 'Enter') {
            this.performSearch();
        } else if (e.key === 'Escape') {
            this.exitSearchMode();
        } else if (e.key === 'Backspace') {
            this.searchQuery = this.searchQuery.slice(0, -1);
            this.updateSearchPrompt();
        } else if (e.key.length === 1) {
            this.searchQuery += e.key;
            this.updateSearchPrompt();
        }
    }
    
    updateSearchPrompt() {
        const lines = this.output.querySelectorAll('.terminal-output-line');
        const lastLine = lines[lines.length - 1];
        if (lastLine && lastLine.classList.contains('terminal-output-search-prompt')) {
            lastLine.textContent = '/' + this.searchQuery;
        }
    }
    
    performSearch() {
        if (!this.searchQuery) {
            this.exitSearchMode();
            return;
        }
        
        const lines = Array.from(this.output.querySelectorAll('.terminal-output-line'));
        this.searchResults = [];
        
        lines.forEach((line, index) => {
            if (line.textContent.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                this.searchResults.push({ element: line, index });
            }
        });
        
        this.searchIndex = 0;
        this.exitSearchMode();
        
        if (this.searchResults.length > 0) {
            this.highlightSearchResult();
            this.addOutput(`Found ${this.searchResults.length} matches for "${this.searchQuery}"`, 'hint');
        } else {
            this.addOutput(`No matches found for "${this.searchQuery}"`, 'error');
        }
    }
    
    searchNext() {
        if (this.searchResults.length === 0) return;
        
        this.clearSearchHighlight();
        this.searchIndex = (this.searchIndex + 1) % this.searchResults.length;
        this.highlightSearchResult();
    }
    
    searchPrevious() {
        if (this.searchResults.length === 0) return;
        
        this.clearSearchHighlight();
        this.searchIndex = this.searchIndex === 0 ? this.searchResults.length - 1 : this.searchIndex - 1;
        this.highlightSearchResult();
    }
    
    highlightSearchResult() {
        if (this.searchResults.length === 0) return;
        
        const result = this.searchResults[this.searchIndex];
        result.element.classList.add('search-highlight');
        result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    clearSearchHighlight() {
        this.output.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
    }
    
    exitSearchMode() {
        this.searchMode = false;
        this.updatePrompt();
    }
    
    yankLine() {
        const lines = Array.from(this.output.querySelectorAll('.terminal-output-line'));
        const scrollTop = this.output.scrollTop;
        const lineHeight = 22;
        const currentLineIndex = Math.floor(scrollTop / lineHeight);
        
        if (currentLineIndex < lines.length) {
            const text = lines[currentLineIndex].textContent;
            this.copyToClipboard(text);
            this.addOutput('1 line yanked', 'hint');
        } else {
            this.addOutput('No line to yank', 'hint');
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
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
    
    clearCommandHistory() {
        this.commandHistory = [];
        try {
            localStorage.removeItem('hackercats_terminal_history');
        } catch (error) {
            console.warn('Failed to clear command history:', error);
        }
    }
    
    showHistory(args) {
        if (args.length === 0) {
            // Show all history
            this.addOutput('COMMAND HISTORY', 'section');
            this.addOutput('', 'system');
            
            if (this.commandHistory.length === 0) {
                this.addOutput('No commands in history', 'hint');
                return;
            }
            
            this.commandHistory.slice().reverse().forEach((cmd, index) => {
                const lineNumber = (index + 1).toString().padStart(4, ' ');
                this.addOutput(`${lineNumber}  ${cmd}`, 'command-item');
            });
            
            this.addOutput('', 'system');
            this.addOutput(`Total: ${this.commandHistory.length} commands`, 'hint');
            
        } else if (args[0] === '-c') {
            // Clear history
            this.clearCommandHistory();
            this.addOutput('Command history cleared', 'system');
            
        } else if (args[0] === '-n' && args[1]) {
            // Show last n commands
            const n = parseInt(args[1]);
            if (isNaN(n) || n < 1) {
                this.addOutput('history: invalid number', 'error');
                this.addOutput('Usage: history -n <number>', 'system');
                return;
            }
            
            this.addOutput(`LAST ${n} COMMANDS`, 'section');
            this.addOutput('', 'system');
            
            const recentCommands = this.commandHistory.slice(0, n).reverse();
            if (recentCommands.length === 0) {
                this.addOutput('No commands in history', 'hint');
                return;
            }
            
            recentCommands.forEach((cmd, index) => {
                const lineNumber = (this.commandHistory.length - n + index + 1).toString().padStart(4, ' ');
                this.addOutput(`${lineNumber}  ${cmd}`, 'command-item');
            });
            
        } else if (!isNaN(parseInt(args[0]))) {
            // Show last n commands (shorthand)
            const n = parseInt(args[0]);
            this.showHistory(['-n', n.toString()]);
            
        } else {
            this.addOutput('history: invalid option', 'error');
            this.addOutput('Usage: history [-c] [-n <number>] [<number>]', 'system');
            this.addOutput('  -c        Clear command history', 'system');
            this.addOutput('  -n <num>  Show last <num> commands', 'system');
            this.addOutput('  <num>     Show last <num> commands (shorthand)', 'system');
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
            // Cancel search
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
        
        // Prevent default behavior for all keys in history search mode
        e.preventDefault();
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
            // Position cursor at end of match
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
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HackercatsTerminal();
});