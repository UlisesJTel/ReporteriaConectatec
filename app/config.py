import os
"""from dotenv import load_dotenv

load_dotenv()

username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
hostname = os.getenv('DB_HOST')
database = os.getenv('DB_NAME')


class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pyodbc://{username}:{password}@{hostname}/{database}?driver=SQL+Server"
    )


    SQLALCHEMY_TRACK_MODIFICATIONS = False

"""
class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pyodbc://{os.environ.get('USER')}:{os.environ.get('PASS')}"
        f"@{os.environ.get('HOST')}/{os.environ.get('DB_NAME')}?driver=SQL+Server"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
