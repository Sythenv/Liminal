"""Entry point for MSF Laboratory Registration System."""

from app import create_app

app = create_app()

if __name__ == '__main__':
    host = app.config.get('HOST', '127.0.0.1')
    port = app.config.get('PORT', 5000)

    try:
        from waitress import serve
        print(f'\n  MSF Lab Register running at http://{host}:{port}\n')
        serve(app, host=host, port=port)
    except ImportError:
        print(f'\n  MSF Lab Register running at http://{host}:{port} (dev mode)\n')
        app.run(host=host, port=port, debug=app.config.get('DEBUG', False))
