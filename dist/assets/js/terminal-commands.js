// Base Command Interface
class TerminalCommand {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
    
    // Abstract method - must be implemented by subclasses
    execute(args, terminal) {
        throw new Error('execute() method must be implemented');
    }
    
    // Optional: Custom tab completion logic
    getCompletions(args, terminal) {
        return [];
    }
    
    // Optional: Custom help text
    getHelp() {
        return this.description;
    }
}

// Built-in Commands
class HelpCommand extends TerminalCommand {
    constructor() {
        super('help', 'Show available commands');
    }
    
    execute(args, terminal) {
        const isMobile = window.innerWidth <= 768;
        
        terminal.addOutput('HACKERCATS TERMINAL HELP', 'header');
        terminal.addOutput('', 'system');
        
        terminal.addOutput('COMMANDS', 'section');
        terminal.addOutput('', 'system');
        
        // Get all registered commands
        Object.entries(terminal.commandRegistry.commands).forEach(([name, cmd]) => {
            const cmdDisplay = cmd.usage || name;
            if (isMobile) {
                // Compact mobile format
                terminal.addOutput(`${cmdDisplay}`, 'command-item');
                terminal.addOutput(`  ${cmd.description}`, 'system');
            } else {
                terminal.addOutput(`${cmdDisplay.padEnd(15)} - ${cmd.description}`, 'command-item');
            }
        });
        
        if (!isMobile) {
            terminal.addOutput('', 'system');
            terminal.addOutput('KEYBOARD SHORTCUTS', 'section');
            terminal.addOutput('', 'system');
            terminal.addOutput('Ctrl + `        - Open/close terminal', 'command-item');
            terminal.addOutput('Ctrl + R        - Reverse history search', 'command-item');
            terminal.addOutput('Ctrl + L        - Clear screen', 'command-item');
            terminal.addOutput('Escape          - Enter vim mode / Cancel search', 'command-item');
            terminal.addOutput('Up/Down arrows  - Navigate command history', 'command-item');
            terminal.addOutput('Tab             - Auto-complete commands/paths', 'command-item');
            terminal.addOutput('Enter           - Execute command', 'command-item');
        }
        
        terminal.addOutput('', 'system');
        terminal.addOutput('Type "ls" to see files', 'hint');
        terminal.addOutput('Use "cd <file>" to open pages', 'hint');
    }
}

class LsCommand extends TerminalCommand {
    constructor() {
        super('ls', 'List files and directories');
    }
    
    execute(args, terminal) {
        const fileSystem = terminal.fileSystem;
        const currentDir = fileSystem.getCurrentDirectory();
        const entries = fileSystem.listDirectory(terminal.currentPath);
        const isMobile = window.innerWidth <= 768;
        
        if (entries.length === 0) {
            terminal.addOutput('Directory is empty', 'hint');
            return;
        }
        
        terminal.addOutput(`CONTENTS OF ${terminal.currentPath}`, 'section');
        terminal.addOutput('', 'system');
        
        entries.forEach(entry => {
            const icon = fileSystem.getFileIcon(entry);
            const type = entry.type === 'directory' ? 'DIR' : entry.extension.toUpperCase();
            const size = entry.type === 'directory' ? '-' : `${entry.size}B`;
            const permissions = entry.permissions || 'r--';
            
            if (isMobile) {
                // Compact mobile format
                terminal.addOutput(`${icon} ${entry.name}`, 'command-item');
            } else {
                terminal.addOutput(
                    `${permissions} ${type.padEnd(4)} ${size.padStart(6)} ${icon} ${entry.name}`,
                    'command-item'
                );
            }
        });
        
        terminal.addOutput('', 'system');
        terminal.addOutput(`${entries.length} items`, 'hint');
    }
}

class CdCommand extends TerminalCommand {
    constructor() {
        super('cd <path>', 'Navigate to a directory or file');
        this.usage = 'cd <path>';
    }
    
