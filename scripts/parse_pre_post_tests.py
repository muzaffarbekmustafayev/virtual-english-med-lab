import zipfile
import xml.etree.ElementTree as ET
import os
import sys
import re
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

W_URI = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def get_text(node):
    return ''.join(n.text for n in node.iter(f'{{{W_URI}}}t') if n.text).strip()

def parse_docx(path):
    with zipfile.ZipFile(path) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        body = tree.find(f'{{{W_URI}}}body')
        elements = []
        for child in body:
            tag = child.tag.replace(f'{{{W_URI}}}', '')
            if tag == 'p':
                t = get_text(child)
                if t: elements.append(('p', t))
            elif tag == 'tbl':
                rows = []
                for tr in child.iter(f'{{{W_URI}}}tr'):
                    cells = [get_text(tc) for tc in tr.iter(f'{{{W_URI}}}tc')]
                    if any(cells): rows.append(cells)
                if rows: elements.append(('tbl', rows))
        return elements

def parse_answer_tables_ped_stot_nurs(table_rows):
    """
    Parses answer tables with format:
    ['Question', 'Answer', 'Question', 'Answer']
    or ['Savol', 'Javob', 'Savol', 'Javob']
    or ['№', 'Answer', '№', 'Answer']
    """
    answers = {}
    for row in table_rows:
        if not row: continue
        # Row might have 4 or 2 columns
        # First pair: row[0], row[1]
        c0 = row[0].strip()
        c1 = row[1].strip() if len(row) > 1 else ''
        if c0.isdigit() and c1 and c1.upper() in ['A', 'B', 'C', 'D']:
            answers[int(c0)] = c1.upper()
        # Second pair: row[2], row[3]
        if len(row) >= 4:
            c2 = row[2].strip()
            c3 = row[3].strip()
            if c2.isdigit() and c3 and c3.upper() in ['A', 'B', 'C', 'D']:
                answers[int(c2)] = c3.upper()
    return answers

def parse_davolash_answer_tables(table_rows):
    """
    Parses Davolash answer tables with rows like:
    ['1–10', '1-B, 2-C, 3-B, 4-C, 5-B, 6-B, 7-B, 8-C, 9-C, 10-A']
    """
    answers = {}
    pattern = re.compile(r'(\d+)\s*[-–:]\s*([A-Da-d])')
    for row in table_rows:
        for cell in row:
            for m in pattern.finditer(cell):
                q_num = int(m.group(1))
                ans = m.group(2).upper()
                answers[q_num] = ans
    return answers

def parse_questions_from_paras(paras):
    questions = []
    current_section = ''
    current_q = None

    q_regex = re.compile(r'^(?:Question\s+)?(\d+)[\.\:]\s*(.+)$', re.IGNORECASE)
    opt_regex = re.compile(r'A[\.\)](.+?)B[\.\)](.+?)C[\.\)](.+?)D[\.\)](.+)$')
    opt_single = re.compile(r'^([A-D])[\.\)]\s*(.+)$')

    for p in paras:
        p_clean = p.strip()
        if not p_clean: continue

        # Check if section title
        if (any(p_clean.startswith(x) for x in ['Section ', 'Part ', 'Module ', 'I. ', 'II. ', 'III. ', 'IV. ', 'V. ', 'VI. ', 'VII. ', 'VIII. ']) or
            ('Situation' in p_clean and not q_regex.match(p_clean)) or
            p_clean.startswith('Situation-Based')):
            current_section = p_clean
            continue

        qm = q_regex.match(p_clean)
        if qm:
            num = int(qm.group(1))
            title = qm.group(2).strip()

            # If current_q has no options yet, it might have been a numbered section header!
            if current_q and len(current_q['options']) == 0:
                current_section = current_q['question']
                current_q = None
            elif current_q:
                questions.append(current_q)
                current_q = None

            current_q = {
                'number': num,
                'question': title,
                'section': current_section,
                'options': {}
            }
            continue

        om = opt_regex.search(p_clean)
        if om and current_q:
            current_q['options'] = {
                'A': om.group(1).strip(),
                'B': om.group(2).strip(),
                'C': om.group(3).strip(),
                'D': om.group(4).strip()
            }
            continue

        osm = opt_single.match(p_clean)
        if osm and current_q:
            current_q['options'][osm.group(1).upper()] = osm.group(2).strip()
            continue

        # If question has no options yet and line is not prompt/meta
        if current_q and len(current_q['options']) == 0:
            if not any(p_clean.startswith(x) for x in ['Selected answer', 'Brief justification', 'Your answer', 'Instructions:', 'Choose the best']):
                current_q['question'] += '\n' + p_clean

    if current_q and len(current_q['options']) > 0:
        questions.append(current_q)

    return questions

