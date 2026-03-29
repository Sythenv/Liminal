/* Reports page logic */

document.addEventListener('DOMContentLoaded', () => {
    // Default to previous month
    const now = new Date();
    let month = now.getMonth(); // 0-indexed, so current month - 1
    let year = now.getFullYear();
    if (month === 0) { month = 12; year--; }

    // Populate month names using Intl (locale-aware)
    const select = document.getElementById('reportMonth');
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    select.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const opt = document.createElement('option');
        opt.value = i + 1;
        opt.textContent = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2026, i, 1));
        select.appendChild(opt);
    }

    select.value = month;
    document.getElementById('reportYear').value = year;

    document.getElementById('btnGenerateReport').addEventListener('click', generateReport);
});

function generateReport() {
    const month = parseInt(document.getElementById('reportMonth').value);
    const year = parseInt(document.getElementById('reportYear').value);

    document.getElementById('reportResult').style.display = 'none';
    document.getElementById('reportError').style.display = 'none';

    authFetch('/api/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: year, month: month })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) {
            document.getElementById('reportErrorText').textContent = data.error;
            document.getElementById('reportError').style.display = 'block';
            return;
        }

        const result = document.getElementById('reportResult');
        const link = document.getElementById('reportLink');
        const summary = document.getElementById('reportSummary');

        summary.textContent = `${data.period}: ${data.summary.total_samples} ${t('rpt_samples')}, ${data.summary.total_tests} ${t('rpt_tests')}, ${data.summary.rejection_rate}% ${t('rpt_rejection_rate')}`;
        link.href = data.url;
        link.textContent = data.filename;
        result.style.display = 'block';
    });
}
