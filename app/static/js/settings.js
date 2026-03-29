/* Settings page — Backup, Restore & Print Config */

document.addEventListener('DOMContentLoaded', function () {
    loadBackups();
    loadPrintConfig();

    document.getElementById('btnBackupNow').addEventListener('click', createBackup);
    document.getElementById('btnRestore').addEventListener('click', restoreBackup);
    document.getElementById('btnSavePrint').addEventListener('click', savePrintConfig);

    // Label format button group
    document.querySelectorAll('.label-fmt-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.label-fmt-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
        });
    });

    // Toggle label options visibility
    document.getElementById('labelsEnabled').addEventListener('change', function () {
        document.getElementById('labelOptions').style.display = this.checked ? 'block' : 'none';
    });
});


// ===== PRINT CONFIG =====

function loadPrintConfig() {
    authFetch('/api/config').then(function (resp) {
        if (!resp) return;
        resp.json().then(function (data) {
            var pc;
            try { pc = JSON.parse(data.print_config || '{}'); } catch (e) { pc = {}; }
            var report = pc.report || {};
            var labels = pc.labels || {};

            // Report settings
            document.getElementById('printShowBarcode').checked = !!report.show_barcode;
            document.getElementById('printShowSignatures').checked = report.show_signatures !== false;
            document.getElementById('printFooterText').value = report.footer_text || '';

            // Label settings
            var enabled = !!labels.enabled;
            document.getElementById('labelsEnabled').checked = enabled;
            document.getElementById('labelOptions').style.display = enabled ? 'block' : 'none';

            // Format buttons
            var fmt = labels.format || 'avery_2x7';
            document.querySelectorAll('.label-fmt-btn').forEach(function (btn) {
                btn.classList.toggle('active', btn.dataset.value === fmt);
            });

            // Copies
            document.getElementById('labelCopies').value = labels.copies_per_specimen || 3;

            // Field checkboxes
            var fields = labels.fields || ['barcode', 'patient_name', 'specimen_type', 'collection_date'];
            document.querySelectorAll('.label-field-cb').forEach(function (cb) {
                cb.checked = fields.indexOf(cb.value) !== -1;
            });
        });
    });
}

function savePrintConfig() {
    // Gather report config
    var report = {
        show_barcode: document.getElementById('printShowBarcode').checked,
        show_signatures: document.getElementById('printShowSignatures').checked,
        footer_text: document.getElementById('printFooterText').value.trim()
    };

    // Gather label config
    var activeFormat = document.querySelector('.label-fmt-btn.active');
    var fields = [];
    document.querySelectorAll('.label-field-cb:checked').forEach(function (cb) {
        fields.push(cb.value);
    });
    var labels = {
        enabled: document.getElementById('labelsEnabled').checked,
        format: activeFormat ? activeFormat.dataset.value : 'avery_2x7',
        copies_per_specimen: parseInt(document.getElementById('labelCopies').value, 10) || 3,
        fields: fields
    };

    var printConfig = { report: report, labels: labels };

    authFetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ print_config: printConfig })
    }).then(function (resp) {
        if (!resp) return;
        resp.json().then(function (data) {
            var msg = document.getElementById('printSaveResult');
            if (data.ok) {
                msg.textContent = t('set_print_saved');
                msg.style.color = 'var(--sig-ok)';
            } else {
                msg.textContent = data.error || t('failed');
                msg.style.color = 'var(--sig-alert)';
            }
            setTimeout(function () { msg.textContent = ''; }, 3000);
        });
    });
}


// ===== BACKUP =====

function loadBackups() {
    authFetch('/api/backup').then(function (resp) {
        if (!resp) return;
        resp.json().then(function (data) {
            var list = document.getElementById('backupList');
            if (!data.backups || data.backups.length === 0) {
                list.innerHTML = '<em>' + t('set_no_backups') + '</em>';
                return;
            }
            var html = '<table style="width:100%; font-size:0.9rem"><thead><tr>' +
                '<th style="text-align:left">' + t('set_file') + '</th>' +
                '<th style="text-align:left">' + t('set_size') + '</th>' +
                '<th style="text-align:left">' + t('set_date') + '</th>' +
                '<th></th></tr></thead><tbody>';
            data.backups.forEach(function (b) {
                var sizeKB = (b.size / 1024).toFixed(1);
                var date = b.created ? b.created.substring(0, 16).replace('T', ' ') : '';
                html += '<tr>' +
                    '<td>' + b.filename + '</td>' +
                    '<td>' + sizeKB + ' KB</td>' +
                    '<td>' + date + '</td>' +
                    '<td><a href="/api/backup/' + encodeURIComponent(b.filename) + '" class="wiz-btn" style="font-size:0.8rem">' + t('download') + '</a></td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            list.innerHTML = html;
        });
    });
}


function createBackup() {
    authFetch('/api/backup', { method: 'POST' }).then(function (resp) {
        if (!resp) return;
        resp.json().then(function (data) {
            if (data.filename) {
                var msg = document.getElementById('backupMsg');
                msg.textContent = data.filename + ' (' + (data.size / 1024).toFixed(1) + ' KB)';
                var link = document.getElementById('backupDownloadLink');
                link.href = '/api/backup/' + encodeURIComponent(data.filename);
                document.getElementById('backupResult').style.display = 'block';
                loadBackups();
            }
        });
    });
}


function restoreBackup() {
    var fileInput = document.getElementById('restoreFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        showModal({ title: t('error'), message: t('set_select_db'), type: 'warning' });
        return;
    }

    showModal({
        title: t('set_restore_title'),
        message: t('set_restore_msg'),
        type: 'danger',
        actions: [
            { label: t('cancel'), cls: 'cancel' },
            { label: t('set_restore'), cls: 'danger', callback: function() { doRestore(fileInput.files[0]); } }
        ]
    });
}

function doRestore(file) {
    var formData = new FormData();
    formData.append('file', file);

    authFetch('/api/backup/restore', {
        method: 'POST',
        body: formData
    }).then(function (resp) {
        if (!resp) return;
        var resultDiv = document.getElementById('restoreResult');
        resp.json().then(function (data) {
            if (data.ok) {
                resultDiv.innerHTML = '<span style="color:var(--sig-ok)">' + data.message + '</span>';
            } else {
                resultDiv.innerHTML = '<span style="color:var(--sig-alert)">' + (data.error || t('set_restore_failed')) + '</span>';
            }
            resultDiv.style.display = 'block';
        });
    });
}
