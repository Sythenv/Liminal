"""Page routes - serve HTML templates."""

from flask import Blueprint, render_template, current_app

bp = Blueprint('pages', __name__)


@bp.route('/register')
def register():
    return render_template('register.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/export')
def export():
    return render_template('export.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])


@bp.route('/settings')
def settings():
    return render_template('config.html',
                           site_name=current_app.config['SITE_NAME'],
                           lang=current_app.config['DEFAULT_LANGUAGE'])
