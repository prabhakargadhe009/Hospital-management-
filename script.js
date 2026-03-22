/* ════════════════════════════════════════
   CityCare Hospital — script.js
   ════════════════════════════════════════ */

/* ── Departments ── */
const departments = [
    { name: 'General Medicine', fee: 300 },
    { name: 'Cardiology',       fee: 500 },
    { name: 'Orthopedics',      fee: 400 },
    { name: 'Pediatrics',       fee: 350 },
    { name: 'Gynecology',       fee: 450 }
];

/* ── Storage ── */
function getAppointments() { return JSON.parse(localStorage.getItem('appointments') || '[]'); }
function saveAppointments(a) { localStorage.setItem('appointments', JSON.stringify(a)); }

/* ── Helpers ── */
function genToken() {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    return L[Math.floor(Math.random() * L.length)] + String(Math.floor(Math.random() * 900) + 100);
}
function fmtDate(s) {
    return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtTime(s) {
    const [h, m] = s.split(':').map(Number);
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtDateTime(d, t) {
    const dt = new Date(d + 'T' + t);
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtNow() {
    return new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
function setActiveNav(id) {
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    document.getElementById('nav-home').addEventListener('click', e => { e.preventDefault(); loadHome(); });
    document.getElementById('nav-book').addEventListener('click', e => { e.preventDefault(); loadBookForm(); });
    document.getElementById('nav-appointments').addEventListener('click', e => { e.preventDefault(); loadAppointments(); });

    document.getElementById('print-overlay').addEventListener('click', function (e) {
        if (e.target === this) closePrint();
    });
});

/* ════════ HOME ════════ */
function loadHome() {
    setActiveNav('nav-home');
    document.getElementById('main-content').innerHTML = `
        <div class="card" style="max-width:640px;margin:auto;text-align:center;">
            <h2>Welcome to CityCare Hospital</h2>
            <p>Book appointments, view schedules, and manage patient visits easily.</p>
            <ul class="home-list">
                <li>Modern, responsive hospital management system</li>
                <li>Book appointments with doctors and departments</li>
                <li>Automatic fee calculation</li>
                <li>View, print, and delete appointments</li>
            </ul>
            <button class="btn-home" onclick="loadBookForm()">Book Appointment</button>
        </div>`;
}

/* ════════ BOOK FORM ════════ */
function loadBookForm() {
    setActiveNav('nav-book');
    document.getElementById('main-content').innerHTML = `
        <div class="card" style="max-width:560px;margin:auto;">
            <h2>Book Appointment</h2>
            <form id="appointmentForm" onsubmit="submitAppointment(event)">
                <label for="patient">Patient Name</label>
                <input type="text" id="patient" placeholder="Enter patient name" required>

                <label for="department">Department</label>
                <select id="department" onchange="showFee()" required>
                    <option value="">Select Department</option>
                    ${departments.map(d => `<option value="${d.name}" data-fee="${d.fee}">${d.name} (Fee: ₹${d.fee})</option>`).join('')}
                </select>

                <label for="date">Date</label>
                <input type="date" id="date" required>

                <label for="time">Time</label>
                <input type="time" id="time" required>

                <div id="feeDisplay"></div>
                <button type="submit">Book Appointment</button>
            </form>
            <div id="receipt-inline"></div>
        </div>`;
    document.getElementById('date').valueAsDate = new Date();
}

function showFee() {
    const sel = document.getElementById('department');
    const fee = sel.selectedOptions[0]?.getAttribute('data-fee');
    document.getElementById('feeDisplay').textContent = fee ? `Consultation Fee: ₹${fee}` : '';
}

function submitAppointment(e) {
    e.preventDefault();
    const patient    = document.getElementById('patient').value.trim();
    const deptSel    = document.getElementById('department');
    const department = deptSel.value;
    const fee        = deptSel.selectedOptions[0]?.getAttribute('data-fee') || '0';
    const date       = document.getElementById('date').value;
    const time       = document.getElementById('time').value;
    const inlineDiv  = document.getElementById('receipt-inline');

    if (!patient || !department || !date || !time) {
        inlineDiv.innerHTML = `<div class="receipt-error">⚠ Please fill all fields.</div>`; return;
    }
    const appts = getAppointments();
    if (appts.some(a => a.date === date && a.time === time && a.department === department)) {
        inlineDiv.innerHTML = `<div class="receipt-error">⚠ Time slot already booked for this department.</div>`; return;
    }

    const id    = Date.now();
    const token = genToken();
    const regno = 'REG' + id;
    const appt  = { id, token, patient, department, fee, date, time, regno };
    appts.push(appt);
    saveAppointments(appts);

    inlineDiv.innerHTML = `
        <div class="receipt-success">
            ✅ <strong>Appointment Booked!</strong><br>
            <strong>Token:</strong> ${token} &nbsp;|&nbsp; <strong>Reg No:</strong> ${regno}<br>
            <strong>Name:</strong> ${patient}<br>
            <strong>Department:</strong> ${department}<br>
            <strong>Date:</strong> ${fmtDate(date)}<br>
            <strong>Time:</strong> ${fmtTime(time)}<br>
            <strong>Fee:</strong> ₹${fee}
            <div class="btn-print-row">
                <button class="btn-teal" onclick="openPrint(${id})">🖨 Print Receipt</button>
                <button onclick="loadBookForm()">+ New Booking</button>
            </div>
        </div>`;

    document.getElementById('appointmentForm').reset();
    document.getElementById('feeDisplay').textContent = '';
}

/* ════════ APPOINTMENTS TABLE ════════ */
function loadAppointments() {
    setActiveNav('nav-appointments');
    const appts = getAppointments();
    document.getElementById('main-content').innerHTML = `
        <div class="card">
            <div class="appt-head">
                <h2>Booked Appointments</h2>
                <button onclick="loadBookForm()" style="padding:0.45em 1.1em;font-size:0.85em;">+ New</button>
            </div>
            ${appts.length === 0
                ? `<p style="text-align:center;color:#888;padding:2em 0;">No appointments booked yet.</p>`
                : `<div class="table-wrap"><table>
                    <thead><tr>
                        <th>Token</th><th>Patient</th><th>Department</th>
                        <th>Date &amp; Time</th><th>Fee</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                    ${appts.map(a => `
                        <tr>
                            <td><span class="token-badge">${a.token || '—'}</span></td>
                            <td>${a.patient}</td>
                            <td>${a.department}</td>
                            <td>${fmtDateTime(a.date, a.time)}</td>
                            <td>₹${a.fee}</td>
                            <td><div class="td-actions">
                                <button class="btn-small" onclick="openPrint(${a.id})">🖨 Receipt</button>
                                <button class="btn-red"   onclick="deleteAppointment(${a.id})">Delete</button>
                            </div></td>
                        </tr>`).join('')}
                    </tbody></table></div>`}
        </div>`;
}

function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return;
    saveAppointments(getAppointments().filter(a => a.id !== id));
    loadAppointments();
}

/* ════════ PRINT RECEIPT ════════ */
function openPrint(id) {
    const appt = getAppointments().find(a => a.id === id);
    if (!appt) return;

    document.getElementById('receipt-sheet').innerHTML = `
        <div class="rs-head">
            <div>
                <div class="rs-hosp-name">CityCare Hospital</div>
                <div class="rs-hosp-tag">Excellence in Healthcare</div>
                <div class="rs-hosp-addr">
                    12, Medical Park Road, Sector 7<br>
                    New Delhi – 110 001 &nbsp;|&nbsp; +91 11 2345 6789<br>
                    info@citycarehospital.in
                </div>
            </div>
            <div class="rs-right">
                <div class="rs-doc-type">Appointment Receipt</div>
                <div class="rs-token-lbl">Token Number</div>
                <div class="rs-token-val">${appt.token || '—'}</div>
                <div class="rs-issued">Issued: ${fmtNow()}</div>
            </div>
        </div>

        <div class="rs-confirmed">
            <div class="rs-dot"></div>
            APPOINTMENT CONFIRMED — Please carry this receipt to the hospital
        </div>

        <div class="rs-tf-bar">
            <div>
                <div class="rs-tf-lbl">Your Token Number</div>
                <div class="rs-token-big">${appt.token || '—'}</div>
            </div>
            <div>
                <div class="rs-tf-lbl" style="text-align:right;">Consultation Fee</div>
                <div class="rs-fee-big">₹ ${appt.fee}</div>
            </div>
        </div>

        <div class="rs-dt-row">
            <div class="rs-dt-cell">
                <div class="rs-dt-lbl">📅 Appointment Date</div>
                <div class="rs-dt-val">${fmtDate(appt.date)}</div>
            </div>
            <div class="rs-dt-cell">
                <div class="rs-dt-lbl">⏰ Appointment Time</div>
                <div class="rs-dt-val">${fmtTime(appt.time)}</div>
            </div>
        </div>

        <div class="rs-info-title">Patient &amp; Appointment Details</div>
        <div class="rs-info-grid">
            <div class="rs-ic"><div class="rs-ic-lbl">Patient Name</div><div class="rs-ic-val">${appt.patient}</div></div>
            <div class="rs-ic"><div class="rs-ic-lbl">Department</div><div class="rs-ic-val">${appt.department}</div></div>
            <div class="rs-ic"><div class="rs-ic-lbl">Registration No.</div><div class="rs-ic-val">${appt.regno || 'REG' + appt.id}</div></div>
            <div class="rs-ic"><div class="rs-ic-lbl">Fee</div><div class="rs-ic-val">₹ ${appt.fee}</div></div>
        </div>

        <div class="rs-instr">
            <div class="rs-instr-title">⚠ Patient Instructions</div>
            <ul>
                <li>Please arrive 15 minutes before your scheduled appointment time.</li>
                <li>Carry a valid photo ID (Aadhaar / Passport / Voter ID).</li>
                <li>Bring all previous medical records and prescriptions.</li>
                <li>This receipt is valid only for the date and time mentioned above.</li>
                <li>For rescheduling, contact the OPD counter at least 2 hours in advance.</li>
            </ul>
        </div>

        <div class="rs-foot">
            <div class="rs-foot-left">
                <strong>CityCare Hospital</strong><br>
                NABH Accredited &nbsp;|&nbsp; ISO 9001:2015<br>
                Helpline: 1800-XXX-XXXX (Toll Free)<br>
                www.citycarehospital.in
            </div>
            <div>
                <div class="rs-sig-line"></div>
                <div class="rs-sig-lbl">Authorised Signatory</div>
            </div>
        </div>`;

    document.getElementById('print-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closePrint() {
    document.getElementById('print-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

/* ════════ AI ASSISTANT ════════ */
const asstKnowledge = {
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    book:      ['book', 'appointment', 'schedule', 'reserve', 'make appointment'],
    dept:      ['department', 'departments', 'specialty', 'specialties', 'which doctor', 'which dept'],
    fees:      ['fee', 'fees', 'cost', 'price', 'charge', 'consultation', 'how much', 'payment'],
    receipt:   ['receipt', 'print', 'invoice', 'bill', 'token', 'download'],
    hours:     ['hours', 'timing', 'open', 'close', 'time', 'when', 'available'],
    cancel:    ['cancel', 'delete', 'remove', 'reschedule', 'change appointment'],
    contact:   ['contact', 'phone', 'address', 'location', 'helpline', 'email'],
    help:      ['help', 'support', 'guide', 'how', 'what can you', 'assist']
};

const asstReplies = {
    greetings: "👋 Hello! I'm CityCare Assistant. I can help you book appointments, find department info, check fees, and more. What do you need help with?",
    book:      "📅 **To book an appointment:**\n1. Click **Book Appointment** in the top menu\n2. Enter the patient name\n3. Select a department\n4. Choose a date & time\n5. Click **Book Appointment**\n\nA token number and receipt will be generated instantly!",
    dept:      "🏥 **Available Departments:**\n• General Medicine — ₹300\n• Cardiology — ₹500\n• Orthopedics — ₹400\n• Pediatrics — ₹350\n• Gynecology — ₹450\n\nSelect a department when booking to see the fee automatically.",
    fees:      "💰 **Consultation Fees:**\n• General Medicine — ₹300\n• Cardiology — ₹500\n• Orthopedics — ₹400\n• Pediatrics — ₹350\n• Gynecology — ₹450\n\nFees are shown automatically when you select a department.",
    receipt:   "🖨 **To print your receipt:**\n1. After booking, click **🖨 Print Receipt**\n2. Or go to **Appointments** tab, find your booking, and click the Receipt button\n3. A print preview will open — use **Print / Save as PDF**",
    hours:     "⏰ **Hospital Hours:**\nOPD: Mon–Sat, 8:00 AM – 8:00 PM\nEmergency: 24/7\nAppointments can be booked for any available time slot.",
    cancel:    "🗑 **To cancel an appointment:**\n1. Go to the **Appointments** tab\n2. Find your appointment in the list\n3. Click the **Delete** button\n\nFor rescheduling, please contact the OPD counter at least 2 hours in advance.",
    contact:   "📞 **Contact CityCare Hospital:**\n• Address: 12, Medical Park Road, Sector 7, New Delhi – 110 001\n• Phone: +91 11 2345 6789\n• Helpline: 1800-XXX-XXXX (Toll Free)\n• Email: info@citycarehospital.in",
    help:      "🤝 **I can help you with:**\n• Booking appointments\n• Department & fee information\n• Printing receipts\n• Cancelling appointments\n• Hospital hours & contact info\n\nJust type your question!",
    default:   "🤔 I'm not sure about that. Try asking about:\n• Booking an appointment\n• Departments & fees\n• Printing receipts\n• Hospital contact info\n\nOr visit the relevant section using the navigation menu above."
};

let asstOpen   = false;
let asstInited = false;

function toggleAssistant() {
    asstOpen = !asstOpen;
    document.getElementById('assistant-panel').classList.toggle('open', asstOpen);
    if (asstOpen && !asstInited) {
        asstInited = true;
        setTimeout(() => addBotMsg(asstReplies.greetings), 400);
    }
}

function addBotMsg(text) {
    const typing = document.createElement('div');
    typing.className = 'asst-typing show asst-msg bot';
    typing.innerHTML = `<div class="asst-msg-icon">🤖</div><div style="display:flex;gap:4px;padding:10px 13px;background:#fff;border-radius:14px 14px 14px 4px;box-shadow:0 1px 4px rgba(0,0,0,0.08)"><div class="asst-dot"></div><div class="asst-dot"></div><div class="asst-dot"></div></div>`;
    const msgs = document.getElementById('asst-messages');
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
        typing.remove();
        const el = document.createElement('div');
        el.className = 'asst-msg bot';
        el.innerHTML = `<div class="asst-msg-icon">🤖</div><div class="asst-bubble">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/•/g, '&bull;')}</div>`;
        msgs.appendChild(el);
        msgs.scrollTop = msgs.scrollHeight;
    }, 900);
}

function addUserMsg(text) {
    const msgs = document.getElementById('asst-messages');
    const el = document.createElement('div');
    el.className = 'asst-msg user';
    el.innerHTML = `<div class="asst-msg-icon">👤</div><div class="asst-bubble">${text}</div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
}

function getReply(text) {
    const t = text.toLowerCase();
    for (const [key, keywords] of Object.entries(asstKnowledge)) {
        if (keywords.some(k => t.includes(k))) return asstReplies[key];
    }
    return asstReplies.default;
}

function sendMessage() {
    const input = document.getElementById('asst-input');
    const text  = input.value.trim();
    if (!text) return;
    addUserMsg(text);
    input.value = '';
    addBotMsg(getReply(text));
}

function quickAsk(text) {
    if (!asstOpen) toggleAssistant();
    setTimeout(() => { addUserMsg(text); addBotMsg(getReply(text)); }, asstInited ? 0 : 500);
    asstInited = true;
}
