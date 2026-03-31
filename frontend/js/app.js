
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
    initMapControls();
});

async function initApp() {
    await populateFileList();
    
    const toggleBtn = document.getElementById('status-toggle-btn');
    const dropdown = document.getElementById('status-dropdown');
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== toggleBtn) {
            dropdown.classList.remove('show');
        }
    });

    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateToggleBtnText);
    });

    document.getElementById('visualize-btn').addEventListener('click', handleVisualize);
    
    // Initial UI state
    updateToggleBtnText();

    // Attempt an initial visualize if values are set
    if (document.getElementById('csv-select').value) {
        handleVisualize();
    }
}

function updateToggleBtnText() {
    const checkboxes = document.querySelectorAll('#status-dropdown input[type="checkbox"]');
    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const btn = document.getElementById('status-toggle-btn');
    
    if (selected.length === 0) {
        btn.textContent = "진행상태: 선택 없음";
    } else if (selected.length === checkboxes.length) {
        btn.textContent = "진행상태: 전체";
    } else {
        btn.textContent = `진행상태: ${selected[0]}${selected.length > 1 ? ' 외 ' + (selected.length - 1) : ''}`;
    }
}

async function populateFileList() {
    try {
        const response = await fetch('/api/files');
        if (!response.ok) throw new Error("Failed to fetch files");
        const files = await response.json();
        const select = document.getElementById('csv-select');
        
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file;
            select.appendChild(option);
        });
        
        if (files.length > 0) {
            select.value = files[0];
        }
    } catch (err) {
        console.error("Failed to load file list:", err);
    }
}

async function handleVisualize() {
    const fileName = document.getElementById('csv-select').value;
    const checkboxes = document.querySelectorAll('#status-dropdown input[type="checkbox"]');
    const selectedStatuses = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    
    if (selectedStatuses.length === 0) {
        alert("적어도 하나의 진행상태를 선택해주세요.");
        return;
    }

    const url = fileName ? `/api/cases?file_name=${fileName}` : '/api/cases';
    
    const btn = document.getElementById('visualize-btn');
    btn.textContent = "Loading...";
    btn.disabled = true;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errBody = await response.json();
            throw new Error(errBody.detail || "Server error");
        }
        
        const result = await response.json();
        allCases = result.data || [];
        
        updateVisualization(allCases, selectedStatuses);
    } catch (err) {
        console.error("Error fetching case data:", err);
        alert("Failed to load data: " + err.message);
    } finally {
        btn.textContent = "Visualize";
        btn.disabled = false;
    }
}

function updateVisualization(cases, selectedStatuses) {
    if (!cases || !Array.isArray(cases)) {
        console.error("Invalid cases data", cases);
        return;
    }

    // Filter cases by selected statuses
    const activeCases = cases.filter(c => {
        if (!c.status) return false;
        
        // Exact match or includes for status strings like "1심 진행중"
        return selectedStatuses.some(s => c.status.includes(s));
    });

    const stateStats = {};
    activeCases.forEach(c => {
        const state = extractState(c.court);
        if (state) {
            stateStats[state] = (stateStats[state] || []);
            stateStats[state].push(c);
        }
    });

    renderStats(activeCases.length, selectedStatuses);
    renderMap(stateStats);
    renderSidebar(activeCases);
}

function extractState(courtText) {
    if (!courtText) return null;
    const upper = courtText.toUpperCase();
    
    // Priority: Long names first to avoid 'MA' matching 'MAINE' early
    const sortedStates = Object.entries(STATE_ABBR).sort((a, b) => b[0].length - a[0].length);
    
    for (const [fullName, abbr] of sortedStates) {
        if (upper.includes(fullName) || upper.includes(` ${abbr} `) || upper.includes(`, ${abbr}`)) {
            return abbr;
        }
    }
    return null;
}

function renderStats(total, selectedStatuses) {
    const display = document.getElementById('status-display');
    const chipsContainer = document.getElementById('active-status-chips');
    
    document.querySelector('#status-display .total-count').textContent = `Total = ${total}`;
    
    chipsContainer.innerHTML = "";
    selectedStatuses.forEach(s => {
        const chip = document.createElement('span');
        chip.className = 'status-chip';
        chip.textContent = s;
        chipsContainer.appendChild(chip);
    });
}

