from flask import Blueprint, render_template, jsonify, request, redirect, url_for, session
from sqlalchemy import Table, MetaData, select, DateTime, Date, and_, join
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
        active_table_columns =  request.get_json()['activeTableColumns']
        active_table_names =  request.get_json()['activeTableNames']
        report_name = request.get_json()['reportName']
        report_start_date = request.get_json()['reportStartDate']
        report_end_date = request.get_json()['reportEndDate']
        active_sorting_columns = request.get_json()['activeSortingColumns']
        active_datetime_columns = request.get_json()['activeDateTimeColumns']
        active_search_columns = request.get_json()['activeSearchColumns']        
        table_relations = request.get_json()['tableRelations']        
        if active_datetime_columns == "":
            report_start_date = ""
            report_end_date = ""
        log_reports(report_name, active_table_names, active_table_columns,
                     active_sorting_columns, active_search_columns, active_datetime_columns,
                       report_start_date, report_end_date)        
        session['active_table_columns'] = active_table_columns
        session['active_table_names'] = active_table_names
        session['report_name'] = report_name
        session['report_start_date'] = report_start_date
        session['report_end_date'] = report_end_date
        session['active_sorting_columns'] = active_sorting_columns
        session['active_datetime_columns'] = active_datetime_columns
        session['active_search_columns'] = active_search_columns
        session['table_relations'] = table_relations
        return redirect(url_for('views.report'))



@views.route('/get-columns/<table_name>')
def get_columns(table_name):
    if table_name != "undefined":    
        table = Table(table_name, meta, autoload_with=db.engine)
        columns = [column.name for column in table.columns]
        return jsonify(columns)
    else:
        return jsonify([])


@views.route('/report')
def report():
    report_name = session.get('report_name') #
    report_start_date = session.get('report_start_date') #
    report_end_date = session.get('report_end_date') #
    active_table_columns = session.get('active_table_columns') #
    active_table_names = session.get('active_table_names')
    active_sorting_columns = session.get('active_sorting_columns')
    active_datetime_columns = session.get('active_datetime_columns') #
    active_search_columns = session.get('active_search_columns')
    table_relations = session.get('table_relations') #

    table_rows = []
    column_names = []

    if active_datetime_columns == "":
            report_start_date = ""
            report_end_date = ""

    join_chains = []
    join_columns = []
    used_tables = set()

    if table_relations != []:
        for relation in table_relations:
            table1 = Table(relation['table1'], meta, autoload_with=db.engine)
            table2 = Table(relation['table2'], meta, autoload_with=db.engine)
            used_tables.add(table1)
            used_tables.add(table2)
            
            chain1 = find_chain(join_chains, relation['table1'])
            chain2 = find_chain(join_chains, relation['table2'])

            if chain1 and chain2 and chain1 != chain2:
                new_chain = join(chain1, chain2, chain1.c[relation['column1']] == chain2.c[relation['column2']])            
                join_chains.remove(chain1)
                join_chains.remove(chain2)
                join_chains.append(new_chain)
            elif chain1 and not chain2:
                new_chain = join(chain1, table2, chain1.c[relation['column1']] == table2.c[relation['column2']])
                join_chains.remove(chain1)
                join_chains.append(new_chain)
            elif chain2 and not chain1:
                new_chain = join(table1, chain2, table1.c[relation['column1']] == chain2.c[relation['column2']])
                join_chains.remove(chain2)
                join_chains.append(new_chain)
            else:
                new_chain = join(table1, table2, table1.c[relation['column1']] == table2.c[relation['column2']])
                join_chains.append(new_chain)
            join_columns.append(f"{relation['table2']}.{relation['column2']}")
    
   

        for chain in join_chains:
            tables_in_chain = (get_joined_tables(chain))

            columns_to_select = []
            for table_name in tables_in_chain:
                if table_name in active_table_columns:
                    table = Table(table_name, meta, autoload_with=db.engine)
                    for column_name in active_table_columns[table_name]:
                        columns_to_select.append(table.c[column_name])
                        unique_column_name = f"{table_name}.{column_name}"
                        if unique_column_name not in join_columns:
                            column_names.append(unique_column_name)

            if columns_to_select:
                stmt = select(*columns_to_select).select_from(chain)

                for table_name in tables_in_chain:
                    if table_name in active_datetime_columns:
                        table = Table(table_name, meta, autoload_with=db.engine)
                        datetime_column = table.c[active_datetime_columns[table_name]]
                        if report_start_date != "" and report_end_date != "":
                            stmt = stmt.where(
                                and_(
                                    datetime_column >= datetime.strptime(report_start_date, '%d-%m-%Y'),
                                    datetime_column <= datetime.strptime(report_end_date, '%d-%m-%Y')                
                                )
                            )
                    
                with db.engine.connect() as connection:
                    result = connection.execute(stmt)
                    table_rows += result.fetchall()

    else:
        table_name = active_table_names[0]
        table = Table(table_name, meta, autoload_with=db.engine)
        columns_to_select = []
        for column_name in active_table_columns[table_name]:
            columns_to_select.append(table.c[column_name])
            column_names.append(f"{table_name}.{column_name}")
        
        if columns_to_select:
            stmt = select(*columns_to_select).select_from(table)
            if table_name in active_datetime_columns:
                datetime_column = table.c[active_datetime_columns[table_name]]
                stmt = select(*columns_to_select).where(
                    and_(
                        datetime_column >= datetime.strptime(report_start_date, '%d-%m-%Y'),
                        datetime_column <= datetime.strptime(report_end_date, '%d-%m-%Y')                
                    )
                )
            with db.engine.connect() as connection:
                result = connection.execute(stmt)
                table_rows += result.fetchall()

   

    if active_search_columns:    
        active_search_column = list(active_search_columns.values())[0][0]        
    else:
        active_search_column = None

    if active_datetime_columns:  
        active_datetime_column = list(active_datetime_columns.values())[0][0]
    else:
        active_datetime_column = None

    columns_for_sorting = []
    for column_list in list(active_sorting_columns.values()):
        columns_for_sorting += column_list

    lead_status_unique_values = []
    for lead in db.session.query(Leads.lead_status).distinct():
        lead_status_unique_values.append(lead.lead_status)
    return render_template('report.html', report_name=report_name, table_rows=table_rows, column_names=column_names, active_search_column=active_search_column, active_datetime_column=active_datetime_column, columns_for_sorting=columns_for_sorting, lead_status_unique_values=lead_status_unique_values)


def find_chain(join_chains, table):
    for chain in join_chains:
        joined_tables = get_joined_tables(chain)
        if table in joined_tables:
            return chain
    return None

def get_joined_tables(chain):
    tables = []

    def extract_tables(obj):
        if isinstance(obj, Table):
            tables.append(obj.name)
        elif hasattr(obj, 'left') and hasattr(obj, 'right'):
            extract_tables(obj.left)
            extract_tables(obj.right)

    extract_tables(chain)
    return tables

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