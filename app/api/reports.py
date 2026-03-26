"""Monthly Lab Report API - PDF generation."""

import os
import calendar
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from fpdf import FPDF
from app.db import get_db

bp = Blueprint('reports', __name__)

# MSF branding
MSF_RED = (215, 33, 30)
WHITE = (255, 255, 255)
BLACK = (34, 34, 34)
GRAY = (136, 136, 136)
LIGHT_GRAY = (244, 244, 244)
GREEN = (39, 174, 96)


def _collect_data(db, date_from, date_to):
    """Run all report queries and return a dict."""
    data = {}

    # Total samples (excluding rejected)
    row = db.execute('''SELECT COUNT(*) as c FROM lab_register
        WHERE reception_date BETWEEN ? AND ? AND status != 'REJECTED' ''',
        (date_from, date_to)).fetchone()
    data['total_samples'] = row['c']

    # Total tests resulted
    row = db.execute('''SELECT COUNT(*) as c FROM lab_result lr
        JOIN lab_register reg ON lr.register_id = reg.id
        WHERE reg.reception_date BETWEEN ? AND ?
        AND reg.status != 'REJECTED' AND lr.result_status = 'RESULTED' ''',
        (date_from, date_to)).fetchone()
    data['total_tests'] = row['c']

    # Rejection count (for rate)
    row = db.execute('''SELECT COUNT(*) as c FROM lab_register
        WHERE reception_date BETWEEN ? AND ? AND status = 'REJECTED' ''',
        (date_from, date_to)).fetchone()
    total_registered = data['total_samples'] + row['c']
    data['rejection_rate'] = (row['c'] / total_registered * 100) if total_registered > 0 else 0
    data['rejected_count'] = row['c']

    # Volume by category + test
    rows = db.execute('''SELECT td.category, td.name_en, COUNT(*) as cnt
        FROM lab_result lr
        JOIN lab_register reg ON lr.register_id = reg.id
        JOIN test_definition td ON lr.test_id = td.id
        WHERE reg.reception_date BETWEEN ? AND ?
        AND reg.status != 'REJECTED' AND lr.result_status = 'RESULTED'
        GROUP BY td.category, td.name_en
        ORDER BY td.category, td.display_order''',
        (date_from, date_to)).fetchall()
    data['volume_by_test'] = [dict(r) for r in rows]

    # Positivity rates
    rows = db.execute('''SELECT td.name_en,
        COUNT(*) as total,
        SUM(CASE WHEN UPPER(lr.result_value) IN ('POS','POSITIVE','+') THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN UPPER(lr.result_value) IN ('NEG','NEGATIVE','-') THEN 1 ELSE 0 END) as negative
        FROM lab_result lr
        JOIN lab_register reg ON lr.register_id = reg.id
        JOIN test_definition td ON lr.test_id = td.id
        WHERE reg.reception_date BETWEEN ? AND ?
        AND reg.status != 'REJECTED'
        AND td.result_type = 'POSITIVE_NEGATIVE'
        AND lr.result_status = 'RESULTED'
        GROUP BY td.id, td.name_en
        ORDER BY td.display_order''',
        (date_from, date_to)).fetchall()
    data['positivity'] = [dict(r) for r in rows]

    # Volume by ward
    rows = db.execute('''SELECT COALESCE(ward, 'Unknown') as ward, COUNT(*) as cnt
        FROM lab_register
        WHERE reception_date BETWEEN ? AND ? AND status != 'REJECTED'
        GROUP BY ward ORDER BY cnt DESC''',
        (date_from, date_to)).fetchall()
    data['volume_by_ward'] = [dict(r) for r in rows]

    # Turnaround time
    row = db.execute('''SELECT AVG(julianday(reporting_date) - julianday(reception_date)) as avg_tat
        FROM lab_register
        WHERE reception_date BETWEEN ? AND ?
        AND status = 'COMPLETED' AND reporting_date IS NOT NULL''',
        (date_from, date_to)).fetchone()
    data['avg_tat_days'] = round(row['avg_tat'], 1) if row['avg_tat'] else None

    # Daily volume
    rows = db.execute('''SELECT reception_date, COUNT(*) as cnt
        FROM lab_register
        WHERE reception_date BETWEEN ? AND ? AND status != 'REJECTED'
        GROUP BY reception_date ORDER BY reception_date''',
        (date_from, date_to)).fetchall()
    data['daily_volume'] = [dict(r) for r in rows]

    return data


