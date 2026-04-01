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

const COUNTRY_MAP = {
    '미국': 'us',
    '한국': 'kr',
    '독일': 'de',
    '영국': 'gb',
    '프랑스': 'fr',
    '캐나다': 'ca',
    '일본': 'jp',
    '중국': 'cn',
    '대한민국': 'kr'
};

const COUNTRY_LABEL_OVERRIDE = {
    'kr': 'KO' // User requested KO for South Korea
};


let allCases = [];

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initMapControls();
    // Initialize labels after world map is loaded
    loadWorldMap().then(() => {
        setTimeout(initLabels, 100);
    });
});

async function loadWorldMap() {
    try {
        const response = await fetch('/image/world_map.svg');
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "image/svg+xml");
        const pathsGroup = xmlDoc.querySelector('g');
        const container = document.getElementById('world-paths');
        
        if (container && pathsGroup) {
            // Transfer paths and preserve IDs
            Array.from(pathsGroup.children).forEach(child => {
                const clone = child.cloneNode(true);
                // Standardize class for styling
                if (clone.tagName === 'path') {
                    clone.classList.add('state-path', 'country');
                } else if (clone.tagName === 'g') {
                    clone.querySelectorAll('path').forEach(p => p.classList.add('state-path', 'country'));
                }
                container.appendChild(clone);
            });
        }
    } catch (err) {
        console.error("Failed to load world map:", err);
    }
}


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
    document.getElementById('country-select').addEventListener('change', handleVisualize);
    
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

    const selectedCountry = document.getElementById('country-select').value;
    const stats = {};
    activeCases.forEach(c => {
        let loc = null;
        if (selectedCountry === 'USA') {
            loc = extractState(c.court);
        } else {
            loc = extractCountry(c.country);
        }

        if (loc) {
            stats[loc] = (stats[loc] || []);
            stats[loc].push(c);
        }
    });

    renderStats(activeCases.length, selectedStatuses);
    toggleMapDisplay(selectedCountry);
    renderMap(stats, selectedCountry);
    renderSidebar(activeCases);
}

function toggleMapDisplay(country) {
    const usMap = document.getElementById('us-map');
    const worldMap = document.getElementById('world-map');
    if (country === 'USA') {
        usMap.style.display = 'block';
        worldMap.style.display = 'none';
        resetTransform(); // Reset zoom when switching
    } else {
        usMap.style.display = 'none';
        worldMap.style.display = 'block';
        resetTransform();
    }
}

function extractCountry(countryText) {
    if (!countryText) return null;
    return COUNTRY_MAP[countryText] || null;
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
    
    document.querySelector('#status-display .total-count').textContent = total;
    
    chipsContainer.innerHTML = "";
    selectedStatuses.forEach(s => {
        const chip = document.createElement('span');
        chip.className = 'status-chip';
        chip.textContent = s;
        chipsContainer.appendChild(chip);
    });
}
function initLabels() {
    initUSLabels();
    initWorldLabels();
}

function initUSLabels() {
    const labelGroup = document.getElementById('state-labels');
    if (!labelGroup) return;
    labelGroup.innerHTML = '';
    
    const adjustments = {
        'FL': { dx: 2, dy: 1 }, 'MI': { dx: 1, dy: 2 }, 'LA': { dx: -1, dy: 0 },
        'CA': { dx: -1, dy: 0 }, 'AK': { dx: 0, dy: -2 }, 'HI': { dx: 0, dy: -2 },
        'NJ': { dx: 8, dy: 0 }, 'RI': { dx: 8, dy: 0 }, 'DE': { dx: 8, dy: 0 },
        'MD': { dx: 8, dy: 0 }, 'NH': { dx: 8, dy: 0 }, 'CT': { dx: 8, dy: 0 },
        'VT': { dx: 8, dy: 0 }, 'MA': { dx: 8, dy: 0 }, 'DC': { dx: 8, dy: 0 }
    };

    document.querySelectorAll('#us-map .state-path').forEach(path => {
        const id = path.id;
        if (!id || id.length !== 2) return;
        
        const bbox = path.getBBox();
        let x = bbox.x + bbox.width / 2;
        let y = bbox.y + bbox.height / 2;
        
        if (adjustments[id]) {
            x += adjustments[id].dx;
            y += adjustments[id].dy;
        }

        createLabel(labelGroup, x, y, id, 'state-label', id);
    });
}

function initWorldLabels() {
    const labelGroup = document.getElementById('world-labels');
    if (!labelGroup) return;
    labelGroup.innerHTML = '';

    document.querySelectorAll('#world-paths .state-path').forEach(el => {
        // Handle both <path id=".."> and <g id=".."><path>
        const id = el.id || el.parentElement.id;
        if (!id || id.length > 3) return; // Skip if no code or too long

        const bbox = el.getBBox();
        // Skip very tiny elements or hidden ones
        if (bbox.width < 1 || bbox.height < 1) return;

        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2;
        const displayCode = (COUNTRY_LABEL_OVERRIDE[id] || id).toUpperCase();

        createLabel(labelGroup, x, y, id, 'state-label world-label', displayCode);
    });
}

function createLabel(group, x, y, id, className, textContent) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', className);
    text.setAttribute('data-loc', id);
    text.textContent = textContent;
    group.appendChild(text);
}


function renderMap(stats, countryType) {
    const selector = countryType === 'USA' ? '#us-map .state-path' : '#world-map .state-path';
    const paths = document.querySelectorAll(selector);
    
    const counts = Object.values(stats).map(c => c.length);
    const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

    paths.forEach(el => {
        const id = el.id || el.parentElement.id;
        const cases = stats[id] || [];
        
        // Use el for the path styling, but handle g groups if necessary
        const pathEl = el.tagName === 'path' ? el : el.querySelector('path');
        if (!pathEl) return;

        pathEl.classList.remove('has-cases');
        pathEl.style.removeProperty('--intensity');

        const labelElem = document.querySelector(`.state-label[data-loc="${id}"]`);
        const baseDisplayCode = (COUNTRY_LABEL_OVERRIDE[id] || id).toUpperCase();

        if (cases.length > 0) {
            pathEl.classList.add('has-cases');
            pathEl.setAttribute('data-count', cases.length);
            const intensity = 0.4 + (0.6 * (cases.length / maxCount));
            pathEl.style.setProperty('--intensity', intensity);
            
            pathEl.onclick = () => showStateCasesModal(id, cases);
            pathEl.onmouseover = (e) => showTooltip(e, `${baseDisplayCode}: ${cases.length} litigation(s)`);
            pathEl.onmouseout = hideTooltip;

            if (labelElem) {
                labelElem.textContent = `${baseDisplayCode}(${cases.length})`;
                labelElem.classList.add('active-label');
            }
        } else {
            pathEl.onclick = null;
            pathEl.onmouseover = null;
            pathEl.onmouseout = null;
            if (labelElem) {
                labelElem.textContent = baseDisplayCode;
                labelElem.classList.remove('active-label');
            }
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
    const isPreparing = c.status && c.status.includes("준비");
    
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
            ${isPreparing ? `
                <div class="warning-box animate-in">
                    <span class="warning-icon">⚠️</span>
                    <span>Complaint document has not yet been uploaded to CourtListener.</span>
                </div>
            ` : `
                <a href="${firstUrl}" target="_blank" class="btn-primary">View Docket on CourtListener</a>
            `}
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
