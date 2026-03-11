const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/controllers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // Simple robust replacements for specific known columns
    content = content.replace(/status\s*=\s*"([^"]+)"/g, "status = '$1'");
    content = content.replace(/status\s*!=\s*"([^"]+)"/g, "status != '$1'");
    content = content.replace(/status\s*IN\s*\("([^"]+)",\s*"([^"]+)"\)/g, "status IN ('$1', '$2')");
    content = content.replace(/status\s*IN\s*\("([^"]+)"\)/g, "status IN ('$1')");
    content = content.replace(/submission_type\s*=\s*"([^"]+)"/g, "submission_type = '$1'");
    content = content.replace(/role_id\s*=\s*4\s*AND\s*status\s*=\s*"([^"]+)"/g, "role_id = 4 AND status = '$1'");
    content = content.replace(/role_id\s*=\s*3\s*AND\s*status\s*=\s*"([^"]+)"/g, "role_id = 3 AND status = '$1'");
    content = content.replace(/AND\s*due_date\s*<\s*"([^"]+)"/g, "AND due_date < '$1'");
    content = content.replace(/LIKE\s*"([^"]+)"/g, "LIKE '$1'");
    
    // Add specific known combinations
    content = content.replace(/status\s*NOT\s*IN\s*\("([^"]+)"\)/g, "status NOT IN ('$1')");

    fs.writeFileSync(p, content, 'utf8');
    console.log(`Processed ${file}`);
}
console.log('Done replacing SQL ANSI_QUOTES!');
