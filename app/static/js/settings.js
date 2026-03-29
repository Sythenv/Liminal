/* Settings page — Backup & Restore */

document.addEventListener('DOMContentLoaded', function () {
    loadBackups();

    document.getElementById('btnBackupNow').addEventListener('click', createBackup);
    document.getElementById('btnRestore').addEventListener('click', restoreBackup);
});


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