def process_davolash(docx_path):
    elements = parse_docx(docx_path)
    paras = [el[1] for el in elements if el[0] == 'p']
    tables = [el[1] for el in elements if el[0] == 'tbl']

    # Slice paras
    pre_paras = []
    post_paras = []
    active = None
    for p in paras:
        if 'PART I. PRE-TEST' in p:
            active = 'pre'
            continue
        elif 'PART II. POST-TEST' in p:
            active = 'post'
            continue
        elif 'ANSWER KEY' in p:
            active = None
            break
        if active == 'pre': pre_paras.append(p)
        elif active == 'post': post_paras.append(p)

    pre_qs = parse_questions_from_paras(pre_paras)
    post_qs = parse_questions_from_paras(post_paras)

    # Tables 217 and 219 (or check headers)
    pre_ans = {}
    post_ans = {}
    found_key = False
    for t in tables:
        t_text = ' '.join(' '.join(row) for row in t)
        if '1-B' in t_text or 'Correct answers' in t_text:
            if not pre_ans:
                pre_ans = parse_davolash_answer_tables(t)
            elif not post_ans:
                post_ans = parse_davolash_answer_tables(t)

    # Add correct answers to questions
    for q in pre_qs:
        q['correct_option'] = pre_ans.get(q['number'], 'A')
    for q in post_qs:
        q['correct_option'] = post_ans.get(q['number'], 'A')

    # Clinical simulation situations
    pre_situation = {
        'title': 'Clinical Simulation Situation: Outpatient Consultation',
        'points': 10,
        'scenario': 'You are a doctor in an outpatient clinic. A 55-year-old patient presents with increasing fatigue, light-headedness and shortness of breath when climbing stairs. The patient reports losing 3 kg without trying. He takes antihypertensive medication but sometimes misses doses.\n\nClinical observations:\n- Blood pressure: 98/62 mmHg\n- Pulse: 104/min\n- Oxygen saturation: 96% on room air',
        'task': 'Conduct a brief clinical consultation in English.\n1. Open the consultation and establish rapport.\n2. Ask about symptoms, duration and severity.\n3. Clarify medication use and relevant medical history.\n4. Explain possible causes and appropriate investigations.\n5. Provide suitable safety-netting advice.'
    }

    post_situation = {
        'title': 'Clinical Simulation Situation: Outpatient Consultation',
        'points': 10,
        'scenario': 'You are a doctor in an outpatient clinic. A 49-year-old woman reports progressive fatigue, occasional palpitations and breathlessness when walking uphill. She has noticed reduced energy over the past month. She takes regular medication for hypertension and occasionally forgets doses.\n\nClinical observations:\n- Blood pressure: 102/66 mmHg\n- Pulse: 106/min\n- Oxygen saturation: 97% on room air',
        'task': 'Conduct a brief clinical consultation in English.\n1. Open the consultation and establish rapport.\n2. Ask about symptom onset, duration, severity and associated symptoms.\n3. Explore medication adherence and relevant medical history.\n4. Explain possible causes and appropriate investigations.\n5. Provide suitable safety-netting advice.'
    }

    return {
        'specialty_code': 'GEN_MED',
        'specialty_name': 'Davolash ishi',
        'specialty_name_en': 'General Medicine',
        'pre_test': {
            'title': 'Davolash ishi — Boshlang\'ich Pre-test (Baseline Assessment)',
            'total_mcq': len(pre_qs),
            'questions': pre_qs,
            'situation': pre_situation,
            'max_score': 90,
            'mcq_score_max': 80,
            'situation_score_max': 10
        },
        'post_test': {
            'title': 'Davolash ishi — Yakuniy Post-test (Final Evaluation & Learning Gain)',
            'total_mcq': len(post_qs),
            'questions': post_qs,
            'situation': post_situation,
            'max_score': 90,
            'mcq_score_max': 80,
            'situation_score_max': 10
        }
    }

