import sys, json, io, os
import pandas as pd
import numpy as np

print('=' * 60)
print('ForgeAI Backend — Full Test Suite')
print('=' * 60)

PASS = 0
FAIL = 0

def ok(name):
    global PASS
    PASS += 1
    print(f'  [PASS] {name}')

def fail(name, err):
    global FAIL
    FAIL += 1
    print(f'  [FAIL] {name}: {err}')

# ── helpers ──────────────────────────────────────────────────
def make_messy_df():
    return pd.DataFrame({
        'CustomerID': ['C001','C002','C003','C004','C004','C005'],
        'Age':        [34, None, 45, 29, 29, 34],
        'Gender':     ['Male','Female',None,'Male','Male','Male'],
        'Income':     [52000, 71000, None, 38000, 38000, 52000],
        'Churn':      [0, 1, 0, 1, 1, 0],
    })

print()
print('─── 1. Profiler ────────────────────────────────────────')

from profiler import profile_dataset, compute_health_score, classify_dtype, count_iqr_outliers

df = make_messy_df()
try:
    profile = profile_dataset(df, 'test.csv')
    assert profile['rows'] == 6,          f'rows={profile["rows"]}'
    assert profile['columns'] == 5,       f'cols={profile["columns"]}'
    assert profile['duplicates'] == 1,    f'dups={profile["duplicates"]}'
    assert profile['missing_cells'] > 0,  'no missing cells'
    assert profile['health_score'] > 0,   'health=0'
    assert profile['possible_target'] == 'Churn', f'target={profile["possible_target"]}'
    assert profile['possible_task'] == 'classification'
    assert len(profile['column_profiles']) == 5
    ok('profile_dataset() returns correct shape')
    ok(f'health_score={profile["health_score"]} (penalised for missing/dup)')
    ok(f'target_column={profile["possible_target"]} detected')
    ok(f'task={profile["possible_task"]} inferred')
except AssertionError as e:
    fail('profile_dataset', e)
except Exception as e:
    fail('profile_dataset CRASH', e)

# classify_dtype
try:
    assert classify_dtype(pd.Series([1.0, 2.0])) == 'numeric'
    assert classify_dtype(pd.Series(['a','b'])) == 'categorical'
    assert classify_dtype(pd.Series([True, False])) == 'boolean'
    ok('classify_dtype() all branches')
except Exception as e:
    fail('classify_dtype', e)

# count_iqr_outliers
try:
    s = pd.Series(list(range(100)) + [9999, -9999])
    n = count_iqr_outliers(s)
    assert n >= 2, f'expected >=2, got {n}'
    ok(f'count_iqr_outliers() detected {n} outliers')
except Exception as e:
    fail('count_iqr_outliers', e)

# health score improves after cleaning
try:
    df_clean = df.dropna().drop_duplicates()
    h_before = compute_health_score(df)
    h_after = compute_health_score(df_clean)
    assert h_after >= h_before, f'{h_after} < {h_before}'
    ok(f'health_score improves after clean: {h_before} -> {h_after}')
except Exception as e:
    fail('health_score improvement', e)

print()
print('─── 2. Execution Engine ────────────────────────────────')

from prepocessing import execute_plan

df = make_messy_df()
actions_all = [
    {'id':1,'column':'CustomerID','action':'Drop column','type':'drop','reason':'Identifier','category':'Identifier Removal','confidence':99},
    {'id':2,'column':'Dataset','action':'Remove duplicates','type':'dedup','reason':'Dups','category':'Data Quality','confidence':99},
    {'id':3,'column':'Age','action':'Median imputation','type':'impute','reason':'Missing vals','category':'Missing Value Handling','confidence':89},
    {'id':4,'column':'Income','action':'Median imputation','type':'impute','reason':'Missing','category':'Missing Value Handling','confidence':89},
    {'id':5,'column':'Gender','action':'Mode imputation','type':'impute','reason':'Categorical missing','category':'Missing Value Handling','confidence':80},
    {'id':6,'column':'Gender','action':'One-hot encoding (drop_first=True)','type':'encode','reason':'Nominal','category':'Categorical Encoding','confidence':91},
]

try:
    df_clean, log = execute_plan(df.copy(), actions_all)
    # dedup runs first regardless of input order
    assert len(df_clean) == 5, f'expected 5 rows (1 dup removed), got {len(df_clean)}'
    ok(f'dedup runs first: {len(df)} -> {len(df_clean)} rows')
except Exception as e:
    fail('execute_plan dedup-first', e)

try:
    assert 'CustomerID' not in df_clean.columns
    ok('drop handler removes column')
