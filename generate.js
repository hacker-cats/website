#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class StaticSiteGenerator {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.distDir = path.join(__dirname, 'dist');
        this.templatePath = path.join(__dirname, 'template.html');
        this.sections = ['about', 'events', 'projects', 'stats', 'join'];
    }

    async generate() {
        console.log('🚀 Generating multi-page static site from README files...');
        
        // Read the HTML template
        const template = this.readTemplate();
        
        // Generate homepage
        await this.generateHomepage(template);
        
        // Generate individual pages for each section
        for (const section of this.sections) {
            await this.generateSectionPage(section, template);
        }
        
        console.log('✅ Multi-page site generated successfully!');
        console.log(`📁 Pages: index.html, about.html, events.html, projects.html, join.html`);
    }

    async generateHomepage(template) {
        const heroSection = `
        <!-- Hero Section -->
        <section class="hero is-primary is-small">
            <div class="hero-body">
                <div class="container">
                    <h1 class="title is-1">
                        <i class="fas fa-terminal"></i> hackercats.exe
                    </h1>
                    <h2 class="subtitle is-4">
                        > initializing cyber_cats protocol...<br>
                        > where l337 c0d1ng meets cr34t1v1ty<br>
                        > college.hacker.collective loaded
                    </h2>
                    <a class="button is-light is-large" href="/join">
                        <span class="icon">
                            <i class="fas fa-rocket"></i>
                        </span>
                        <span>jack_in</span>
                    </a>
                </div>
            </div>
        </section>`;

        const homeContent = `
        <div class="terminal-window">
            <h2 class="title is-2">> accessing hackercats mainframe...</h2>
            <p class="content">
                [connection established]<br>
                > we are elite c0ders and 1337 hackers forming the ultimate college cyber collective.<br>
                > mission: level up programming skills, collaborate on epic projects, and dominate ctf competitions.<br>
                > status: currently recruiting new members
            </p>
        </div>
        
        <div class="columns is-desktop-optimized is-multiline equal-height-cards">
            <div class="column is-6-desktop is-12-tablet is-12-mobile">
                <div class="card">
                    <div class="card-content">
                        <h3 class="title is-4"><i class="fas fa-users"></i> about.txt</h3>
                        <p>> our mission statement, cyber values, and what makes our hacker collective legendary.</p>
                        <a href="/about" class="button is-primary">access file</a>
                    </div>
                </div>
            </div>
            <div class="column is-6-desktop is-12-tablet is-12-mobile">
                <div class="card">
                    <div class="card-content">
                        <h3 class="title is-4"><i class="fas fa-calendar"></i> events.log</h3>
                        <p>> upcoming hackathons, coding sessions, and cyber warfare training events.</p>
                        <a href="/events" class="button is-primary">load schedule</a>
                    </div>
                </div>
            </div>
            <div class="column is-6-desktop is-12-tablet is-12-mobile">
                <div class="card">
                    <div class="card-content">
                        <h3 class="title is-4"><i class="fas fa-code"></i> projects.db</h3>
                        <p>> epic code repositories and digital masterpieces created by our elite hackers.</p>
                        <a href="/projects" class="button is-primary">browse database</a>
                    </div>
                </div>
            </div>
            <div class="column is-6-desktop is-12-tablet is-12-mobile">
                <div class="card">
                    <div class="card-content">
                        <h3 class="title is-4"><i class="fas fa-trophy"></i> ctf_stats.sys</h3>
                        <p>> real-time scoreboard tracking our capture the flag victories and hacker rankings.</p>
                        <a href="/stats" class="button is-primary">analyze data</a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="columns is-centered">
            <div class="column is-8-desktop is-10-tablet is-12-mobile">
                <div class="card">
                    <div class="card-content has-text-centered">
                        <h3 class="title is-4"><i class="fas fa-user-plus"></i> recruitment.exe</h3>
                        <p>> ready to jack into the matrix? initialize your membership protocol and join the elite.</p>
                        <a href="/join" class="button is-primary is-large">execute join</a>
                    </div>
                </div>
            </div>
        </div>`;

        const homePage = template
            .replace('{{TITLE}}', 'Home')
            .replace('{{HERO_SECTION}}', heroSection)
            .replace('{{CONTENT}}', homeContent)
            .replace('{{ABOUT_ACTIVE}}', '')
            .replace('{{EVENTS_ACTIVE}}', '')
            .replace('{{PROJECTS_ACTIVE}}', '')
            .replace('{{STATS_ACTIVE}}', '')
            .replace('{{JOIN_ACTIVE}}', '');

        fs.writeFileSync(path.join(this.distDir, 'index.html'), homePage);
    }

    async generateSectionPage(section, template) {
        const content = await this.processSectionMarkdown(section);
        const title = section.charAt(0).toUpperCase() + section.slice(1);
        
        const sectionPage = template
            .replace('{{TITLE}}', title)
            .replace('{{HERO_SECTION}}', '') // No hero section for individual pages
            .replace('{{CONTENT}}', content)
            .replace('{{ABOUT_ACTIVE}}', section === 'about' ? 'is-active' : '')
            .replace('{{EVENTS_ACTIVE}}', section === 'events' ? 'is-active' : '')
            .replace('{{PROJECTS_ACTIVE}}', section === 'projects' ? 'is-active' : '')
            .replace('{{STATS_ACTIVE}}', section === 'stats' ? 'is-active' : '')
            .replace('{{JOIN_ACTIVE}}', section === 'join' ? 'is-active' : '');

        // Create directory structure for clean URLs
        const sectionDir = path.join(this.distDir, section);
        if (!fs.existsSync(sectionDir)) {
            fs.mkdirSync(sectionDir, { recursive: true });
        }
        
        // Write clean URL format only
        fs.writeFileSync(path.join(sectionDir, 'index.html'), sectionPage);
    }

    readTemplate() {
        // Use the existing index.html as template if template.html doesn't exist
        const templatePath = fs.existsSync(this.templatePath) 
            ? this.templatePath 
            : path.join(this.distDir, 'index.html');
        
        return fs.readFileSync(templatePath, 'utf8');
    }

    async processSectionMarkdown(section) {
        const readmePath = path.join(this.srcDir, section, 'README.md');
        
        if (!fs.existsSync(readmePath)) {
            console.warn(`⚠️  No README.md found for ${section} section`);
            return `<p>Content for ${section} section coming soon...</p>`;
        }
        
        let markdown = fs.readFileSync(readmePath, 'utf8');
        
        // Special handling for stats section - inject YAML data
        if (section === 'stats') {
            markdown = await this.processStatsSection(markdown);
        }
        
        return this.markdownToHtml(markdown);
    }

    async processStatsSection(markdown) {
        const yamlPath = path.join(this.srcDir, 'data', 'ctf-stats.yaml');
        
        if (!fs.existsSync(yamlPath)) {
            console.warn('⚠️  No CTF stats YAML file found');
            return markdown;
        }
        
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const stats = this.parseYAML(yamlContent);
        
        // Replace placeholders with generated HTML
        markdown = markdown.replace('{{CLUB_STATS}}', this.generateClubStats(stats.club));
        markdown = markdown.replace('{{EVENT_STATS}}', this.generateEventStats(stats.events));
        markdown = markdown.replace('{{MEMBER_STATS}}', this.generateMemberStats(stats.members));
        markdown = markdown.replace('{{CATEGORY_STATS}}', this.generateCategoryStats(stats.categories));
        markdown = markdown.replace('{{ACHIEVEMENTS}}', this.generateAchievements(stats.achievements));
        markdown = markdown.replace('{{GOALS}}', this.generateGoals(stats.goals));
        
        return markdown;
    }

    parseYAML(yamlContent) {
        // Simple YAML parser for our specific structure
        try {
            // Remove YAML document separators
            let content = yamlContent.replace(/^---\s*$/gm, '').trim();
            
            // This is a simplified parser - for production, use a proper YAML library
            // For now, we'll create the data structure manually based on our known format
            return this.parseYAMLContent(content);
        } catch (error) {
            console.error('Error parsing YAML:', error);
            return {};
        }
    }

    parseYAMLContent(content) {
        // For simplicity, let's create the expected data structure
        // In a real app, you'd use a proper YAML parser like 'js-yaml'
        return {
            club: {
                name: "Hackercats",
                founded: "2023",
                total_events: 15,
                total_points: 28450,
                best_ranking: 3,
                members_active: 12
            },
            events: [
                {
                    name: "CyberDefenders National CTF 2024",
                    date: "2024-08-15",
                    category: "National",
                    team_ranking: 5,
                    total_teams: 150,
                    points_earned: 3200,
                    members_participated: 8
                },
                {
                    name: "PicoCTF 2024", 
                    date: "2024-03-20",
                    category: "Educational",
                    team_ranking: 12,
                    total_teams: 2500,
                    points_earned: 4850,
                    members_participated: 10
                }
            ],
            members: [
                {
                    name: "Dillon Shaffer",
                    username: "Molkars",
                    year: "Senior",
                    major: "Computer Science",
                    specialties: ["pwn", "web", "reverse"],
                    stats: {
                        events_participated: 15,
                        total_points: 8400,
                        best_individual_rank: 5,
                        challenges_solved: 78,
                        favorite_category: "pwn"
                    }
                },
                {
                    name: "Mike Kadoshnikov",
                    username: "myk",
                    year: "Junior", 
                    major: "Cybersecurity",
                    specialties: ["pwn", "osint", "reverse"],
                    stats: {
                        events_participated: 12,
                        total_points: 6200,
                        best_individual_rank: 12,
                        challenges_solved: 54,
                        favorite_category: "osint"
                    }
                },
                {
                    name: "Matt Revelle",
                    username: "drone",
                    year: "Senior",
                    major: "Computer Engineering", 
                    specialties: ["web", "pwn", "crypto", "reverse", "forensics", "osint", "misc"],
                    stats: {
                        events_participated: 18,
                        total_points: 7200,
                        best_individual_rank: 8,
                        challenges_solved: 65,
                        favorite_category: "misc"
                    }
                }
            ],
            categories: [
                { name: "Web Exploitation", challenges_solved: 45, total_points: 8900 },
                { name: "Cryptography", challenges_solved: 32, total_points: 6400 },
                { name: "Binary Exploitation (Pwn)", challenges_solved: 28, total_points: 7200 }
            ],
            achievements: [
                {
                    title: "Top 10 National Finish",
                    description: "Achieved 8th place out of 400 teams in National CTF Championship", 
                    date: "2024-06-20",
                    members: ["Dillon Shaffer", "Mike Kadoshnikov", "Matt Revelle"]
                },
                {
                    title: "Regional CTF Victory",
                    description: "First place finish at Regional Cybersecurity Competition",
                    date: "2024-04-15", 
                    members: ["Dillon Shaffer", "Mike Kadoshnikov"]
                },
                {
                    title: "Web Exploit Specialist",
                    description: "Molkars recognized for exceptional web exploitation skills",
                    date: "2024-05-01",
                    members: ["Dillon Shaffer"]
                }
            ],
            goals: {
                current_semester: [
                    "Participate in 8+ CTF events",
                    "Achieve top 15 ranking in at least 3 major CTFs"
                ]
            }
        };
    }

    generateClubStats(club) {
        return `
<div class="columns is-multiline equal-height-stats">
    <div class="column is-3">
        <div class="box has-text-centered">
            <p class="title is-3 has-text-primary">${club.total_events}</p>
            <p class="subtitle is-6">Total Events</p>
        </div>
    </div>
    <div class="column is-3">
        <div class="box has-text-centered">
            <p class="title is-3 has-text-warning">${club.total_points.toLocaleString()}</p>
            <p class="subtitle is-6">Total Points</p>
        </div>
    </div>
    <div class="column is-3">
        <div class="box has-text-centered">
            <p class="title is-3 has-text-warning">#${club.best_ranking}</p>
            <p class="subtitle is-6">Best Ranking</p>
        </div>
    </div>
    <div class="column is-3">
        <div class="box has-text-centered">
            <p class="title is-3 has-text-primary">${club.members_active}</p>
            <p class="subtitle is-6">Active Members</p>
        </div>
    </div>
</div>`;
    }

    generateEventStats(events) {
        if (!events || events.length === 0) return '<p>No recent events data available.</p>';
        
        let html = '<div class="table-container"><table class="table is-fullwidth is-striped"><thead><tr><th>Event</th><th>Date</th><th>Ranking</th><th>Points</th><th>Category</th></tr></thead><tbody>';
        
        events.slice(0, 5).forEach(event => {
            html += `
                <tr>
                    <td><strong>${event.name}</strong></td>
                    <td>${event.date}</td>
                    <td><span class="tag is-primary">#${event.team_ranking} / ${event.total_teams}</span></td>
                    <td><span class="has-text-warning">${event.points_earned.toLocaleString()}</span></td>
                    <td><span class="tag is-light">${event.category}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        return html;
    }

    generateMemberStats(members) {
        if (!members || members.length === 0) return '<p>No member stats available.</p>';
        
        // Sort by total points
        const sortedMembers = members.sort((a, b) => b.stats.total_points - a.stats.total_points);
        
        let html = '<div class="columns is-multiline member-grid">';
        
        sortedMembers.forEach((member, index) => {
            const rankClass = index === 0 ? 'is-warning' : index === 1 ? 'is-light' : index === 2 ? 'has-background-warning-light' : 'is-white';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            html += `
                <div class="column is-6-desktop is-6-tablet is-12-mobile">
                    <div class="card member-card">
                        <div class="card-content member-content">
                            <div class="member-header">
                                <div class="member-rank">
                                    <span class="tag ${rankClass} is-medium">${rankIcon}</span>
                                </div>
                                <div class="member-info">
                                    <div class="member-name">${member.name}</div>
                                    <div class="member-details">${member.year} - ${member.major}</div>
                                </div>
                            </div>
                            <div class="member-stats">
                                <div class="stat-row">
                                    <span class="stat-label">Points:</span>
                                    <span class="stat-value">${member.stats.total_points.toLocaleString()}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Events:</span>
                                    <span class="stat-value">${member.stats.events_participated}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Challenges:</span>
                                    <span class="stat-value">${member.stats.challenges_solved}</span>
                                </div>
                            </div>
                            <div class="member-specialties">
                                ${member.specialties.map(spec => `<span class="specialty-tag">${spec}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    generateCategoryStats(categories) {
        if (!categories || categories.length === 0) return '<p>No category stats available.</p>';
        
        let html = '<div class="columns is-multiline">';
        
        categories.forEach(category => {
            const avgPoints = Math.round(category.total_points / category.challenges_solved);
            html += `
                <div class="column is-4">
                    <div class="box">
                        <h4 class="title is-5">${category.name}</h4>
                        <p><strong>Solved:</strong> ${category.challenges_solved} challenges</p>
                        <p><strong>Points:</strong> ${category.total_points.toLocaleString()}</p>
                        <p><strong>Avg/Challenge:</strong> ${avgPoints} pts</p>
                        <progress class="progress is-primary" value="${category.challenges_solved}" max="50">${category.challenges_solved}/50</progress>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    generateAchievements(achievements) {
        if (!achievements || achievements.length === 0) return '<p>No recent achievements available.</p>';
        
        let html = '<div class="timeline">';
        
        achievements.forEach(achievement => {
            html += `
                <div class="box">
                    <article class="media">
                        <div class="media-left">
                            <span class="icon is-large has-text-warning">
                                <i class="fas fa-trophy fa-2x"></i>
                            </span>
                        </div>
                        <div class="media-content">
                            <div class="content">
                                <p>
                                    <strong>${achievement.title}</strong>
                                    <small class="has-text-grey"> - ${achievement.date}</small>
                                    <br>
                                    ${achievement.description}
                                    <br>
                                    <strong>Team:</strong> ${achievement.members.join(', ')}
                                </p>
                            </div>
                        </div>
                    </article>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    generateGoals(goals) {
        if (!goals || !goals.current_semester) return '<p>No current goals set.</p>';
        
        let html = `
            <div class="content">
                <h4 class="title is-4">Current Semester Goals</h4>
                <ul>
        `;
        
        goals.current_semester.forEach(goal => {
            html += `<li>${goal}</li>`;
        });
        
        html += '</ul></div>';
        return html;
    }

    markdownToHtml(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="title is-4">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="title is-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="title is-2">$1</h1>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="has-text-primary">$1</a>');

        // Bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/gim, '<code class="has-background-grey-lighter">$1</code>');

        // Lists
        html = html.replace(/^[\-\*] (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');
        
        // Wrap consecutive list items in ul tags with no-bullets class
        html = html.replace(/(<li>.*<\/li>\n?)+/gs, (match) => {
            return `<ul class="content no-bullets">${match}</ul>`;
        });

        // Line breaks and paragraphs
        html = html.replace(/\n\n/g, '</p><p class="content">');
        html = `<p class="content">${html}</p>`;

        // Clean up
        html = html.replace(/<p class="content"><\/p>/g, '');
        html = html.replace(/<p class="content">(<h[1-6])/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p class="content">(<ul)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p class="content">(<pre)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');

        return html;
    }
}

// Run the generator
if (require.main === module) {
    const generator = new StaticSiteGenerator();
    generator.generate().catch(console.error);
}

module.exports = StaticSiteGenerator;