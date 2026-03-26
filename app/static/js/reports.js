/* Reports page logic */

document.addEventListener('DOMContentLoaded', () => {
    // Default to previous month
    const now = new Date();
    let month = now.getMonth(); // 0-indexed, so current month - 1
    let year = now.getFullYear();
    if (month === 0) { month = 12; year--; }

    document.getElementById('reportMonth').value = month;
    document.getElementById('reportYear').value = year;
});

function generateReport() {
    const month = parseInt(document.getElementById('reportMonth').value);
    const year = parseInt(document.getElementById('reportYear').value);

    document.getElementById('reportResult').style.display = 'none';
    document.getElementById('reportError').style.display = 'none';

    fetch('/api/reports/monthly', {
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

        summary.textContent = `${data.period}: ${data.summary.total_samples} samples, ${data.summary.total_tests} tests, ${data.summary.rejection_rate}% rejection rate`;
        link.href = data.url;
        link.textContent = data.filename;
        result.style.display = 'block';
    });
}