except Exception as e:
    fail('drop handler', e)

try:
    assert df_clean['Age'].isnull().sum() == 0
    assert df_clean['Income'].isnull().sum() == 0
    ok('impute handler fills all nulls')
except Exception as e:
    fail('impute handler', e)

try:
    assert 'Gender' not in df_clean.columns  # was one-hot encoded (dropped)
    ok('one-hot encode handler works (Gender dropped, dummies added)')
except Exception as e:
    fail('one-hot encode', e)

try:
    assert all(e['status'] == 'success' for e in log), [e['status'] for e in log]
    ok(f'all {len(log)} log entries status=success')
except Exception as e:
    fail('decision log statuses', e)

# Test log transform
try:
    df2 = pd.DataFrame({'x': [1, 4, 9, 16, 100, 10000]})
    df2_t, _ = execute_plan(df2, [{'column':'x','action':'Log transform','type':'transform','reason':'','category':'','confidence':90}])
    assert (df2_t['x'] < df2['x']).all(), 'log transform did not reduce values'
    ok('log transform handler reduces skewed values')
except Exception as e:
    fail('log transform handler', e)

# Test outlier winsorization
try:
    df3 = pd.DataFrame({'income': list(range(100)) + [999999, -999999]})
    df3_w, _ = execute_plan(df3, [{'column':'income','action':'IQR winsorization','type':'outlier','reason':'','category':'','confidence':90}])
    assert df3_w['income'].max() < 999999
    assert df3_w['income'].min() > -999999
    ok('outlier winsorization caps extreme values')
except Exception as e:
    fail('outlier handler', e)

# Test scale
try:
    df4 = pd.DataFrame({'val': [1.0, 2.0, 3.0, 4.0, 5.0]})
    df4_s, _ = execute_plan(df4, [{'column':'val','action':'StandardScaler','type':'scale','reason':'','category':'','confidence':80}])
    assert abs(df4_s['val'].mean()) < 0.01, f'mean not near 0: {df4_s["val"].mean()}'
    ok('scale handler zero-means column')
except Exception as e:
    fail('scale handler', e)

print()
print('─── 3. Session Store ───────────────────────────────────')

from session_store import create_session, save_df, load_df, save_json, load_json, save_text, load_text, session_exists

try:
    sid = create_session('test_dataset.csv')
    assert len(sid) == 8
    assert session_exists(sid)
    ok(f'create_session() -> {sid}')
except Exception as e:
    fail('create_session', e)

try:
    df_t = pd.DataFrame({'a':[1,2],'b':['x','y']})
    save_df(sid, df_t, 'test')
    df_loaded = load_df(sid, 'test')
    assert list(df_loaded.columns) == ['a','b']
    assert len(df_loaded) == 2
    ok('save_df / load_df round-trip')
except Exception as e:
    fail('df round-trip', e)

try:
    data = {'key': 'value', 'score': 42}
    save_json(sid, data, 'test')
    loaded = load_json(sid, 'test')
    assert loaded == data
    ok('save_json / load_json round-trip')
except Exception as e:
    fail('json round-trip', e)

try:
    save_text(sid, 'hello world', 'test.txt')
    txt = load_text(sid, 'test.txt')
    assert txt == 'hello world'
    ok('save_text / load_text round-trip')
except Exception as e:
    fail('text round-trip', e)

print()
print('─── 4. Pipeline Generator ──────────────────────────────')

from pipeline_generator import generate_pipeline_code

actions = [
    {'id':1,'column':'CustomerID','action':'Drop column','type':'drop','reason':'ID column','category':'Identifier Removal','confidence':99},
    {'id':2,'column':'Dataset','action':'Remove duplicates','type':'dedup','reason':'Dups','category':'Data Quality','confidence':99},
    {'id':3,'column':'Age','action':'Median imputation','type':'impute','reason':'14% missing','category':'Missing Value Handling','confidence':89},
    {'id':4,'column':'Income','action':'Log transform','type':'transform','reason':'Skewed','category':'Feature Engineering','confidence':94},
    {'id':5,'column':'Gender','action':'One-hot encoding (drop_first=True)','type':'encode','reason':'Nominal','category':'Categorical Encoding','confidence':91},
    {'id':6,'column':'TotalCharges','action':'IQR winsorization','type':'outlier','reason':'Outliers','category':'Outlier Treatment','confidence':82},
    {'id':7,'column':'Score','action':'StandardScaler','type':'scale','reason':'Scaling','category':'Feature Scaling','confidence':80},
]