function renderMap(stateStats) {
    const paths = document.querySelectorAll('.state-path');
    
    // Find max case count for intensity scale
    const counts = Object.values(stateStats).map(c => c.length);
    const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

    paths.forEach(path => {
        const stateAbbr = path.id; 
        const cases = stateStats[stateAbbr] || [];
        
        path.classList.remove('has-cases');
        path.style.removeProperty('--intensity');

        if (cases.length > 0) {
            path.classList.add('has-cases');
            path.setAttribute('data-count', cases.length);
            
            // Set heatmap intensity (0.4 to 1.0)
            const intensity = 0.4 + (0.6 * (cases.length / maxCount));
            path.style.setProperty('--intensity', intensity);
            
            path.onclick = () => {
                showStateCasesModal(stateAbbr, cases);
            };

            // Simple tooltip simulation
            path.onmouseover = (e) => showTooltip(e, `${stateAbbr}: ${cases.length} litigation(s)`);
            path.onmouseout = hideTooltip;
        } else {
            path.onclick = null;
            path.onmouseover = null;
            path.onmouseout = null;
        }
    });
}

function renderSidebar(cases) {
    const container = document.getElementById('case-list-sidebar');
    container.innerHTML = '<h3>Recent Cases</h3>';
    
    if (cases.length === 0) {
        container.innerHTML += '<p style="color: grey">No cases found for this period.</p>';
        return;
    }

    cases.slice(0, 50).forEach(c => {
        const div = document.createElement('div');
        div.className = 'case-item animate-in';
        div.innerHTML = `
            <div class="case-title">${c.case_name}</div>
            <div class="case-meta">${c.court} | ${c.file_date}</div>
        `;
        div.onclick = () => showCaseDetail(c);
        container.appendChild(div);
    });
}

function showStateCasesModal(state, cases) {
    const modal = document.getElementById('case-modal');
    const title = document.getElementById('modal-title');
    const list = document.getElementById('modal-case-list');

    title.textContent = `Copyright Litigation in ${state}`;
    list.innerHTML = "";
    
    cases.forEach(c => {
        const item = document.createElement('div');
        item.className = 'modal-item';
        item.innerHTML = `
            <strong>${c.case_name}</strong>
            <p>${c.court} | Status: ${c.status}</p>
        `;
        item.onclick = () => showCaseDetail(c);
        list.appendChild(item);
    });

    modal.style.display = 'flex';
}

function showCaseDetail(c) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');

    const firstUrl = c.url ? c.url.split(' ')[0] : '#';
    
    content.innerHTML = `
        <div class="detail-header">
            <h3>${c.case_name}</h3>
            <span class="status-badge">${c.status}</span>
        </div>
        <div class="detail-grid">
            <div class="field"><span>Filed</span><strong>${c.file_date}</strong></div>
            <div class="field"><span>Court</span><strong>${c.court}</strong></div>
            <div class="field"><span>Plaintiff</span><strong>${c.plaintiff}</strong></div>
            <div class="field"><span>Defendant</span><strong>${c.defendant}</strong></div>
        </div>
        <div class="detail-summary">
            <h4>Summary</h4>
            <p>${c.summary || "No summary available."}</p>
        </div>
        <div class="detail-actions">
            <a href="${firstUrl}" target="_blank" class="btn-primary">View Docket on CourtListener</a>
            <button onclick="document.getElementById('detail-modal').style.display='none'" class="btn-secondary">Close</button>
        </div>
    `;
    modal.style.display = 'flex';
}

// Close modals when clicking outside
window.onclick = (e) => {
    if (e.target.className === 'modal-overlay') {
        e.target.style.display = 'none';
    }
};

function showTooltip(e, text) {
    const tt = document.getElementById('tooltip');
    if (!tt) return;
    tt.textContent = text;
    tt.style.display = 'block';
    tt.style.left = (e.pageX + 10) + 'px';
    tt.style.top = (e.pageY + 10) + 'px';
}

function hideTooltip() {
    const tt = document.getElementById('tooltip');
    if (tt) tt.style.display = 'none';
}

// Map Zoom and Pan Logic
let currentScale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;

function initMapControls() {
    const viewport = document.getElementById('map-viewport');
    const wrapper = document.getElementById('map-svg-wrapper');
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomReset = document.getElementById('zoom-reset');

    if (!viewport || !wrapper) return;

    // Zoom Buttons
    zoomIn.onclick = () => updateTransform(0.2);
    zoomOut.onclick = () => updateTransform(-0.2);
    zoomReset.onclick = resetTransform;

    // Wheel Zoom
    viewport.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        updateTransform(delta);
    };

    // Panning
    viewport.onmousedown = (e) => {
        if (e.button !== 0) return; // Only left click
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        viewport.style.cursor = 'grabbing';
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    };

    window.onmouseup = () => {
        isDragging = false;
        viewport.style.cursor = 'grab';
    };
}

function updateTransform(delta) {
    const newScale = Math.min(Math.max(currentScale + delta, 0.5), 5);
    if (newScale !== currentScale) {
        currentScale = newScale;
        applyTransform();
    }
}

function resetTransform() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
}

function applyTransform() {
    const wrapper = document.getElementById('map-svg-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }
}
