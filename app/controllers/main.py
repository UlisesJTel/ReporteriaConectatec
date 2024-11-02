# app/controllers/main.py
from flask import Blueprint, jsonify, request, render_template
from app import db
from sqlalchemy import text
from .verify import *
from .auth import login_required
from .struct import *

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
@login_required
def index():
    tables = get_tables_db()
    return render_template('index.html',tables=tables)  




@main_bp.route('/get_columns', methods=['POST'])
@login_required
def get_columns():
    table_name = request.json.get('table_name')
    query = f"SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}'"
    result = db.session.execute(text(query))
    columns = [{'name': row[0], 'type': row[1]} for row in result]
    
    return jsonify(columns)



@main_bp.route('/get_catalog/<catalog_name>/<selected_table>',methods=['GET'])
@login_required
def get_catalog(catalog_name,selected_table):

    catalog_query_map = {
        'FK_PROVEEDOR': 'SELECT PK_PROVEEDOR,FL_NOMBRE_COMERCIAL FROM tb_dim_proveedores',
        'FK_ESTATUS': 'SELECT PK_ESTATUS,FL_NOMBRE FROM tb_dim_estatus WHERE 1=1',
        'FK_PERFIL': 'SELECT PK_PERFIL,FL_NOMBRE FROM tb_dim_perfiles',
        'FK_ENVIO': 'select PK_ENVIO,FL_TIPO_ENVIO from tb_dim_tipo_envios',
        'FK_ENTIDAD_ORI': 'select PK_ESTADO,FL_NOMBRE from tb_dim_estados',
        'FK_ENTIDAD_DES': 'select PK_ESTADO,FL_NOMBRE from tb_dim_estados',
        'FK_SUB_SERVICIO': 'SELECT PK_SUB_SERVICIO,FL_NOMBRE FROM tb_dim_sub_servicios',
        'FK_SUBSERVICIO': 'SELECT PK_SUB_SERVICIO,FL_NOMBRE FROM tb_dim_sub_servicios',
        'FK_SERVICIO': 'SELECT PK_SERVICIO,FL_NOMBRE FROM tb_dim_servicios',
        'FK_COBRO': 'SELECT PK_COBRO,FL_TIPO_COBRO FROM tb_dim_tipo_cobros',
        #'FK_MUNICIPIO_DES': 'SELECT PK_MUNICIPIO, FL_NOMBRE FROM tb_dim_municipios',
        #'FK_MUNICIPIO_ORI': 'SELECT PK_MUNICIPIO, FL_NOMBRE FROM tb_dim_municipios',
        'FK_ASISTENCIADORA': 'SELECT PK_ASISTENCIADORA,FL_NOMBRE FROM tb_dim_asistenciadora',
        'FK_CATEGORIA_EQUIPO': 'SELECT PK_CATEGORIA_EQUIPO,FL_NOMBRE FROM tb_dim_categoria_equipo',
        'FK_SUBCATEGORIA': 'SELECT PK_SUBCATEGORIA_EQUIPO,FL_NOMBRE FROM tb_dim_subcategoria_equipo',
        'FK_TIPO': 'SELECT PK_TIPO,FL_NOMBRE FROM tb_dim_tipo',
        'FK_ENTIDAD': 'SELECT PK_ESTADO,FL_NOMBRE FROM tb_dim_estados',
        'FK_CONCEPTO_SERVICIO': 'SELECT PK_CONCEPTO_LOG,FL_CONCEPTO FROM tb_dim_conceptos_log WHERE FL_TIPO = 5',
        'FL_MOTIVO_RECHAZO': 'SELECT PK_CONCEPTO_LOG,FL_CONCEPTO FROM tb_dim_conceptos_log WHERE FL_TIPO = 6',

        
    }

    query = catalog_query_map.get(catalog_name)
    
    if not query:
        return jsonify({'error':'Catálogo no encontrado'}), 404
    
    if catalog_name == 'FK_ESTATUS':
        if selected_table == 'tb_dim_equipo' or selected_table == 'tb_dim_proveedores' or selected_table == 'tb_dim_usuarios' or selected_table == 'tb_dim_asistenciadora':
            query += " AND FL_TIPO = 1"
        elif selected_table == 'tb_dim_sub_estatus' or selected_table == 'tb_fac_asistencias' or selected_table == 'tb_fac_asistencias_log':
            query += " AND FL_TIPO = 2"
        elif selected_table == 'tb_fac_convenios' or selected_table == 'tb_fac_convenios_log':
            query += " AND FL_TIPO = 3"
        elif selected_table == 'tb_dim_facturas':
            query += " AND FL_TIPO = 4"
        else:
            query += ""

        

    result = db.session.execute(text(query))
    
    
    catalog_items = [{'value':row[0],'label':row[1]} for row in result.fetchall()]

    
    return jsonify(catalog_items)


