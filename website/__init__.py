from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from os import getenv
from dotenv import load_dotenv
from flask_pymongo import PyMongo

load_dotenv()


MYSQL_DB_NAME = getenv("MYSQL_DB_NAME")
MYSQL_USERNAME = getenv("MYSQL_USERNAME")
MYSQL_PASSWORD = getenv("MYSQL_PASSWORD")
MYSQL_PORT = getenv("MYSQL_PORT")
MYSQL_HOST = getenv("MYSQL_HOST")

db = SQLAlchemy()
mongo = PyMongo()

table_names = []

def create_app():

    app = Flask(__name__)   
    app.debug = True
    app.config['SECRET_KEY'] = getenv('SECRET_KEY')

    app.config['SQLALCHEMY_DATABASE_URI'] = \
            f'mysql+pymysql://{MYSQL_USERNAME}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB_NAME}'
    
    app.config['MONGO_URI'] = 'mongodb://localhost:27017/tjReports'


    db.init_app(app)
    mongo.init_app(app)


    from .views import views
    from .auth import auth

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')


    from .models import Leads, User

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))

    with app.app_context():
        db.create_all()

        db.Model.metadata.reflect(db.engine)

    # Print all loaded tables
        for table_name in db.Model.metadata.tables:
            table_names.append(table_name)
            # print(f"Loaded table: {table_name}")


    return app