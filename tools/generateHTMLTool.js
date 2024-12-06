function parseInput(input) {
    const lines = input.trim().split('\n');
    const result = {};
    const stack = [];

    for (const line of lines) {
        const trimmed = line.trim();

        const headingMatch = trimmed.match(/^(#+)(.+?): (.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const key = headingMatch[2].trim().toLowerCase().replace(/\s+/g, '');
            const content = headingMatch[3].trim();

            while (stack.length >= level) stack.pop();

            const parent = stack.length ? stack[stack.length - 1] : result;
            parent[key] = parent[key] || { content: content };
            stack.push(parent[key]);
            continue;
        }

        const listMatch = trimmed.match(/^\*\*(.+?)\*\*: (.+)$/);
        if (listMatch) {
            const key = listMatch[1].trim().toLowerCase();
            const values = listMatch[2].trim().split(',').map(item => item.trim());
            result[key] = values;
        }
    }

    return result;
}

function generateHTML(content) {
    let data = parseInput(content);
    let html = "";
    const dotsymbol = ['•', '◦', '‣']

    function traverse(node, level = 1) {
        if (node.content) {
            if(level == 1){
                html += `<div class="level${level}">${node.content}</div>\n`;
            } else {
                html += `<div class="level${level}">${dotsymbol[level-2]} ${node.content}</div>\n`;
            }
        }
        for (const key in node) {
            if (key !== "content" && typeof node[key] === "object") {
                traverse(node[key], level + 1);
            }
        }
    }

    for (const key in data) {
        if (["images", "tables", "pages", "sources"].includes(key)) {
            if (key === "images" || key === "tables") {
                data[key].forEach(url => {
                    html += `<img src="${url}" alt="Image" width="858px" height="348px"/></br>\n`;
                });
            } 
            else if (key === "pages") {
                html += `<p>${key.charAt(0).toUpperCase() + key.slice(1)}: ${data[key].join(", ")}</p>\n`;
            }
            else if (key === "sources") {
                data[key].forEach(url => {
                    html += `<a href="${url}" target="_blank">Tham khảo: ${url}</a>\n`;
                });
            }
        } else {
            traverse(data[key]);
        }
    }
    
    if (html.trim() === ""){
        return `<div class="level1">${content}</div>\n`
    }

    return html;
}

module.exports = {generateHTML};