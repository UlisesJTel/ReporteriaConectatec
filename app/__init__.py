from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.config import Config


db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.secret_key = '36gudbf37nei23l#sf2'
    app.config.from_object(Config)
    db.init_app(app)

    from app.controllers.main import main_bp
    from app.controllers.auth import auth_bp

    app.register_blueprint(main_bp, url_prefix='/')
    app.register_blueprint(auth_bp, url_prefix='/auth')  # Esto está bien

    return app


