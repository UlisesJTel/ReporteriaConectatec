from flask import Blueprint, request, session, redirect, url_for, render_template, flash, jsonify
from functools import wraps
from app import db
from sqlalchemy import text
import hashlib

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])  # Asegúrate de que esto esté en la línea correcta
def login():
    if request.method == 'POST':
        email = request.form["correo"]
        password = request.form["password"]

        sha1_password = hashlib.sha1(password.encode()).hexdigest()

        sql = text(
            """
            SELECT PK_USUARIO, FK_PERFIL, FL_CORREO 
            FROM tb_dim_usuarios
            WHERE FL_CORREO = :email
            AND FL_PASSWORD = :password
            """
        )

        result = db.session.execute(sql,{"email":email,"password":sha1_password}).fetchone()

        if result:
            id_user,perfil,correo = result

            print(f"Id usuario: {id_user}, perfil: {perfil}, email: {correo}")

            if perfil == 1:
                session['logged_in'] = True
                session['id_user'] = id_user
                flash('Inicio de sesión exitoso!', 'success')
                return redirect(url_for('main.index'))
            else:
                flash('No tienes permisos para acceder a esta página.', 'warning')
                return redirect(url_for('auth.login'))
        else:
            flash('Usuario o contraseña incorrectos', 'danger')
    return render_template('login.html')


@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('Haz cerrado sesión correctamente', 'info')
    return redirect(url_for('auth.login'))



def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            if request.is_json:
                return jsonify({"error":"Unauthorized access"}),401
            else:
                flash('Necesitas iniciar sesión para acceder a esta página', 'warning')
                return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function