    execute(args, terminal) {
        if (args.length === 0) {
            terminal.addOutput('cd: missing argument', 'error');
            terminal.addOutput('Usage: cd <path>', 'system');
            return;
        }
        
        const path = args.join(' ');
        const fileSystem = terminal.fileSystem;
        const targetEntry = fileSystem.resolvePath(path, terminal.currentPath);
        
        if (!targetEntry) {
            terminal.addOutput(`cd: no such file or directory: ${path}`, 'error');
            terminal.addOutput('Use "ls" to see available files and directories', 'system');
            return;
        }
        
        if (targetEntry.type === 'file' && targetEntry.extension === 'html') {
            // Navigate to the page
            terminal.addOutput(`Opening ${targetEntry.name}...`, 'system');
            setTimeout(() => {
                window.location.href = targetEntry.url;
            }, 500);
        } else if (targetEntry.type === 'directory') {
            terminal.currentPath = targetEntry.path;
            terminal.addOutput(`Changed directory to ${targetEntry.path}`, 'system');
            terminal.updatePrompt();
        } else {
            terminal.addOutput(`${targetEntry.name}: Not a directory or navigable file`, 'error');
        }
    }
    
    getCompletions(args, terminal) {
        const partial = args.join(' ');
        const entries = terminal.fileSystem.listDirectory(terminal.currentPath);
        
        return entries
            .filter(entry => entry.name.startsWith(partial))
            .map(entry => entry.name);
    }
}

class PwdCommand extends TerminalCommand {
    constructor() {
        super('pwd', 'Show current directory');
    }
    
    execute(args, terminal) {
        const currentEntry = terminal.fileSystem.resolvePath('.', terminal.currentPath);
        const title = currentEntry ? currentEntry.title : 'Unknown';
        terminal.addOutput(`${terminal.currentPath} (${title})`, 'system');
    }
}

class ClearCommand extends TerminalCommand {
    constructor() {
        super('clear', 'Clear terminal output');
    }
    
    execute(args, terminal) {
        terminal.clearOutput();
    }
}

class WhoamiCommand extends TerminalCommand {
    constructor() {
        super('whoami', 'Display user info');
    }
    
    execute(args, terminal) {
        terminal.addOutput('l337_h4ck3r', 'system');
        terminal.addOutput('Member of hackercats collective', 'system');
        terminal.addOutput('Access level: ADMIN', 'system');
    }
}

class QrCommand extends TerminalCommand {
    constructor() {
        super('qr', 'Open Discord QR code page');
    }
    
    execute(args, terminal) {
        terminal.addOutput('Opening Discord QR code page...', 'system');
        terminal.addOutput('Scan the QR code to join our Discord server!', 'hint');
        setTimeout(() => {
            window.location.href = '/qr/';
        }, 500);
    }
}

class ExitCommand extends TerminalCommand {
    constructor() {
        super('exit', 'Close terminal');
    }
    
    execute(args, terminal) {
        terminal.hide();
    }
}

class CatCommand extends TerminalCommand {
    constructor() {
        super('cat <file>', 'Display file contents');
        this.usage = 'cat <file>';
    }
    
    execute(args, terminal) {
        if (args.length === 0) {
            terminal.addOutput('cat: missing file argument', 'error');
            terminal.addOutput('Usage: cat <file>', 'system');
            return;
        }
        
        const filename = args.join(' ');
        const file = terminal.fileSystem.resolvePath(filename, terminal.currentPath);
        
        if (!file) {
            terminal.addOutput(`cat: ${filename}: No such file or directory`, 'error');
            return;
        }
        
        if (file.isDirectory()) {
            terminal.addOutput(`cat: ${filename}: Is a directory`, 'error');
            return;
        }
        
        if (file.permissions.includes('r')) {
            terminal.addOutput(`=== ${file.name} ===`, 'section');
            terminal.addOutput(file.content, 'system');
            terminal.addOutput('', 'system');
        } else {
            terminal.addOutput(`cat: ${filename}: Permission denied`, 'error');
        }
    }
    
    getCompletions(args, terminal) {
        const partial = args.join(' ');
        const entries = terminal.fileSystem.listDirectory(terminal.currentPath);
        
        return entries
            .filter(entry => entry.isFile() && entry.name.startsWith(partial))
            .map(entry => entry.name);
    }
}

class FindCommand extends TerminalCommand {
    constructor() {
        super('find <pattern>', 'Search for files matching pattern');
        this.usage = 'find <pattern>';
    }
    
