from flask import Blueprint, render_template, jsonify, request, redirect, url_for, session
from sqlalchemy import Table, MetaData, select
from . import db, table_names
from .models import Leads


meta = MetaData()
views = Blueprint('views', __name__)


@views.route('/')
def home():
    return render_template('index.html')


@views.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if request.method == 'GET':
        leads = Leads.query.all()
        table_name = str(Leads.__table__.name).capitalize()
        column_names = [column.name for column in Leads.__table__.columns]
        return render_template('dashboard.html', table_names=table_names, column_names=column_names)
    else:
        active_list_items =  request.get_json()['activeListItems']
        active_card_table_name =  request.get_json()['activeCardTableName']
        report_name = request.get_json()['reportName']
        report_start_date = request.get_json()['reportStartDate']
        report_end_date = request.get_json()['reportEndDate']
        session['active_list_items'] = active_list_items
        session['active_card_table_name'] = active_card_table_name
        session['report_name'] = report_name
        session['report_start_date'] = report_start_date
        session['report_end_date'] = report_end_date
        return redirect(url_for('views.leads'))



@views.route('/get-columns/<table_name>')
def get_columns(table_name):
    if table_name != "undefined":
        
        table = Table(table_name, meta, autoload_with=db.engine)
        columns = [column.name for column in table.columns]
        # print({'column_names': column_names})
        return jsonify(columns)
    else:
        return jsonify([])


@views.route('/leads')
def leads():
    report_name = session.get('report_name')
    report_start_date = session.get('report_start_date')
    report_end_date = session.get('report_end_date')
    active_list_items = session.get('active_list_items')
    active_card_table_name = session.get('active_card_table_name')
    table = Table(active_card_table_name, meta, autoload_with=db.engine)

    stmt = select(table)  # Create a select statement for the table
    with db.engine.connect() as connection:
        result = connection.execute(stmt)
        table_rows = result.fetchall()

    if active_list_items:
        column_names = active_list_items
    else:
        column_names = [column.name for column in table.columns]
    lead_status_unique_values = []
    for lead in db.session.query(Leads.lead_status).distinct():
        lead_status_unique_values.append(lead.lead_status)
    return render_template('leads.html', table_rows=table_rows, column_names=column_names, lead_status_unique_values=lead_status_unique_values)