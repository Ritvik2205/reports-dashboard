from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from .models import Leads, User
from . import db, mongo
from flask_login import login_user, login_required, logout_user, current_user
from datetime import datetime

auth = Blueprint('auth', __name__)

def log_reports(report_name, active_table_names, active_table_columns, active_sorting_columns, active_search_columns, active_datetime_columns, report_start_date, report_end_date, table_relations):
    report = {
        "report_name" : report_name,
        "active_table_names" : active_table_names,
        "active_table_columns" : active_table_columns,
        "active_sorting_columns" : active_sorting_columns,
        "active_search_columns" : active_search_columns,
        "active_datetime_columns" : active_datetime_columns,
        "report_start_date" : report_start_date,
        "report_end_date" : report_end_date,
        "table_relations" : table_relations,
        "date_time_created": datetime.now()
    }
    mongo.db.reports.insert_one(report)


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()
        if user:
            if check_password_hash(user.password, password):
                flash('Logged in successfully!', category='success')
                login_user(user, remember=True)
                return redirect(url_for('views.home'))
            else:
                flash('Incorrect password, try again.', category='error')
        else:
            flash('Email does not exist.', category='error')

    return render_template("login.html", user=current_user)

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))


@auth.route("/signup", methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            print('Username and password are required.')
            return redirect(url_for('auth.signup'))

        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists.', category='error')
        else:
            new_user = User(username=username, password=generate_password_hash(password, method='pbkdf2:sha256'))
            db.session.add(new_user)
            db.session.commit()
            # login_user(new_user, remember=True)
            flash('Account created!', category='success')
            return redirect(url_for('auth.login'))
    else:
        return render_template("signup.html")