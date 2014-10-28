# -*- coding: utf-8 -*-

from flask import Flask, redirect, request, url_for, render_template, session
from flask.ext.assets import Environment, Bundle
from urllib import urlencode
import requests
from werkzeug.contrib.cache import SimpleCache
import uuid
import json
import os


app = Flask(__name__)
assets = Environment(app)
app.debug = True
app.secret_key = os.getenv('SECRET_KEY', 'development')
cache = SimpleCache(default_timeout=60*60)


RK_CLIENT_ID = os.environ.get('RK_CLIENT_ID')
RK_CLIENT_SECRET = os.environ.get('RK_CLIENT_SECRET')
RK_REDIRECT_URI = 'http://localhost:5000/rkloggedin'

UT_CLIENT_ID = os.environ.get('UT_CLIENT_ID')
UT_CLIENT_SECRET = os.environ.get('UT_CLIENT_SECRET')
UT_REDIRECT_URI = 'http://localhost:5000/utloggedin'
UT_BASE_URL = 'https://api.untappd.com'

js_libs = Bundle(
    'jquery.min.js',
    'underscore-min.js',
    'moment.min.js',
    'moment-range.min.js',
    'd3.min.js',
    'nv.d3.min.js',
    filters='jsmin',
    output='gen/libs.js'
)
assets.register('js_libs', js_libs)


@app.route('/utauth')
def ut_auth():
    url = 'https://untappd.com/oauth/authenticate/'
    params = {
        'client_id': UT_CLIENT_ID,
        'response_type': 'code',
        'redirect_url': UT_REDIRECT_URI,
    }
    return redirect(url + '?' + urlencode(params), code=302)


@app.route('/runkeeperauth')
def rk_auth():
    url = 'https://runkeeper.com/apps/authorize'
    params = {
        'client_id': RK_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': RK_REDIRECT_URI
    }
    return redirect(url + '?' + urlencode(params), code=302)


@app.route('/rkloggedin')
def rk_logged_in():
    code = request.args.get('code')
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': RK_CLIENT_ID,
        'client_secret': RK_CLIENT_SECRET,
        'redirect_uri': RK_REDIRECT_URI,
    }
    r = requests.post('https://runkeeper.com/apps/token', data=data)
    session['rk_code'] = r.json()['access_token']
    return redirect(url_for('index'))


@app.route('/utloggedin')
def ut_logged_in():

    code = request.args.get('code')

    data = {
        'response_type': 'code',
        'code': code,
        'client_id': UT_CLIENT_ID,
        'client_secret': UT_CLIENT_SECRET,
        'redirect_url': UT_REDIRECT_URI,
    }
    r = requests.get(
        'https://untappd.com/oauth/authorize/?' + urlencode(data)
    )
    session['ut_code'] = r.json()['response']['access_token']
    return redirect(url_for('index'))


def get_uuid():
    if session.new or 'uuid' not in session:
        session['uuid'] = str(uuid.uuid4())
    return session['uuid']


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))


def get_from_cache(cache_id, function):
    # temp workaround since i reload a lot..
    filename = cache_id.split('_')[-1] + '.json'
    data = None
    if os.path.isfile(filename):
        with open(filename, 'r') as f:
            data = json.loads(f.read())
    else:
        data = function()
        with open(filename, 'w') as f2:
            f2.write(json.dumps(data))

    return data

    #this is using cache as it should
    '''
    data = cache.get(cache_id)
    if data is None:
        data = function()
        cache.set(cache_id, data)
    return data
    '''


def get_activities():

    headers = {
        'Authorization': 'Bearer ' + session['rk_code'],
        'Accept': 'application/vnd.com.runkeeper.FitnessActivityFeed+json'
    }
    print 'fill rk cache'
    return requests.get(
        'https://api.runkeeper.com/fitnessActivities',
        headers=headers
    ).json()


def get_cached_activities():
    cache_id = get_uuid() + '_rk'
    return get_from_cache(cache_id, get_activities)


def get_params(url):
    params = url.split('?')
    if len(params) > 1:
        split = [s.split('=') for s in params[-1].split('&')]
        return {d[0]: d[1] for d in split}
    return {}


def query_beers(max_id=None):
    params = (
        UT_BASE_URL,
        '/v4/user/checkins/',
        session['ut_code']
    )
    url = '%s%s?access_token=%s&limit=50' % params
    if max_id:
        url = url + '&max_id=%s' % max_id
    r = requests.get(url)
    return r.json(), r.headers['x-ratelimit-remaining']


def get_beers():
    data, remaining = query_beers()
    checkins = data["response"]["checkins"]["items"]
    next = data["response"]["pagination"]["next_url"]

    while next and len(checkins) < 500 and remaining > 0:
        max_id = get_params(next).get('max_id', None)
        if max_id:
            data, remanining = query_beers(max_id)
            print "rem %s" % remaining
            checkins += data["response"]["checkins"]["items"]
            next = data["response"]["pagination"]["next_url"]
    return checkins


def get_cached_beers():
    cache_id = get_uuid() + '_ut4'
    return get_from_cache(cache_id, get_beers)


@app.route('/')
def index():
    rk_auth = 'rk_code' in session
    ut_auth = 'ut_code' in session
    runs = None
    beers = None
    if rk_auth and ut_auth:
        runs = json.dumps(get_cached_activities()['items'])
        beers = json.dumps(get_cached_beers())
    return render_template(
        'index.html',
        runs=runs,
        beers=beers
    )

if __name__ == '__main__':
    app.run()
