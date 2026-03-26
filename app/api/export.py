"""Export API - Excel and CSV generation."""

import os
import csv
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from app.db import get_db

bp = Blueprint('export', __name__)


@bp.route('/excel', methods=['POST'])
def export_excel():
    """Generate Excel export of register data."""
    try:
        import xlsxwriter
    except ImportError:
        return jsonify({'error': 'xlsxwriter not installed'}), 500

    db = get_db()
    data = request.get_json()
    date_from = data.get('date_from', datetime.now().strftime('%Y-%m-%d'))
    date_to = data.get('date_to', date_from)

    # Get test definitions
    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()

    # Get entries
    entries = db.execute('''SELECT * FROM lab_register
        WHERE reception_date BETWEEN ? AND ?
        ORDER BY lab_number ASC''', (date_from, date_to)).fetchall()

    # Build filename
    site = db.execute('SELECT site_code FROM site_config WHERE id = 1').fetchone()
    site_code = site['site_code'] if site else 'LAB'
    filename = f'{site_code}_Register_{date_from}_to_{date_to}.xlsx'
    filepath = os.path.join(current_app.config['DATA_DIR'], 'exports', filename)

    # Create workbook
    wb = xlsxwriter.Workbook(filepath)
    ws = wb.add_worksheet('Register')

    # Styles
    header_fmt = wb.add_format({'bold': True, 'bg_color': '#D7211E', 'font_color': 'white',
                                 'border': 1, 'text_wrap': True, 'valign': 'vcenter', 'font_name': 'Arial', 'font_size': 9})
    cell_fmt = wb.add_format({'border': 1, 'font_name': 'Arial', 'font_size': 9, 'valign': 'vcenter'})
    pos_fmt = wb.add_format({'border': 1, 'font_name': 'Arial', 'font_size': 9, 'font_color': '#D7211E', 'bold': True})

    # Headers
    fixed_headers = ['Lab #', 'Date', 'Time', 'Patient Name', 'Patient ID', 'Age', 'Sex', 'Ward']
    test_headers = [t['name_en'] for t in tests]
    right_headers = ['Report Date', 'Technician', 'Status', 'Remarks']
    all_headers = fixed_headers + test_headers + right_headers

    for col, h in enumerate(all_headers):
        ws.write(0, col, h, header_fmt)

    # Data rows
    for row_idx, entry in enumerate(entries, 1):
        results = db.execute('''SELECT lr.*, td.code FROM lab_result lr
            JOIN test_definition td ON lr.test_id = td.id
            WHERE lr.register_id = ?''', (entry['id'],)).fetchall()
        result_map = {r['code']: r for r in results}

        col = 0
        for val in [entry['lab_number'], entry['reception_date'], entry['reception_time'],
                     entry['patient_name'], entry['patient_id'],
                     f"{entry['age']}{entry['age_unit']}" if entry['age'] else '',
                     entry['sex'], entry['ward']]:
            ws.write(row_idx, col, val or '', cell_fmt)
            col += 1

        for test in tests:
            r = result_map.get(test['code'])
            val = r['result_value'] if r and r['result_value'] else ''
            fmt = pos_fmt if val and val.upper() in ('POS', 'POSITIVE', '+') else cell_fmt
            ws.write(row_idx, col, val, fmt)
            col += 1

        for val in [entry['reporting_date'], entry['technician_initials'],
                     entry['status'], entry['remarks']]:
            ws.write(row_idx, col, val or '', cell_fmt)
            col += 1

    # Auto-fit columns
    ws.set_column(0, 0, 16)   # Lab #
    ws.set_column(1, 1, 11)   # Date
    ws.set_column(2, 2, 6)    # Time
    ws.set_column(3, 3, 20)   # Patient Name
    ws.set_column(4, 4, 10)   # Patient ID
    ws.set_column(len(fixed_headers), len(fixed_headers) + len(test_headers) - 1, 8)  # Test columns

    ws.freeze_panes(1, 0)
    wb.close()

    return jsonify({'filename': filename, 'url': f'/api/export/download/{filename}'})


@bp.route('/csv', methods=['POST'])
def export_csv():
    """Generate CSV export."""
    db = get_db()
    data = request.get_json()
    date_from = data.get('date_from', datetime.now().strftime('%Y-%m-%d'))
    date_to = data.get('date_to', date_from)

    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()
    entries = db.execute('''SELECT * FROM lab_register
        WHERE reception_date BETWEEN ? AND ?
        ORDER BY lab_number ASC''', (date_from, date_to)).fetchall()

    site = db.execute('SELECT site_code FROM site_config WHERE id = 1').fetchone()
    site_code = site['site_code'] if site else 'LAB'
    filename = f'{site_code}_Register_{date_from}_to_{date_to}.csv'
    filepath = os.path.join(current_app.config['DATA_DIR'], 'exports', filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        headers = ['Lab #', 'Date', 'Time', 'Patient Name', 'Patient ID', 'Age', 'Sex', 'Ward']
        headers += [t['name_en'] for t in tests]
        headers += ['Report Date', 'Technician', 'Status', 'Remarks']
        writer.writerow(headers)

        for entry in entries:
            results = db.execute('''SELECT lr.*, td.code FROM lab_result lr
                JOIN test_definition td ON lr.test_id = td.id
                WHERE lr.register_id = ?''', (entry['id'],)).fetchall()
            result_map = {r['code']: r for r in results}

            row = [entry['lab_number'], entry['reception_date'], entry['reception_time'],
                   entry['patient_name'], entry['patient_id'],
                   f"{entry['age']}{entry['age_unit']}" if entry['age'] else '',
                   entry['sex'], entry['ward']]
            for test in tests:
                r = result_map.get(test['code'])
                row.append(r['result_value'] if r and r['result_value'] else '')
            row += [entry['reporting_date'], entry['technician_initials'],
                    entry['status'], entry['remarks']]
            writer.writerow(row)

    return jsonify({'filename': filename, 'url': f'/api/export/download/{filename}'})


@bp.route('/download/<filename>', methods=['GET'])
def download(filename):
    """Serve an export file for download."""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'exports', filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    return send_file(filepath, as_attachment=True)