class LabReport(FPDF):
    """MSF-branded lab report PDF."""

    def __init__(self, site_name, period_label):
        super().__init__('P', 'mm', 'A4')
        self.site_name = site_name
        self.period_label = period_label
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        # Red bar
        self.set_fill_color(*MSF_RED)
        self.rect(0, 0, 210, 16, 'F')
        # MSF text
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(*WHITE)
        self.set_xy(10, 3)
        self.cell(20, 10, 'MSF', 0, 0)
        # Site name
        self.set_font('Helvetica', '', 10)
        self.cell(0, 10, f'  {self.site_name}', 0, 0)
        # Period on the right
        self.set_font('Helvetica', '', 9)
        self.set_xy(140, 3)
        self.cell(60, 10, self.period_label, 0, 0, 'R')
        self.ln(18)
        self.set_text_color(*BLACK)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*GRAY)
        self.cell(0, 10, f'MSF Laboratory Monthly Report - {self.site_name} - Page {self.page_no()}', 0, 0, 'C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(*MSF_RED)
        self.cell(0, 10, title, 0, 1)
        self.set_text_color(*BLACK)

    def draw_kpi_boxes(self, kpis):
        """Draw KPI boxes in a row. kpis = [(value, label), ...]"""
        box_w = (190 - (len(kpis) - 1) * 5) / len(kpis)
        start_x = 10
        y = self.get_y()

        for i, (value, label) in enumerate(kpis):
            x = start_x + i * (box_w + 5)
            # Box background
            self.set_fill_color(*LIGHT_GRAY)
            self.rect(x, y, box_w, 28, 'F')
            # Border left accent
            self.set_fill_color(*MSF_RED)
            self.rect(x, y, 2, 28, 'F')
            # Value
            self.set_font('Helvetica', 'B', 22)
            self.set_text_color(*BLACK)
            self.set_xy(x + 5, y + 2)
            self.cell(box_w - 10, 14, str(value), 0, 0, 'C')
            # Label
            self.set_font('Helvetica', '', 9)
            self.set_text_color(*GRAY)
            self.set_xy(x + 5, y + 16)
            self.cell(box_w - 10, 8, label, 0, 0, 'C')

        self.set_y(y + 35)
        self.set_text_color(*BLACK)

    def draw_table(self, headers, rows, col_widths=None):
        """Draw a table with MSF-styled headers."""
        if col_widths is None:
            col_widths = [190 / len(headers)] * len(headers)

        # Header
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(*MSF_RED)
        self.set_text_color(*WHITE)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 8, h, 1, 0, 'C', True)
        self.ln()
        self.set_text_color(*BLACK)

        # Rows
        self.set_font('Helvetica', '', 9)
        for r_idx, row in enumerate(rows):
            # Check page break
            if self.get_y() > 265:
                self.add_page()
                # Reprint headers
                self.set_font('Helvetica', 'B', 9)
                self.set_fill_color(*MSF_RED)
                self.set_text_color(*WHITE)
                for i, h in enumerate(headers):
                    self.cell(col_widths[i], 8, h, 1, 0, 'C', True)
                self.ln()
                self.set_text_color(*BLACK)
                self.set_font('Helvetica', '', 9)

            # Alternating background
            if r_idx % 2 == 1:
                self.set_fill_color(*LIGHT_GRAY)
                fill = True
            else:
                fill = False

            for i, val in enumerate(row):
                align = 'R' if i > 0 and isinstance(val, (int, float)) else 'L'
                self.cell(col_widths[i], 7, str(val), 1, 0, align, fill)
            self.ln()

    def draw_bar_chart(self, data, max_width=140):
        """Draw horizontal bar chart. data = [(label, value), ...]"""
        if not data:
            return
        max_val = max(v for _, v in data) if data else 1
        if max_val == 0:
            max_val = 1

        self.set_font('Helvetica', '', 8)
        bar_height = 6
        label_width = 40

        for label, value in data:
            # Check page break
            if self.get_y() > 270:
                self.add_page()

            y = self.get_y()
            # Label
            self.set_xy(10, y)
            self.set_text_color(*GRAY)
            self.cell(label_width, bar_height, str(label), 0, 0, 'R')
            # Bar
            bar_w = (value / max_val) * max_width if max_val > 0 else 0
            self.set_fill_color(*MSF_RED)
            self.rect(10 + label_width + 3, y + 1, bar_w, bar_height - 2, 'F')
            # Value
            self.set_text_color(*BLACK)
            self.set_xy(10 + label_width + bar_w + 5, y)
            self.cell(20, bar_height, str(value), 0, 0, 'L')
            self.ln(bar_height + 1)


