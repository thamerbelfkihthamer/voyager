#!/usr/bin/python
#
# Utility script to enumerate all possible categories and language support
# responses from content tracker csv export

import csv
import json
import string
import sys

CATEGORIES = {
    "Agriculture": "agriculture",
    "Architecture": "architecture",
    "Cars": "cars",
    "Coding": "coding",
    "Comics": "comics",
    "Culinary": "culinary",
    "Design and Art": "design_art",
    "Education": "education",
    "Environmental": "environmental",
    "Game Design": "game_design",
    "Games": "games",
    "Graphic Design": "graphics_design",
    "Language": "language",
    "Math and Science": "math_science",
    "Professional Development": "professional",
    "Robotics": "robotics",
    "Space": "space",
    "Technology": "technology",
    "Vocational and Trade Skills": "vocational",
}

def categoryjson():
    entries = []
    for ctype in CATEGORIES.keys():
        entry = {
            "name": CATEGORIES[ctype],
            "title": {
                "ar": ctype,
                "de": ctype,
                "en": ctype,
            },
            "image": "",
        }
        entries.append(entry)
    print json.dumps(entries, indent=4, separators=(',', ': '))

def parse(i, fields):
    ar = fields[5]
    de = fields[6]
    categories = [string.strip(x) for x in fields[4].split(',')]
    return (categories, ar, de)

def main():
    with open(sys.argv[1], 'r') as f:
        csvreader = csv.reader(f)

        categories = {}
        arabic = {}
        german = {}
        for i, line in enumerate(csvreader):
            if i <= 1:
                continue
            ctypes, ar, de = parse(i, line)
            if ctypes:
                for ctype in ctypes:
                    categories[ctype] = True
            if ar:
                arabic[ar] = True
            if de:
                german[de] = True

        print "\nCategories:"
        for category in sorted(categories.keys()):
            print category

        print "\nArabic:"
        for ar in arabic.keys():
            print ar

        print "\nGerman:"
        for de in german.keys():
            print de

#    categoryjson()

if __name__ == "__main__":
    main()
