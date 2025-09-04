// File System API for Terminal

class FileSystemEntry {
    constructor(name, type, options = {}) {
        this.name = name;
        this.type = type; // 'file' | 'directory'
        this.path = options.path || '/';
        this.size = options.size || 0;
        this.permissions = options.permissions || 'r--';
        this.created = options.created || new Date();
        this.modified = options.modified || new Date();
        
        // File-specific properties
        this.extension = options.extension || '';
        this.content = options.content || '';
        this.url = options.url || '';
        this.title = options.title || name;
        
        // Directory-specific properties
        this.children = options.children || {};
    }
    
    isDirectory() {
        return this.type === 'directory';
    }
    
    isFile() {
        return this.type === 'file';
    }
}

class VirtualFileSystem {
    constructor() {
        this.root = new FileSystemEntry('/', 'directory', {
            path: '/',
            title: 'Root Directory'
        });
        
        this.initializeFileSystem();
    }
    
    initializeFileSystem() {
        // Create page files in root directory
        this.addFile('/', 'index.html', {
            title: 'Home',
            url: '/',
            size: 2048,
            content: 'Welcome to hackercats - Montana State University\'s cybersecurity club'
        });
        
        this.addFile('/', 'about.html', {
            title: 'About',
            url: '/about',
            size: 1536,
            content: 'Learn about our cybersecurity club at Montana State University'
        });
        
        this.addFile('/', 'events.html', {
            title: 'Events',
            url: '/events', 
            size: 1792,
            content: 'Upcoming meetings, CTF competitions, and community events'
        });
        
        this.addFile('/', 'stats.html', {
            title: 'CTF Stats',
            url: '/stats',
            size: 1024,
            content: 'Our team performance in Capture The Flag competitions'
        });
        
        this.addFile('/', 'join.html', {
            title: 'Join Us',
            url: '/join',
            size: 2304,
            content: 'How to join our cybersecurity community at Montana State University'
        });
        
        // Create some additional system files
        this.addFile('/', 'README.md', {
            title: 'README',
            url: '#',
            size: 512,
            content: 'hackercats.exe - Montana State University Cybersecurity Club',
            permissions: 'r--'
        });
        
        this.addFile('/', '.secrets', {
            title: 'Secrets',
            url: '#',
            size: 128,
            content: 'flag{welcome_to_hackercats_msu}',
            permissions: '---'
        });
        
        // Create some directories
        this.addDirectory('/', 'assets', {
            title: 'Assets Directory'
        });
        
        this.addDirectory('/', 'logs', {
            title: 'System Logs'
        });
        
        // Add files to subdirectories
        this.addFile('/assets', 'style.css', {
            title: 'Stylesheet',
            url: '#',
            size: 8192,
            content: '/* Retro cyberpunk styles */'
        });
        
        this.addFile('/assets', 'terminal.js', {
            title: 'Terminal Script',
            url: '#',
            size: 16384,
            content: '// Interactive terminal implementation'
        });
        
        this.addFile('/logs', 'access.log', {
            title: 'Access Log',
            url: '#',
            size: 4096,
            content: 'Recent site access logs...',
            permissions: 'r--'
        });
        
        this.addFile('/logs', 'error.log', {
            title: 'Error Log', 
            url: '#',
            size: 256,
            content: 'No errors detected',
            permissions: 'r--'
        });
    }
    
    addFile(parentPath, name, options = {}) {
        const parent = this.resolvePath(parentPath, '/');
        if (!parent || !parent.isDirectory()) {
            throw new Error(`Parent directory not found: ${parentPath}`);
        }
        
        const extension = name.includes('.') ? name.split('.').pop() : '';
        const filePath = this.joinPath(parentPath, name);
        
        const file = new FileSystemEntry(name, 'file', {
            path: filePath,
            extension: extension,
            ...options
        });
        
        parent.children[name] = file;
        return file;
    }
    
    addDirectory(parentPath, name, options = {}) {
        const parent = this.resolvePath(parentPath, '/');
        if (!parent || !parent.isDirectory()) {
            throw new Error(`Parent directory not found: ${parentPath}`);
        }
        
        const dirPath = this.joinPath(parentPath, name);
        
        const directory = new FileSystemEntry(name, 'directory', {
            path: dirPath,
            children: {},
            ...options
        });
        
        parent.children[name] = directory;
        return directory;
    }
    
    resolvePath(path, currentPath = '/') {
        // Handle special paths
        if (path === '.' || path === '') {
            return this.resolvePath(currentPath, '/');
        }
        
        if (path === '..') {
            const parentPath = this.getParentPath(currentPath);
            return this.resolvePath(parentPath, '/');
        }
        
        // Handle relative vs absolute paths
        let targetPath;
        if (path.startsWith('/')) {
            targetPath = path;
        } else {
            targetPath = this.joinPath(currentPath, path);
        }
        
        // Navigate through the file system
        const pathParts = targetPath.split('/').filter(part => part !== '');
        let current = this.root;
        
        for (const part of pathParts) {
            if (!current.isDirectory() || !current.children[part]) {
                return null;
            }
            current = current.children[part];
        }
        
        return current;
    }
    
    listDirectory(path) {
        const dir = this.resolvePath(path, '/');
        if (!dir || !dir.isDirectory()) {
            return [];
        }
        
        return Object.values(dir.children).sort((a, b) => {
            // Directories first, then files
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });
    }
    
    getCurrentDirectory(path = '/') {
        return this.resolvePath(path, '/');
    }
    
    getFileIcon(entry) {
        if (entry.isDirectory()) {
            return '📁';
        }
        
        const icons = {
            'html': '🌐',
            'css': '🎨',
            'js': '⚙️',
            'md': '📝',
            'log': '📋',
            'txt': '📄',
            'secrets': '🔒'
        };
        
        return icons[entry.extension] || icons[entry.name] || '📄';
    }
    
    joinPath(basePath, childPath) {
        if (basePath === '/') {
            return '/' + childPath;
        }
        return basePath + '/' + childPath;
    }
    
    getParentPath(path) {
        if (path === '/') {
            return '/';
        }
        const parts = path.split('/').filter(part => part !== '');
        parts.pop();
        return parts.length === 0 ? '/' : '/' + parts.join('/');
    }
    
    // Search functionality
    find(pattern, startPath = '/') {
        const results = [];
        const search = (entry, currentPath) => {
            if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
                results.push({
                    ...entry,
                    fullPath: currentPath
                });
            }
            
            if (entry.isDirectory()) {
                Object.values(entry.children).forEach(child => {
                    search(child, this.joinPath(currentPath, child.name));
                });
            }
        };
        
        const startEntry = this.resolvePath(startPath, '/');
        if (startEntry) {
            search(startEntry, startPath);
        }
        
        return results;
    }
}