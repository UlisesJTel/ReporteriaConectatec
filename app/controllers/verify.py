from app import db
from sqlalchemy import text

# Para verificar su es bigint
def is_bigint_column(table_name,column_name):

    result = db.session.execute(text(f"SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}' AND COLUMN_NAME = '{column_name}'"))
    row = result.fetchone()
    return row and row[0].lower() == 'bigint'

# Para vefificar si es algun tipo de fecha
def is_date_column(table_name,column_name):
    flag = False
    result = db.session.execute(text(f"SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}' AND COLUMN_NAME = '{column_name}'"))
    row = result.fetchone()
    if row[0].lower() == 'date' or row[0].lower() == 'datetime' or row[0].lower() == 'datetime2':
        flag = True
    
    return flag