def process_pediatriya(docx_path):
    elements = parse_docx(docx_path)
    paras = [el[1] for el in elements if el[0] == 'p']
    tables = [el[1] for el in elements if el[0] == 'tbl']

    pre_paras = []
    post_paras = []
    active = None
    for p in paras:
        if 'PART I. PRE-TEST' in p:
            active = 'pre'
            continue
        elif 'PART II. POST-TEST' in p:
            active = 'post'
            continue
        elif 'PART III. ANSWER KEYS' in p:
            active = None
            break
        if active == 'pre': pre_paras.append(p)
        elif active == 'post': post_paras.append(p)

    pre_qs = parse_questions_from_paras(pre_paras)
    post_qs = parse_questions_from_paras(post_paras)

    # Tables: table 0 is pre-test, table 1 is post-test
    ans_tables = [t for t in tables if any('Question' in ' '.join(r) for r in t)]
    pre_ans = parse_answer_tables_ped_stot_nurs(ans_tables[0]) if len(ans_tables) > 0 else {}
    post_ans = parse_answer_tables_ped_stot_nurs(ans_tables[1]) if len(ans_tables) > 1 else {}

    for q in pre_qs:
        q['correct_option'] = pre_ans.get(q['number'], 'A')
    for q in post_qs:
        q['correct_option'] = post_ans.get(q['number'], 'A')

    return {
        'specialty_code': 'PED',
        'specialty_name': 'Pediatriya',
        'specialty_name_en': 'Pediatrics',
        'pre_test': {
            'title': 'Pediatriya — Boshlang\'ich Pre-test (Baseline Assessment)',
            'total_mcq': len(pre_qs),
            'questions': pre_qs,
            'max_score': 100,
            'mcq_score_max': 80,
            'situation_score_max': 20
        },
        'post_test': {
            'title': 'Pediatriya — Yakuniy Post-test (Final Evaluation & Learning Gain)',
            'total_mcq': len(post_qs),
            'questions': post_qs,
            'max_score': 100,
            'mcq_score_max': 80,
            'situation_score_max': 20
        }
    }

def process_nursery(docx_path):
    elements = parse_docx(docx_path)
    paras = [el[1] for el in elements if el[0] == 'p']
    tables = [el[1] for el in elements if el[0] == 'tbl']

    pre_paras = []
    post_paras = []
    active = None
    for p in paras:
        if 'PRE-TEST' in p and not 'POST-TEST' in p and active is None:
            active = 'pre'
            continue
        elif 'ANSWER KEY' in p and active == 'pre':
            active = None
            continue
        elif 'POST-TEST' in p and active is None:
            active = 'post'
            continue
        elif 'Answer key — o‘qituvchi uchun' in p:
            active = None
            break
        if active == 'pre': pre_paras.append(p)
        elif active == 'post': post_paras.append(p)

    pre_qs = parse_questions_from_paras(pre_paras)
    post_qs = parse_questions_from_paras(post_paras)

    # Tables with '№' or 'Savol'
    ans_tables = [t for t in tables if any(('№' in ' '.join(r) or 'Savol' in ' '.join(r)) for r in t)]
    pre_ans = parse_answer_tables_ped_stot_nurs(ans_tables[0]) if len(ans_tables) > 0 else {}
    post_ans = parse_answer_tables_ped_stot_nurs(ans_tables[1]) if len(ans_tables) > 1 else {}

    for q in pre_qs:
        q['correct_option'] = pre_ans.get(q['number'], 'A')
    for q in post_qs:
        q['correct_option'] = post_ans.get(q['number'], 'A')

    return {
        'specialty_code': 'NURSING',
        'specialty_name': 'Hamshiralik ishi',
        'specialty_name_en': 'Nursing',
        'pre_test': {
            'title': 'Hamshiralik ishi — Boshlang\'ich Pre-test (Baseline Assessment)',
            'total_mcq': len(pre_qs),
            'questions': pre_qs,
            'max_score': 100,
            'mcq_score_max': 100,
            'situation_score_max': 0
        },
        'post_test': {
            'title': 'Hamshiralik ishi — Yakuniy Post-test (Final Evaluation & Learning Gain)',
            'total_mcq': len(post_qs),
            'questions': post_qs,
            'max_score': 100,
            'mcq_score_max': 100,
            'situation_score_max': 0
        }
    }

