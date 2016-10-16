#!/usr/bin/python
#
# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Utility script to enumerate all possible categories and language support
# responses from content tracker csv export

import csv
import json
import string
import sys

CATEGORIES = {
    "Coding": "coding",
    "Design and Art": "design_art",
    "Language": "language",
    "Math and Science": "math_science",
    "Other": "other",
    "Technology": "technology",
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
    mtype = fields[13]
    ar = fields[5]
    de = fields[6]
    categories = [string.strip(x) for x in fields[4].split(',')]
    return (mtype, categories, ar, de)

def main():
    with open(sys.argv[1], 'r') as f:
        csvreader = csv.reader(f)

        types = {}
        categories = {}
        arabic = {}
        german = {}
        for i, line in enumerate(csvreader):
            if i <= 1:
                continue
            mtypes, ctypes, ar, de = parse(i, line)
            if mtypes:
                types[mtypes] = True
            if ctypes:
                for ctype in ctypes:
                    categories[ctype] = True
            if ar:
                arabic[ar] = True
            if de:
                german[de] = True

        print "\nMedia types:"
        for mt in types.keys():
            print mt

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
