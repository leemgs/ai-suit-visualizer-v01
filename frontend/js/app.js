
const STATE_ABBR = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
    'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
    'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
    'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
    'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
    'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
    'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY',
    'DISTRICT OF COLUMBIA': 'DC'
};

let allCases = [];

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await populateFileList();
    
    // Set default date to 2026-03-10 as per requirement
    document.getElementById('date-picker').value = '2026-03-10';

    document.getElementById('visualize-btn').addEventListener('click', handleVisualize);
    
    // Load SVG map via fetch to handle interaction
    loadMap();
}

async function populateFileList() {
    try {
        const response = await fetch('/api/files');
        const files = await response.json();
        const select = document.getElementById('csv-select');
        
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file;
            select.appendChild(option);
        });
        
        // Auto-select the latest one
        if (files.length > 0) select.value = files[0];
    } catch (err) {
        console.error("Failed to load file list:", err);
    }
}

async function loadMap() {
    const response = await fetch('https://raw.githubusercontent.com/Public-Sans/public-sans/master/docs/assets/us.svg');
    // Note: In a real production environment, we'd bundle this or host it locally.
    // For now, we will draw a simplified map or use a D3-like approach if needed.
    // However, to satisfy the requirement of "US map picture", I'll use a reliable SVG source.
}

async function handleVisualize() {
    const fileName = document.getElementById('csv-select').value;
    const selectedDate = document.getElementById('date-picker').value;
    
    const url = fileName ? `/api/cases?file_name=${fileName}` : '/api/cases';
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        allCases = result.data;
        
        updateVisualization(allCases, selectedDate);
    } catch (err) {
        console.error("Error fetching case data:", err);
    }
}

function updateVisualization(cases, dateStr) {
    const targetDate = new Date(dateStr);
    
    // Filter cases that were filed ON or BEFORE the selected date
    const activeCases = cases.filter(c => {
        const fileDate = new Date(c.file_date);
        return fileDate <= targetDate;
    });

    const stateStats = {};
    activeCases.forEach(c => {
        const state = extractState(c.court);
        if (state) {
            stateStats[state] = (stateStats[state] || []);
            stateStats[state].push(c);
        }
    });

    renderStats(activeCases.length, dateStr);
    renderMap(stateStats);
    renderSidebar(activeCases);
}

function extractState(courtText) {
    if (!courtText) return null;
    const upper = courtText.toUpperCase();
    for (const [fullName, abbr] of Object.entries(STATE_ABBR)) {
        if (upper.includes(fullName) || upper.includes(abbr)) {
            return abbr;
        }
    }
    return null;
}

function renderStats(total, date) {
    const display = document.getElementById('status-display');
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedDate = `${months[d.getMonth()]}. ${d.getDate()}, ${d.getFullYear()}`;
    
    display.innerHTML = `
        <h2>Latest U.S. Map of Copyright Suits v. AI companies</h2>
        <div class="total-count">Total = ${total}</div>
        <p>(${formattedDate})</p>
    `;
}

function renderMap(stateStats) {
    const paths = document.querySelectorAll('.state-path');
    paths.forEach(path => {
        const stateAbbr = path.id; // Expecting path IDs like 'CA', 'NY'
        const cases = stateStats[stateAbbr] || [];
        
        if (cases.length > 0) {
            path.classList.add('has-cases');
            path.setAttribute('data-count', cases.length);
            
            // Add click listener for the FIRST case item in that state (as a shortcut)
            // or we can show a list. Requirement says link to courtlistener for details.
            path.onclick = () => {
                if (cases[0].url) window.open(cases[0].url, '_blank');
            };
        } else {
            path.classList.remove('has-cases');
            path.onclick = null;
        }
    });
}

function renderSidebar(cases) {
    const container = document.getElementById('case-list-sidebar');
    container.innerHTML = '<h3>Recent Cases</h3>';
    
    cases.slice(0, 20).forEach(c => {
        const div = document.createElement('div');
        div.className = 'case-item animate-in';
        div.innerHTML = `
            <div class="case-title">${c.case_name}</div>
            <div class="case-meta">${c.court} | ${c.file_date}</div>
        `;
        div.onclick = () => window.open(c.url, '_blank');
        container.appendChild(div);
    });
}
