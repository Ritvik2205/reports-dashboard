from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func


class Leads(db.Model):
    __tablename__ = 'Leads'
    lead_id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer)
    first_name = db.Column(db.String(150))
    last_name = db.Column(db.String(150))
    job_title = db.Column(db.String(150))
    company = db.Column(db.String(150))
    phone = db.Column(db.String(150))
    email = db.Column(db.String(150), unique=True)
    address = db.Column(db.String(200))
    country = db.Column(db.String(200))
    lead_status = db.Column(db.String(150))
    last_contact_date = db.Column(db.DateTime(timezone=True), default=func.now())
    lead_source = db.Column(db.String(150))


class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150))