def process_stomatology(docx_path):
    elements = parse_docx(docx_path)
    paras = [el[1] for el in elements if el[0] == 'p']
    tables = [el[1] for el in elements if el[0] == 'tbl']

    pre_paras = []
    post_paras = []
    active = None
    for p in paras:
        if 'PART I. PRE-TEST' in p:
            active = 'pre'
            continue
        elif 'PART II. POST-TEST' in p:
            active = 'post'
            continue
        elif 'PART III. ANSWER KEYS' in p:
            active = None
            break
        if active == 'pre': pre_paras.append(p)
        elif active == 'post': post_paras.append(p)

    pre_qs = parse_questions_from_paras(pre_paras)
    post_qs = parse_questions_from_paras(post_paras)

    ans_tables = [t for t in tables if any('Question' in ' '.join(r) for r in t)]
    pre_ans = parse_answer_tables_ped_stot_nurs(ans_tables[0]) if len(ans_tables) > 0 else {}
    post_ans = parse_answer_tables_ped_stot_nurs(ans_tables[1]) if len(ans_tables) > 1 else {}

    for q in pre_qs:
        q['correct_option'] = pre_ans.get(q['number'], 'A')
    for q in post_qs:
        q['correct_option'] = post_ans.get(q['number'], 'A')

    return {
        'specialty_code': 'STOM',
        'specialty_name': 'Stomatologiya',
        'specialty_name_en': 'Dentistry',
        'pre_test': {
            'title': 'Stomatologiya — Boshlang\'ich Pre-test (Baseline Assessment)',
            'total_mcq': len(pre_qs),
            'questions': pre_qs,
            'max_score': 100,
            'mcq_score_max': 80,
            'situation_score_max': 20
        },
        'post_test': {
            'title': 'Stomatologiya — Yakuniy Post-test (Final Evaluation & Learning Gain)',
            'total_mcq': len(post_qs),
            'questions': post_qs,
            'max_score': 100,
            'mcq_score_max': 80,
            'situation_score_max': 20
        }
    }

def main():
    folder = r'datas\Pre-tests'
    results = {}

    print('Processing Davolash...')
    results['GEN_MED'] = process_davolash(os.path.join(folder, 'Davolash pre-post tests.docx'))
    print(f"  GEN_MED: Pre {len(results['GEN_MED']['pre_test']['questions'])}, Post {len(results['GEN_MED']['post_test']['questions'])}")

    print('Processing Pediatriya...')
    results['PED'] = process_pediatriya(os.path.join(folder, 'Pediatriya pre-post.docx'))
    print(f"  PED: Pre {len(results['PED']['pre_test']['questions'])}, Post {len(results['PED']['post_test']['questions'])}")

    print('Processing Nursery...')
    results['NURSING'] = process_nursery(os.path.join(folder, 'Pre - Post test Nursery.docx'))
    print(f"  NURSING: Pre {len(results['NURSING']['pre_test']['questions'])}, Post {len(results['NURSING']['post_test']['questions'])}")

    print('Processing Stomatology...')
    results['STOM'] = process_stomatology(os.path.join(folder, 'Stomatology pre va post test.docx'))
    print(f"  STOM: Pre {len(results['STOM']['pre_test']['questions'])}, Post {len(results['STOM']['post_test']['questions'])}")

    # FIRST_AID fallback to GEN_MED
    results['FIRST_AID'] = dict(results['GEN_MED'])
    results['FIRST_AID']['specialty_code'] = 'FIRST_AID'
    results['FIRST_AID']['specialty_name'] = 'Tez tibbiy yordam'
    results['FIRST_AID']['specialty_name_en'] = 'First Aid (Emergency Medicine)'

    # Save to json in backend/src/data and datas/
    out_dir_1 = r'backend\src\data'
    os.makedirs(out_dir_1, exist_ok=True)
    out_file_1 = os.path.join(out_dir_1, 'pre_post_tests.json')
    with open(out_file_1, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'Saved to {out_file_1}')

    out_file_2 = r'datas\pre_post_tests.json'
    with open(out_file_2, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'Saved to {out_file_2}')

if __name__ == '__main__':
    main()
