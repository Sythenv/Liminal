"""Page routes - serve HTML templates."""

from flask import Blueprint, render_template, current_app

bp = Blueprint('pages', __name__)


@bp.route('/register')
def register():
    return render_template('register.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/reports')
def reports():
    return render_template('reports.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/export')
def export():
    return render_template('export.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/patients')
def patients():
    return render_template('patients.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/bloodbank')
def bloodbank():
    return render_template('bloodbank.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/equipment')
def equipment():
    return render_template('equipment.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