    execute(args, terminal) {
        if (args.length === 0) {
            terminal.addOutput('find: missing search pattern', 'error');
            terminal.addOutput('Usage: find <pattern>', 'system');
            return;
        }
        
        const pattern = args.join(' ');
        const results = terminal.fileSystem.find(pattern);
        
        if (results.length === 0) {
            terminal.addOutput(`No files found matching '${pattern}'`, 'hint');
            return;
        }
        
        terminal.addOutput(`SEARCH RESULTS FOR '${pattern}'`, 'section');
        terminal.addOutput('', 'system');
        
        results.forEach(result => {
            const icon = terminal.fileSystem.getFileIcon(result);
            const type = result.isDirectory() ? 'DIR' : result.extension.toUpperCase();
            terminal.addOutput(`${type.padEnd(4)} ${icon} ${result.fullPath}`, 'command-item');
        });
        
        terminal.addOutput('', 'system');
        terminal.addOutput(`${results.length} files found`, 'hint');
    }
}

class TreeCommand extends TerminalCommand {
    constructor() {
        super('tree', 'Show directory tree structure');
    }
    
    execute(args, terminal) {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Mobile: show simplified list instead of tree
            terminal.addOutput('SITE STRUCTURE', 'section');
            terminal.addOutput('', 'system');
            const entries = terminal.fileSystem.find('');
            entries.slice(0, 15).forEach(entry => {
                const icon = terminal.fileSystem.getFileIcon(entry);
                terminal.addOutput(`${icon} ${entry.name}`, 'command-item');
            });
            if (entries.length > 15) {
                terminal.addOutput(`... and ${entries.length - 15} more`, 'hint');
            }
        } else {
            terminal.addOutput('hackercats.club/', 'section');
            this.showTree(terminal.fileSystem.root, '', terminal, true);
            
            // Count total files and directories
            const allEntries = terminal.fileSystem.find('');
            const dirs = allEntries.filter(e => e.isDirectory()).length;
            const files = allEntries.filter(e => e.isFile()).length;
            
            terminal.addOutput('', 'system');
            terminal.addOutput(`${dirs} directories, ${files} files`, 'hint');
        }
    }
    
    showTree(entry, prefix, terminal, isLast = false) {
        if (entry === terminal.fileSystem.root) {
            // Show root contents
            const children = Object.values(entry.children).sort((a, b) => {
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.name.localeCompare(b.name);
            });
            
            children.forEach((child, index) => {
                const isChildLast = index === children.length - 1;
                const childPrefix = isChildLast ? '└── ' : '├── ';
                const icon = terminal.fileSystem.getFileIcon(child);
                
                terminal.addOutput(`${childPrefix}${icon} ${child.name}`, 'system');
                
                if (child.isDirectory() && Object.keys(child.children).length > 0) {
                    const nextPrefix = isChildLast ? '    ' : '│   ';
                    this.showTreeChildren(child, nextPrefix, terminal);
                }
            });
        }
    }
    
    showTreeChildren(entry, prefix, terminal) {
        const children = Object.values(entry.children).sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });
        
        children.forEach((child, index) => {
            const isLast = index === children.length - 1;
            const childPrefix = isLast ? '└── ' : '├── ';
            const icon = terminal.fileSystem.getFileIcon(child);
            
            terminal.addOutput(`${prefix}${childPrefix}${icon} ${child.name}`, 'system');
            
            if (child.isDirectory() && Object.keys(child.children).length > 0) {
                const nextPrefix = prefix + (isLast ? '    ' : '│   ');
                this.showTreeChildren(child, nextPrefix, terminal);
            }
        });
    }
}

// Command Registry
class CommandRegistry {
    constructor() {
        this.commands = {};
        this.registerBuiltinCommands();
    }
    
    register(command) {
        this.commands[command.name.split(' ')[0]] = command;
    }
    
    get(commandName) {
        return this.commands[commandName];
    }
    
    list() {
        return Object.keys(this.commands);
    }
    
    registerBuiltinCommands() {
        this.register(new HelpCommand());
        this.register(new LsCommand());
        this.register(new CdCommand());
        this.register(new PwdCommand());
        this.register(new ClearCommand());
        this.register(new WhoamiCommand());
        this.register(new QrCommand());
        this.register(new CatCommand());
        this.register(new FindCommand());
        this.register(new TreeCommand());
        this.register(new ExitCommand());
    }
}