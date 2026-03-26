/* Export page logic */

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = today.substring(0, 8) + '01';
    document.getElementById('exportFrom').value = firstOfMonth;
    document.getElementById('exportTo').value = today;
});

function exportData(format) {
    const dateFrom = document.getElementById('exportFrom').value;
    const dateTo = document.getElementById('exportTo').value;

    const url = format === 'excel' ? '/api/export/excel' : '/api/export/csv';

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_from: dateFrom, date_to: dateTo })
    })
    .then(r => r.json())
    .then(data => {
        if (data.url) {
            const result = document.getElementById('exportResult');
            const link = document.getElementById('exportLink');
            link.href = data.url;
            link.textContent = data.filename;
            result.style.display = 'block';
        }
    });
}