def _build_pdf(data, site_name, period_label, filepath):
    """Build the monthly report PDF."""
    pdf = LabReport(site_name, period_label)
    pdf.add_page()

    # Title
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 12, 'Monthly Laboratory Report', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*GRAY)
    pdf.cell(0, 6, f'Generated on {datetime.now().strftime("%Y-%m-%d %H:%M")}', 0, 1, 'C')
    pdf.set_text_color(*BLACK)
    pdf.ln(5)

    # KPIs
    rejection_str = f"{data['rejection_rate']:.1f}%"
    pdf.draw_kpi_boxes([
        (data['total_samples'], 'Total Samples'),
        (data['total_tests'], 'Tests Performed'),
        (rejection_str, 'Rejection Rate'),
    ])

    # Volume by test category
    pdf.section_title('Test Volume by Category')
    if data['volume_by_test']:
        total = sum(r['cnt'] for r in data['volume_by_test'])
        rows = []
        for r in data['volume_by_test']:
            pct = f"{r['cnt'] / total * 100:.1f}%" if total > 0 else "0%"
            rows.append([r['category'], r['name_en'], r['cnt'], pct])
        pdf.draw_table(
            ['Category', 'Test', 'Count', '% of Total'],
            rows,
            [40, 70, 40, 40]
        )
    else:
        pdf.set_font('Helvetica', 'I', 10)
        pdf.cell(0, 10, 'No test data for this period', 0, 1)
    pdf.ln(5)

    # Positivity rates
    pdf.section_title('Positivity Rates')
    if data['positivity']:
        rows = []
        for r in data['positivity']:
            rate = f"{r['positive'] / r['total'] * 100:.1f}%" if r['total'] > 0 else "0%"
            rows.append([r['name_en'], r['total'], r['positive'], r['negative'], rate])
        pdf.draw_table(
            ['Test', 'Tested', 'Positive', 'Negative', 'Rate'],
            rows,
            [55, 30, 30, 30, 30]
        )
    else:
        pdf.set_font('Helvetica', 'I', 10)
        pdf.cell(0, 10, 'No positivity data for this period', 0, 1)
    pdf.ln(5)

    # Volume by ward
    pdf.section_title('Samples by Ward')
    if data['volume_by_ward']:
        total = data['total_samples']
        rows = []
        for r in data['volume_by_ward']:
            pct = f"{r['cnt'] / total * 100:.1f}%" if total > 0 else "0%"
            rows.append([r['ward'], r['cnt'], pct])
        pdf.draw_table(
            ['Ward', 'Samples', '% of Total'],
            rows,
            [80, 50, 50]
        )
    pdf.ln(5)

    # Turnaround time
    pdf.section_title('Turnaround Time')
    if data['avg_tat_days'] is not None:
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 10, f"{data['avg_tat_days']} days", 0, 1)
        pdf.set_font('Helvetica', '', 9)
        pdf.set_text_color(*GRAY)
        pdf.cell(0, 5, 'Average time from sample reception to result reporting', 0, 1)
        pdf.set_text_color(*BLACK)
    else:
        pdf.set_font('Helvetica', 'I', 10)
        pdf.cell(0, 10, 'No completed samples with reporting date for this period', 0, 1)
    pdf.ln(5)

    # Daily activity chart
    if data['daily_volume']:
        pdf.section_title('Daily Activity')
        chart_data = [(r['reception_date'][5:], r['cnt']) for r in data['daily_volume']]
        pdf.draw_bar_chart(chart_data)

    pdf.output(filepath)


@bp.route('/monthly', methods=['POST'])
def monthly_report():
    """Generate a monthly lab report PDF."""
    db = get_db()
    req = request.get_json()

    year = req.get('year', datetime.now().year)
    month = req.get('month', datetime.now().month)

    try:
        year = int(year)
        month = int(month)
        if month < 1 or month > 12:
            return jsonify({'error': 'Invalid month'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid year or month'}), 400

    _, last_day = calendar.monthrange(year, month)
    date_from = f'{year:04d}-{month:02d}-01'
    date_to = f'{year:04d}-{month:02d}-{last_day:02d}'

    # Get site info
    site = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    site_name = site['site_name'] if site else 'MSF Laboratory'
    site_code = site['site_code'] if site else 'LAB'

    # Collect data
    data = _collect_data(db, date_from, date_to)

    # Build PDF
    month_name = calendar.month_name[month]
    period_label = f'{month_name} {year}'
    filename = f'{site_code}_MonthlyReport_{year:04d}-{month:02d}.pdf'
    filepath = os.path.join(current_app.config['DATA_DIR'], 'exports', filename)

    _build_pdf(data, site_name, period_label, filepath)

    return jsonify({
        'filename': filename,
        'url': f'/api/export/download/{filename}',
        'period': period_label,
        'summary': {
            'total_samples': data['total_samples'],
            'total_tests': data['total_tests'],
            'rejection_rate': round(data['rejection_rate'], 1),
        }
    })
