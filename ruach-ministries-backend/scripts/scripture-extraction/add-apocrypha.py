#!/usr/bin/env python3
"""
Add Apocrypha books (37) to canonical-structure.json
Based on standard Septuagint and Pseudepigrapha references
"""

import json
from pathlib import Path

# Apocrypha verse counts (based on standard editions)
APOCRYPHA_BOOKS = {
    # Deuterocanonical (Catholic/Orthodox canon)
    "TOB": {
        "name": "Tobit",
        "chapters": 14,
        "verses": {str(i): v for i, v in enumerate([22, 14, 17, 21, 22, 18, 16, 21, 6, 13, 18, 22, 18, 15], 1)},
        "testament": "apocrypha",
        "genre": "narrative",
        "canonicalOrder": 67
    },
    "JDT": {
        "name": "Judith",
        "chapters": 16,
        "verses": {str(i): v for i, v in enumerate([16, 28, 10, 15, 24, 21, 32, 36, 14, 23, 23, 20, 20, 19, 13, 25], 1)},
        "testament": "apocrypha",
        "genre": "narrative",
        "canonicalOrder": 68
    },
    "ESG": {
        "name": "Additions to Esther",
        "chapters": 7,
        "verses": {str(i): v for i, v in enumerate([22, 23, 15, 17, 14, 14, 10], 1)},
        "testament": "apocrypha",
        "genre": "narrative",
        "canonicalOrder": 69
    },
    "WIS": {
        "name": "Wisdom of Solomon",
        "chapters": 19,
        "verses": {str(i): v for i, v in enumerate([16, 24, 19, 20, 23, 25, 30, 21, 18, 21, 26, 27, 19, 31, 19, 29, 21, 25, 22], 1)},
        "testament": "apocrypha",
        "genre": "wisdom",
        "canonicalOrder": 70
    },
    "SIR": {
        "name": "Sirach (Ecclesiasticus)",
        "chapters": 51,
        "verses": {str(i): v for i, v in enumerate([
            30, 18, 31, 31, 15, 37, 36, 19, 18, 31, 34, 18, 26, 27, 20, 30, 32, 33, 30, 32,
            28, 27, 28, 34, 26, 29, 30, 26, 28, 25, 31, 24, 33, 31, 26, 31, 31, 34, 35, 30,
            22, 25, 33, 23, 26, 20, 25, 25, 16, 29, 30
        ], 1)},
        "testament": "apocrypha",
        "genre": "wisdom",
        "canonicalOrder": 71
    },
    "BAR": {
        "name": "Baruch",
        "chapters": 5,
        "verses": {str(i): v for i, v in enumerate([22, 35, 38, 37, 9], 1)},
        "testament": "apocrypha",
        "genre": "prophecy",
        "canonicalOrder": 72
    },
    "LJE": {
        "name": "Letter of Jeremiah",
        "chapters": 1,
        "verses": {"1": 73},
        "testament": "apocrypha",
        "genre": "epistle",
        "canonicalOrder": 73
    },
    "PAZ": {
        "name": "Prayer of Azariah",
        "chapters": 1,
        "verses": {"1": 68},
        "testament": "apocrypha",
        "genre": "prayer",
        "canonicalOrder": 74
    },
    "SUS": {
        "name": "Susanna",
        "chapters": 1,
        "verses": {"1": 64},
        "testament": "apocrypha",
        "genre": "narrative",
        "canonicalOrder": 75
    },
    "BEL": {
        "name": "Bel and the Dragon",
        "chapters": 1,
        "verses": {"1": 42},
        "testament": "apocrypha",
        "genre": "narrative",
        "canonicalOrder": 76
    },
    "1MA": {
        "name": "1 Maccabees",
        "chapters": 16,
        "verses": {str(i): v for i, v in enumerate([64, 70, 60, 61, 68, 63, 50, 32, 73, 89, 74, 53, 53, 49, 41, 24], 1)},
        "testament": "apocrypha",
        "genre": "history",
        "canonicalOrder": 77
    },
    "2MA": {
        "name": "2 Maccabees",
        "chapters": 15,
        "verses": {str(i): v for i, v in enumerate([36, 32, 40, 50, 27, 31, 42, 36, 29, 38, 38, 45, 26, 46, 39], 1)},
        "testament": "apocrypha",
        "genre": "history",
        "canonicalOrder": 78
    },
    "3MA": {
        "name": "3 Maccabees",
        "chapters": 7,
        "verses": {str(i): v for i, v in enumerate([29, 33, 30, 21, 51, 41, 23], 1)},
        "testament": "apocrypha",
        "genre": "history",
        "canonicalOrder": 79
    },
    "4MA": {
        "name": "4 Maccabees",
        "chapters": 18,
        "verses": {str(i): v for i, v in enumerate([35, 24, 21, 26, 38, 35, 23, 29, 32, 21, 27, 19, 27, 20, 32, 25, 24, 24], 1)},
        "testament": "apocrypha",
        "genre": "philosophy",
        "canonicalOrder": 80
    },
    "1ES": {
        "name": "1 Esdras",
        "chapters": 9,
        "verses": {str(i): v for i, v in enumerate([58, 30, 24, 63, 73, 34, 15, 96, 55], 1)},
        "testament": "apocrypha",
        "genre": "history",
        "canonicalOrder": 81
    },
    "2ES": {
        "name": "2 Esdras",
        "chapters": 16,
        "verses": {str(i): v for i, v in enumerate([40, 48, 36, 52, 56, 59, 140, 63, 47, 60, 46, 51, 58, 48, 63, 78], 1)},
        "testament": "apocrypha",
        "genre": "apocalyptic",
        "canonicalOrder": 82
    },
    "MAN": {
        "name": "Prayer of Manasseh",
        "chapters": 1,
        "verses": {"1": 15},
        "testament": "apocrypha",
        "genre": "prayer",
        "canonicalOrder": 83
    },
    "PS2": {
        "name": "Psalm 151",
        "chapters": 1,
        "verses": {"1": 7},
        "testament": "apocrypha",
        "genre": "poetry",
        "canonicalOrder": 84
    },

    # Pseudepigrapha
    "ENO": {
        "name": "Book of Enoch (1 Enoch)",
        "chapters": 108,
        "verses": {str(i): 20 for i in range(1, 109)},  # Approximate, varies by edition
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 85
    },
    "JUB": {
        "name": "Book of Jubilees",
        "chapters": 50,
        "verses": {str(i): 25 for i in range(1, 51)},  # Approximate
        "testament": "pseudepigrapha",
        "genre": "narrative",
        "canonicalOrder": 86
    },
    "JSR": {
        "name": "Book of Jasher",
        "chapters": 91,
        "verses": {str(i): 30 for i in range(1, 92)},  # Approximate
        "testament": "pseudepigrapha",
        "genre": "history",
        "canonicalOrder": 87
    },
    "ODE": {
        "name": "Odes",
        "chapters": 14,
        "verses": {str(i): 15 for i in range(1, 15)},
        "testament": "pseudepigrapha",
        "genre": "poetry",
        "canonicalOrder": 88
    },
    "PSS": {
        "name": "Psalms of Solomon",
        "chapters": 18,
        "verses": {str(i): v for i, v in enumerate([8, 37, 12, 25, 19, 6, 10, 34, 11, 8, 9, 6, 12, 10, 13, 15, 46, 12], 1)},
        "testament": "pseudepigrapha",
        "genre": "poetry",
        "canonicalOrder": 89
    },
    "EBA": {
        "name": "Epistle of Barnabas",
        "chapters": 21,
        "verses": {str(i): 20 for i in range(1, 22)},
        "testament": "pseudepigrapha",
        "genre": "epistle",
        "canonicalOrder": 90
    },
    "HER": {
        "name": "Shepherd of Hermas",
        "chapters": 114,
        "verses": {str(i): 15 for i in range(1, 115)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 91
    },
    "DID": {
        "name": "Didache",
        "chapters": 16,
        "verses": {str(i): v for i, v in enumerate([6, 7, 10, 14, 2, 3, 4, 3, 5, 7, 12, 5, 7, 3, 4, 8], 1)},
        "testament": "pseudepigrapha",
        "genre": "instruction",
        "canonicalOrder": 92
    },
    "T12": {
        "name": "Testaments of the Twelve Patriarchs",
        "chapters": 12,
        "verses": {str(i): 25 for i in range(1, 13)},
        "testament": "pseudepigrapha",
        "genre": "testament",
        "canonicalOrder": 93
    },
    "ASM": {
        "name": "Assumption of Moses",
        "chapters": 12,
        "verses": {str(i): 15 for i in range(1, 13)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 94
    },
    "MIA": {
        "name": "Martyrdom and Ascension of Isaiah",
        "chapters": 11,
        "verses": {str(i): 20 for i in range(1, 12)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 95
    },
    "2BA": {
        "name": "2 Baruch (Apocalypse of Baruch)",
        "chapters": 87,
        "verses": {str(i): 15 for i in range(1, 88)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 96
    },
    "LAE": {
        "name": "Life of Adam and Eve",
        "chapters": 51,
        "verses": {str(i): 10 for i in range(1, 52)},
        "testament": "pseudepigrapha",
        "genre": "narrative",
        "canonicalOrder": 97
    },
    "APM": {
        "name": "Apocalypse of Moses",
        "chapters": 43,
        "verses": {str(i): 10 for i in range(1, 44)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 98
    },
    "TAB": {
        "name": "Testament of Abraham",
        "chapters": 20,
        "verses": {str(i): 15 for i in range(1, 21)},
        "testament": "pseudepigrapha",
        "genre": "testament",
        "canonicalOrder": 99
    },
    "TIS": {
        "name": "Testament of Isaac",
        "chapters": 9,
        "verses": {str(i): 20 for i in range(1, 10)},
        "testament": "pseudepigrapha",
        "genre": "testament",
        "canonicalOrder": 100
    },
    "TJA": {
        "name": "Testament of Jacob",
        "chapters": 8,
        "verses": {str(i): 15 for i in range(1, 9)},
        "testament": "pseudepigrapha",
        "genre": "testament",
        "canonicalOrder": 101
    },
    "APE": {
        "name": "Apocalypse of Elijah",
        "chapters": 5,
        "verses": {str(i): v for i, v in enumerate([26, 57, 20, 20, 45], 1)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 102
    },
    "2EN": {
        "name": "2 Enoch (Book of the Secrets of Enoch)",
        "chapters": 68,
        "verses": {str(i): 15 for i in range(1, 69)},
        "testament": "pseudepigrapha",
        "genre": "apocalyptic",
        "canonicalOrder": 103
    },
}

def main():
    # Load existing canonical structure
    canon_path = Path(__file__).parent / "canonical-structure.json"

    with open(canon_path) as f:
        canonical_structure = json.load(f)

    # Remove _NOTE if present
    if '_NOTE' in canonical_structure:
        del canonical_structure['_NOTE']

    # Add apocrypha books
    for short_code, book_data in APOCRYPHA_BOOKS.items():
        # Calculate total verses
        total_verses = sum(book_data['verses'].values())

        canonical_structure[short_code] = {
            'name': book_data['name'],
            'chapters': book_data['chapters'],
            'verses': book_data['verses'],
            'totalVerses': total_verses,
            'testament': book_data['testament'],
            'genre': book_data['genre'],
            'canonicalOrder': book_data['canonicalOrder']
        }

    # Add metadata note
    canonical_structure['_META'] = {
        'totalBooks': len([k for k in canonical_structure.keys() if k != '_META']),
        'canonical66': 66,
        'apocrypha': 37,
        'totalVerses': sum(b['totalVerses'] for b in canonical_structure.values() if isinstance(b.get('totalVerses'), int)),
        'testaments': ['tanakh', 'renewed_covenant', 'apocrypha', 'pseudepigrapha'],
        'note': 'Apocrypha verse counts are approximate for some Pseudepigrapha books - adjust based on specific edition used'
    }

    # Save updated structure
    with open(canon_path, 'w') as f:
        json.dump(canonical_structure, f, indent=2, sort_keys=False)

    print(f'✅ Updated {canon_path}')
    print(f'📚 Total books: {canonical_structure["_META"]["totalBooks"]}')
    print(f'📖 Total verses: {canonical_structure["_META"]["totalVerses"]:,}')
    print(f'  - Tanakh: {sum(b["totalVerses"] for b in canonical_structure.values() if b.get("testament") == "tanakh"):,}')
    print(f'  - Renewed Covenant: {sum(b["totalVerses"] for b in canonical_structure.values() if b.get("testament") == "renewed_covenant"):,}')
    print(f'  - Apocrypha: {sum(b["totalVerses"] for b in canonical_structure.values() if b.get("testament") == "apocrypha"):,}')
    print(f'  - Pseudepigrapha: {sum(b["totalVerses"] for b in canonical_structure.values() if b.get("testament") == "pseudepigrapha"):,}')

if __name__ == '__main__':
    main()
