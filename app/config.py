import os
"""
from dotenv import load_dotenv

load_dotenv()

username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
hostname = os.getenv('DB_HOST')
database = os.getenv('DB_NAME')


class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pymssql://{username}:{password}@{hostname}/{database}"
    )


    SQLALCHEMY_TRACK_MODIFICATIONS = False
"""


class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pymssql://{os.environ.get('USERNAME')}:{os.environ.get('PASSWORD')}"
        f"@{os.environ.get('HOST')}/{os.environ.get('DB_NAME')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