@main_bp.route('/generate_report', methods=['POST'])
@login_required
def generate_report():
    data = request.get_json()
    selected_table = data['table']
    selected_columns = data['columns']
    filters = data['filters']
    
    query = f"SELECT "

    # Mapeo de tablas de catálogo y alias
    catalog_query_map = {
        'FK_PROVEEDOR': ('tb_dim_proveedores', 'PK_PROVEEDOR', 'FL_NOMBRE_COMERCIAL'),
        'FK_ESTATUS': ('tb_dim_estatus', 'PK_ESTATUS', 'FL_NOMBRE'),
        'FK_PERFIL': ('tb_dim_perfiles','PK_PERFIL','FL_NOMBRE'),
        'FK_ENVIO': ('tb_dim_tipo_envios', 'PK_ENVIO', 'FL_TIPO_ENVIO'),
        'FK_ENTIDAD_ORI': ('tb_dim_estados','PK_ESTADO','FL_NOMBRE'),
        'FK_ENTIDAD_DES': ('tb_dim_estados','PK_ESTADO','FL_NOMBRE'),
        'FK_SUB_SERVICIO': ('tb_dim_sub_servicios','PK_SUB_SERVICIO','FL_NOMBRE'),
        'FK_SUBSERVICIO': ('tb_dim_sub_servicios','PK_SUB_SERVICIO','FL_NOMBRE'),
        'FK_SERVICIO': ('tb_dim_servicios','PK_SERVICIO','FL_NOMBRE'),
        'FK_COBRO': ('tb_dim_tipo_cobros','PK_COBRO', 'FL_TIPO_COBRO'),
        #'FK_MUNICIPIO_DES': ('tb_dim_municipios','PK_MUNICIPIO','FL_NOMBRE'),
        #'FK_MUNICIPIO_ORI': ('tb_dim_municipios','PK_MUNICIPIO','FL_NOMBRE'),
        'FK_ASISTENCIADORA': ('tb_dim_asistenciadora','PK_ASISTENCIADORA','FL_NOMBRE'),
        'FK_CATEGORIA_EQUIPO': ('tb_dim_categoria_equipo','PK_CATEGORIA_EQUIPO','FL_NOMBRE'),
        'FK_SUBCATEGORIA': ('tb_dim_subcategoria_equipo','PK_SUBCATEGORIA_EQUIPO','FL_NOMBRE'),
        'FK_TIPO': ('tb_dim_tipo','PK_TIPO','FL_NOMBRE'),
        'FK_ENTIDAD': ('tb_dim_estados','PK_ESTADO','FL_NOMBRE'),
        'FK_CONCEPTO_SERVICIO': ('tb_dim_conceptos_log','PK_CONCEPTO_LOG','FL_CONCEPTO'),
        'FL_MOTIVO_RECHAZO': ('tb_dim_conceptos_log','PK_CONCEPTO_LOG','FL_CONCEPTO'),


    }

    alias_letters = [chr(i) for i in range(ord('a'), ord('z') + 1)]  # Genera 'a' - 'z'
    alias_index = 0
    aliases = {}  # Guardará los alias generados para cada tabla
    joins = []  # Para almacenar los JOINs
    select_columns = []  # Columnas a incluir en el SELECT

    # Generar alias
    def get_next_alias():
        nonlocal alias_index
        if alias_index < len(alias_letters):
            alias = alias_letters[alias_index]
        else:
            # Generar alias doble (aa, ab, etc.) cuando se acaben las letras simples
            alias = alias_letters[alias_index // len(alias_letters) - 1] + alias_letters[alias_index % len(alias_letters)]
        alias_index += 1
        return alias

    # Construir columnas de SELECT y JOINs con alias
    for column in selected_columns:
        if column in catalog_query_map:  # Si la columna es una FK_, usar el JOIN para traer la etiqueta
            catalog_table, pk, label_column = catalog_query_map[column]
            alias = get_next_alias()
            aliases[catalog_table] = alias  # Guardar el alias de la tabla
            joins.append(f"LEFT JOIN {catalog_table} {alias} ON {selected_table}.{column} = {alias}.{pk}")
            select_columns.append(f"{alias}.{label_column} AS {column.replace('FK_','')}")  # Incluir etiqueta como `nombre_columna_label`
        else:
            select_columns.append(f"{selected_table}.{column}")

    # Unir todas las columnas en el SELECT
    query += ", ".join(select_columns) + f" FROM {selected_table} "

    # Agregar los JOINs necesarios
    if joins:
        query += " " + " ".join(joins)

    # Aplicar filtros
    query += " WHERE 1=1"
    for column, value in filters.items():
        if column in catalog_query_map: #se indica el left join del campo
            if isinstance(value, list): # es un array
                ids = ', '.join(map(str, value))
                query += f" AND {selected_table}.{column} IN ({ids})"
            else:
                query += f" AND {selected_table}.{column} = {value}"
        elif is_bigint_column(selected_table,column): #es un bigint pero no tiene left join
            if isinstance(value, list): 
                ids = ', '.join(map(str, value))
                query += f" AND {selected_table}.{column} IN ({ids})"
            else:
                query += f" AND {selected_table}.{column} = {value}"
        elif is_date_column(selected_table, column): #es una fecha
            query += f" AND CAST({column} AS DATE) BETWEEN '{value[0]}' AND '{value[1]}'"
        else: #es un texto
            query += f" AND {column} LIKE '%{value}%'"
    

    try:
        result = db.session.execute(text(query))
        data = result.fetchall()
        column_names = result.keys()
        return jsonify([{column: value for column, value in zip(column_names, row)} for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
