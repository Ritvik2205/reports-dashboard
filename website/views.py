from flask import Blueprint, render_template, jsonify, request, redirect, url_for, session
from sqlalchemy import Table, MetaData, select, DateTime, Date, and_
from . import db, mongo, table_names
from .models import Leads
from .auth import log_reports
from bson import ObjectId
from bson.json_util import dumps
from datetime import datetime

meta = MetaData()
views = Blueprint('views', __name__)


@views.route('/')
def home():
    last_five_reports =  mongo.db.reports.find().sort([('_id', -1)]).limit(5)    
    return render_template('index.html', last_five_reports=last_five_reports)


@views.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if request.method == 'GET':
        return render_template('dashboard.html', table_names=table_names)
    else:
        active_list_items =  request.get_json()['activeListItems']
        active_table_names =  request.get_json()['activeTableNames']
        report_name = request.get_json()['reportName']
        report_start_date = request.get_json()['reportStartDate']
        report_end_date = request.get_json()['reportEndDate']
        columns_for_sorting = request.get_json()['columnsForSorting']
        active_datetime_column = request.get_json()['activeDateTimeColumn']
        active_search_column = request.get_json()['activeSearchColumn']
        if active_datetime_column == "":
            report_start_date = ""
            report_end_date = ""
        log_reports(report_name, active_table_names, active_list_items,
                     columns_for_sorting, active_search_column, active_datetime_column,
                       report_start_date, report_end_date)        
        session['active_list_items'] = active_list_items
        session['active_table_names'] = active_table_names
        session['report_name'] = report_name
        session['report_start_date'] = report_start_date
        session['report_end_date'] = report_end_date
        session['columns_for_sorting'] = columns_for_sorting
        session['active_datetime_column'] = active_datetime_column
        session['active_search_column'] = active_search_column
        return redirect(url_for('views.report'))



@views.route('/get-columns/<table_name>')
def get_columns(table_name):
    if table_name != "undefined":    
        table = Table(table_name, meta, autoload_with=db.engine)
        columns = [column.name for column in table.columns]
        # print({'column_names': column_names})
        return jsonify(columns)
    else:
        return jsonify([])


@views.route('/report')
def report():
    report_name = session.get('report_name')
    report_start_date = session.get('report_start_date')
    report_end_date = session.get('report_end_date')
    active_list_items = session.get('active_list_items')
    active_table_names = session.get('active_table_names')
    columns_for_sorting = session.get('columns_for_sorting')
    active_datetime_column = session.get('active_datetime_column')
    active_search_column = session.get('active_search_column')

    if active_datetime_column == "":
            report_start_date = ""
            report_end_date = ""
    table_rows = []
    column_names = []
    for active_table in active_table_names:
        table = Table(active_table, meta, autoload_with=db.engine)

        try:
            datetime_column = table.c[active_datetime_column]
            # Create a select statement for the table
            stmt = select(table).where(
                and_(
                    datetime_column >= datetime.strptime(report_start_date, '%d-%m-%Y'),
                    datetime_column <= datetime.strptime(report_end_date, '%d-%m-%Y')                
                )
            )
        except KeyError:
            stmt = select(table)
        
        with db.engine.connect() as connection:
            result = connection.execute(stmt)
            table_rows += result.fetchall()

        # if active_list_items:
    column_names = active_list_items
        # else:
        #     column_names += [column.name for column in table.columns]
    lead_status_unique_values = []
    for lead in db.session.query(Leads.lead_status).distinct():
        lead_status_unique_values.append(lead.lead_status)
    return render_template('report.html', report_name=report_name, table_rows=table_rows, column_names=column_names, active_search_column=active_search_column, active_datetime_column=active_datetime_column, columns_for_sorting=columns_for_sorting, lead_status_unique_values=lead_status_unique_values)


@views.route('/report/<report_id>')
def load_report(report_id):
    report = mongo.db.reports.find_one({"_id": ObjectId(report_id)})
    report_name = report['report_name']
    active_list_items = report['active_list_items']
    active_table_names = report['active_table_names']
    active_search_column = report['active_search_column']
    columns_for_sorting = report['columns_for_sorting']
    active_datetime_column = report['active_datetime_column']

    if active_datetime_column == "":
            report_start_date = ""
            report_end_date = ""

    table_rows = []
    column_names = []
    for active_table in active_table_names:
        table = Table(active_table, meta, autoload_with=db.engine)

        try:
            datetime_column = table.c[active_datetime_column]
            # Create a select statement for the table
            stmt = select(table).where(
                and_(
                    datetime_column >= datetime.strptime(report_start_date, '%d-%m-%Y'),
                    datetime_column <= datetime.strptime(report_end_date, '%d-%m-%Y')                
                )
            )
        except KeyError:
            stmt = select(table)
        with db.engine.connect() as connection:
            result = connection.execute(stmt)
            table_rows += result.fetchall()


    column_names = active_list_items

    return render_template('report.html', report_name=report_name, table_rows=table_rows, column_names=column_names, active_search_column=active_search_column, active_datetime_column=active_datetime_column, columns_for_sorting=columns_for_sorting )    

@views.route('/datetime-columns', methods=['POST'])
def datetime_columns():
    active_table_columns =  request.get_json()['activeTableColumns']
    active_table_names = request.get_json()['activeTableNames']
    
    datetime_columns = {}
    for active_table in active_table_names:
        table = Table(active_table, meta, autoload_with=db.engine)

        datetime_columns[active_table] = [column.name for column in table.columns if column.name in active_table_columns[active_table] and (isinstance(column.type, Date) or isinstance(column.type, DateTime))]
    # datetime_columns = []
    # for column in table.columns:
    #     if column in active_list_items:
    #         datetime_columns += column.name if isinstance(table.columns[column].type, DateTime)

        
    return jsonify(datetime_columns)


@views.route('/get-report', methods=['POST'])
def get_report():
    report_id = request.get_json()['reportId']
    report = mongo.db.reports.find_one({"_id": ObjectId(report_id)})
    if report:
        report['_id'] = str(report['_id'])
        return jsonify(dumps(report))