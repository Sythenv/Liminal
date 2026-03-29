"""Page routes - serve HTML templates."""

from flask import Blueprint, render_template, redirect, current_app

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
    return redirect('/reports')


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


@bp.route('/playbook')
def playbook():
    import os
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    return open(os.path.join(root, 'playbook.html')).read()


@bp.route('/playbook2')
def playbook2():
    import os
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    return open(os.path.join(root, 'playbook2.html')).read()


@bp.route('/settings')
def settings():
    return render_template('settings.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