try:
    code = generate_pipeline_code(actions, 'customer_churn.csv')
    assert 'def preprocess' in code
    assert 'import pandas' in code
    assert 'import numpy' in code
    assert 'StandardScaler' in code
    assert 'drop_duplicates' in code
    assert 'fillna' in code
    assert 'log1p' in code
    assert 'get_dummies' in code
    assert 'clip' in code
    assert 'fit_transform' in code
    lines = code.splitlines()
    ok(f'generate_pipeline_code() -> {len(lines)} lines')
    ok('pipeline contains all expected code patterns')
except Exception as e:
    fail('generate_pipeline_code', e)

try:
    # The generated code must be valid Python syntax
    import ast
    ast.parse(code)
    ok('generated pipeline.py is valid Python syntax')
except SyntaxError as e:
    fail('pipeline syntax check', e)

print()
print('─── 5. Report Generator ────────────────────────────────')

from report import generate_html_report

try:
    html = generate_html_report(
        dataset_name='test_data.csv',
        health_before=42,
        health_after=93,
        decision_log=[
            {'action':'Drop CustomerID','column':'CustomerID','reason':'Identifier','impact':'High','time_ms':1.2,'status':'success'},
            {'action':'Remove duplicates','column':'Dataset','reason':'Dups','impact':'High','time_ms':3.4,'status':'success'},
        ],
        ml_recommendations=[
            {'model':'Random Forest','type':'Ensemble','suitability':94,'reason':'Good for classification','pros':['Handles mixed types','Robust']},
        ],
        summary='Gemma identified 2 issues and proposed 2 actions.',
        rows_before=1000,
        rows_after=950,
        columns_before=12,
        columns_after=10,
    )
    assert '<!DOCTYPE html>' in html
    assert 'ForgeAI' in html
    assert 'test_data.csv' in html
    assert 'Random Forest' in html
    assert 'Drop CustomerID' in html
    assert len(html) > 5000
    ok(f'generate_html_report() -> {len(html)} chars, valid HTML')
except Exception as e:
    fail('generate_html_report', e)

print()
print('─── 6. AI Client (parse + validate) ────────────────────')

from ai_client import parse_and_validate, build_prompt

# Valid response
try:
    valid_json = json.dumps({
        'summary': 'Test summary',
        'predicted_health_score': 88,
        'actions': [
            {'column':'Age','action':'Median imputation','category':'Missing Value Handling',
             'reason':'14% missing','confidence':89,'type':'impute'}
        ],
        'ml_recommendations': [
            {'model':'Random Forest','type':'Ensemble','suitability':94,'reason':'Good','pros':['Fast']}
        ]
    })
    result = parse_and_validate(valid_json)
    assert result['predicted_health_score'] == 88
    assert result['actions'][0]['id'] == 1  # id auto-assigned
    ok('parse_and_validate() accepts valid JSON')
except Exception as e:
    fail('parse_and_validate valid', e)

# JSON with markdown fences
try:
    fenced = '```json\n' + valid_json + '\n```'
    result2 = parse_and_validate(fenced)
    assert result2['summary'] == 'Test summary'
    ok('parse_and_validate() strips markdown fences')
except Exception as e:
    fail('parse_and_validate fences', e)

# Confidence clamping
try:
    clamped_json = json.dumps({
        'summary': 'x', 'predicted_health_score': 150,
        'actions': [{'column':'x','action':'drop','category':'Identifier Removal',
                     'reason':'x','confidence':200,'type':'drop'}],
        'ml_recommendations': []
    })
    r = parse_and_validate(clamped_json)
    assert r['predicted_health_score'] == 100
    assert r['actions'][0]['confidence'] == 100
    ok('parse_and_validate() clamps scores to 0-100')
except Exception as e:
    fail('parse_and_validate clamping', e)

# Invalid JSON
try:
    parse_and_validate('{not valid json}')
    fail('parse_and_validate bad JSON', 'should have raised ValueError')
except ValueError:
    ok('parse_and_validate() raises ValueError on invalid JSON')

# build_prompt
try:
    profile_stub = {'rows':100,'columns':5,'column_profiles':[]}
    prompt = build_prompt(profile_stub)
    assert 'median imputation' in prompt.lower()
    assert 'json' in prompt.lower()
    ok(f'build_prompt() -> {len(prompt)} char prompt')
except Exception as e:
    fail('build_prompt', e)

print()
print('=' * 60)
print(f'Results: {PASS} passed, {FAIL} failed')
if FAIL == 0:
    print('ALL TESTS PASSED ✅')
else:
    print('SOME TESTS FAILED ❌')
    sys.exit(1)
